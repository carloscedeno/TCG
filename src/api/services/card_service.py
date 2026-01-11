from typing import Optional, List, Dict, Any
from fastapi import HTTPException
from ..utils.supabase_client import supabase

class CardService:
    @staticmethod
    async def get_cards(
        q: Optional[str] = None,
        game: Optional[str] = None,
        set_name: Optional[str] = None,
        rarity: Optional[str] = None,
        color: Optional[str] = None,
        card_type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        try:
            # Base selection
            select_parts = [
                'printing_id',
                'image_url',
                'cards!inner(card_id, card_name, type_line, rarity, game_id, colors)' if (q or rarity or game or color or card_type) else 'cards(card_id, card_name, type_line, rarity, game_id, colors)',
                'sets!inner(set_name)' if set_name else 'sets(set_name)',
                'aggregated_prices(avg_market_price_usd)'
            ]
            
            query = supabase.table('card_printings').select(
                ', '.join(select_parts),
                count='planned'
            )
            
            # Apply filters
            if q:
                query = query.ilike('cards.card_name', f'%{q}%')
            
            if rarity:
                rarities = [r.strip().lower() for r in rarity.split(',')]
                query = query.in_('cards.rarity', rarities)
                
            if game:
                game_names = [g.strip() for g in game.split(',')]
                game_map = {'Magic: The Gathering': 22, 'Pokémon': 23, 'Lorcana': 24, 'Yu-Gi-Oh!': 26}
                game_ids = [game_map[gn] for gn in game_names if gn in game_map]
                if game_ids:
                    query = query.in_('cards.game_id', game_ids)
            
            if set_name:
                set_list = [s.strip() for s in set_name.split(',')]
                query = query.in_('sets.set_name', set_list)
            
            if color:
                color_names = [c.strip() for c in color.split(',')]
                color_map = {
                    'White': 'W', 'Blue': 'U', 'Black': 'B', 'Red': 'R', 'Green': 'G', 
                    'Colorless': 'C', 'Multicolor': 'M'
                }
                color_codes = [color_map[cn] for cn in color_names if cn in color_map]
                
                if color_codes:
                    if 'C' in color_codes:
                        query = query.is_('cards.colors', 'null')
                    elif 'M' in color_codes:
                        # Multicolor: colors array length > 1 (hard to do in raw PostgREST without RPC, 
                        # so we'll just allow multiple colors if selected together)
                        pass
                    else:
                        # Use overlap operator for array colors
                        # Format for PostgREST overlap: {W,U}
                        codes_str = '{' + ','.join(color_codes) + '}'
                        query = query.filter('cards.colors', 'ov', codes_str)

            if card_type:
                types = [t.strip() for t in card_type.split(',')]
                for t in types:
                    query = query.ilike('cards.type_line', f'%{t}%')

            # Order and Pagination
            query = query.order('printing_id', desc=True).range(offset, offset + limit - 1)
            
            response = query.execute()
            
            cards = []
            for item in response.data:
                card_data = item.get('cards')
                if not card_data: continue
                
                set_data = item.get('sets') or {}
                if isinstance(set_data, list): set_data = set_data[0] if set_data else {}
                
                price_data = item.get('aggregated_prices') or []
                price = price_data[0].get('avg_market_price_usd', 0) if price_data else 0
                
                cards.append({
                    "card_id": item.get('printing_id'),
                    "name": card_data.get('card_name'),
                    "type": card_data.get('type_line'),
                    "set": set_data.get('set_name', ''),
                    "price": price,
                    "image_url": item.get('image_url'),
                    "rarity": card_data.get('rarity')
                })
            
            return {"cards": cards, "total_count": response.count or 0}
            
        except Exception as e:
            import traceback
            error_msg = str(e)
            print(f"❌ [CardService Error]: {error_msg}")
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Search service error: {error_msg}")

    @staticmethod
    async def get_card_details(printing_id: str) -> Dict[str, Any]:
        try:
            from .valuation_service import ValuationService
            
            # 1. Fetch the requested printing details
            query = supabase.table('card_printings').select(
                'printing_id, card_id, image_url, artist, flavor_text, collector_number, rarity, card_faces, '
                'cards(card_name, type_line, oracle_text, mana_cost, power, toughness, legalities, colors), '
                'sets(set_name, set_code), '
                'aggregated_prices(avg_market_price_usd)'
            ).eq('printing_id', printing_id).single()
            
            response = query.execute()
            item = response.data
            if not item:
                raise HTTPException(status_code=404, detail="Card not found")
                
            card_data = item.get('cards') or {}
            set_data = item.get('sets') or {}
            # 2. Fetch ALL printings for this card (oracle_id)
            # We want set info and prices for each. Added limit of 100 to prevent timeouts.
            all_versions = []
            try:
                all_printings_query = supabase.table('card_printings').select(
                    'printing_id, rarity, collector_number, image_url, '
                    'sets!inner(set_name, set_code, release_date), '
                    'aggregated_prices(avg_market_price_usd)'
                ).eq('card_id', oracle_id).limit(100).execute()
                
                all_printings_data = all_printings_query.data or []
                
                # Sort printings by release date (latest first)
                all_printings_data.sort(
                    key=lambda x: (x.get('sets', {}).get('release_date') or '0000-00-00'), 
                    reverse=True
                )
                
                # Map printings for the frontend
                for p in all_printings_data:
                    ps = p.get('sets') or {}
                    price_data = p.get('aggregated_prices') or []
                    price = price_data[0].get('avg_market_price_usd', 0) if price_data else 0
                    
                    all_versions.append({
                        "printing_id": p['printing_id'],
                        "set_name": ps.get('set_name'),
                        "set_code": ps.get('set_code'),
                        "collector_number": p.get('collector_number'),
                        "rarity": p.get('rarity'),
                        "price": price,
                        "image_url": p.get('image_url')
                    })
            except Exception as inner_e:
                print(f"⚠️ [CardService] Warning fetching versions: {inner_e}")
                # We still return the card details even if versions fail
                all_versions = []

            # Fetch valuation for the main printing
            valuation = await ValuationService.get_two_factor_valuation(printing_id)
                
            return {
                "card_id": item.get('printing_id'),
                "name": card_data.get('card_name'),
                "mana_cost": card_data.get('mana_cost'),
                "type": card_data.get('type_line'),
                "oracle_text": card_data.get('oracle_text'),
                "flavor_text": item.get('flavor_text'),
                "artist": item.get('artist'),
                "rarity": item.get('rarity'),
                "set": set_data.get('set_name'),
                "set_code": set_data.get('set_code'),
                "collector_number": item.get('collector_number'),
                "legalities": card_data.get('legalities'),
                "image_url": item.get('image_url'),
                "price": valuation.get('store_price', 0),
                "valuation": valuation,
                "colors": card_data.get('colors'),
                "card_faces": item.get('card_faces'),
                "all_versions": all_versions
            }
        except Exception as e:
            if isinstance(e, HTTPException): raise e
            raise HTTPException(status_code=500, detail=str(e))
