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
        sort: Optional[str] = "name",
        year_from: Optional[int] = None,
        year_to: Optional[int] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        try:
            # Base selection: We query CARDS (Unique Oracles)
            # and join with printings to get an image and price.
            # We filter for 'en' printings by default to keep it clean.
            select_parts = [
                'card_id, card_name, type_line, rarity, game_id, colors',
                'card_printings(printing_id, image_url, sets(set_name, set_code, release_date), aggregated_prices(avg_market_price_usd))'
            ]
            
            # If set_name or date filters are applied, we need an inner join on printings
            if set_name or year_from or year_to:
                select_parts[1] = 'card_printings!inner(printing_id, image_url, sets!inner(set_name, set_code, release_date), aggregated_prices(avg_market_price_usd))'

            query = supabase.table('cards').select(
                ', '.join(select_parts),
                count='planned'
            )
            
            # Apply filters (directly on 'cards' table)
            if q:
                query = query.ilike('card_name', f'%{q}%')
            
            if rarity:
                rarities = [r.strip().lower() for r in rarity.split(',')]
                query = query.in_('rarity', rarities)
                
            if game:
                game_names = [g.strip() for g in game.split(',')]
                game_map = {'Magic: The Gathering': 22, 'Pokémon': 23, 'Lorcana': 24, 'Yu-Gi-Oh!': 26}
                game_ids = [game_map[gn] for gn in game_names if gn in game_map]
                if game_ids:
                    query = query.in_('game_id', game_ids)
            
            if set_name:
                set_list = [s.strip() for s in set_name.split(',')]
                query = query.in_('card_printings.sets.set_name', set_list)
            
            if color:
                color_names = [c.strip() for c in color.split(',')]
                color_map = {'White': 'W', 'Blue': 'U', 'Black': 'B', 'Red': 'R', 'Green': 'G', 'Colorless': 'C'}
                color_codes = [color_map[cn] for cn in color_names if cn in color_map]
                if color_codes:
                    if 'C' in color_codes:
                        query = query.is_('colors', 'null')
                    else:
                        codes_str = '{' + ','.join(color_codes) + '}'
                        query = query.filter('colors', 'ov', codes_str)

            if card_type:
                types = [t.strip() for t in card_type.split(',')]
                for t in types:
                    query = query.ilike('type_line', f'%{t}%')

            if year_from:
                query = query.gte('card_printings.sets.release_date', f'{year_from}-01-01')
            if year_to:
                query = query.lte('card_printings.sets.release_date', f'{year_to}-12-31')

            # Pagination and Execution
            if sort == "release_date":
                # BUG FIX: PostgREST cannot sort by card_printings.sets.release_date directly from the cards root
                # if there isn't a single-path join or a computed column.
                # For now, we fall back to name sorting to prevent 500 errors.
                # TODO: Implement a database view or a 'latest_release_date' column on 'cards' table.
                query = query.order('card_name', desc=False)
            else:
                query = query.order('card_name', desc=False)
                
            query = query.range(offset, offset + limit - 1)
            response = query.execute()
            
            cards = []
            for item in response.data:
                printings = item.get('card_printings') or []
                if not printings:
                    continue
                
                # Sort printings by release date and pick latest
                printings.sort(
                    key=lambda x: (x.get('sets', {}).get('release_date') or '0000-00-00'), 
                    reverse=True
                )
                
                latest = printings[0]
                price_data = latest.get('aggregated_prices') or []
                price = price_data[0].get('avg_market_price_usd', 0) if price_data else 0
                
                cards.append({
                    "card_id": latest.get('printing_id'), # We still pass printing_id for the modal
                    "oracle_id": item.get('card_id'),
                    "name": item.get('card_name'),
                    "type": item.get('type_line'),
                    "set": latest.get('sets', {}).get('set_name', ''),
                    "price": price,
                    "image_url": latest.get('image_url'),
                    "rarity": item.get('rarity')
                })
            
            return {"cards": cards, "total_count": response.count or 0}
            
        except Exception as e:
            print(f"❌ [CardService Error]: {e}")
            raise HTTPException(status_code=500, detail=str(e))

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
            oracle_id = item.get('card_id') # FIX: Define oracle_id
            
            # 2. Fetch ALL printings for this card (oracle_id)
            all_versions = []
            if oracle_id:
                try:
                    p_query = supabase.table('card_printings').select(
                        'printing_id, rarity, collector_number, image_url, '
                        'sets!inner(set_name, set_code, release_date), '
                        'aggregated_prices(avg_market_price_usd)'
                    ).eq('card_id', oracle_id).limit(50).execute()
                    
                    p_data = p_query.data or []
                    p_data.sort(key=lambda x: (x.get('sets', {}).get('release_date') or '0000-00-00'), reverse=True)
                    
                    for p in p_data:
                        ps = p.get('sets') or {}
                        pd = p.get('aggregated_prices') or []
                        price = pd[0].get('avg_market_price_usd', 0) if pd else 0
                        
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
                    print(f"⚠️ Versions fetch error: {inner_e}")

            # Fetch valuation for the main printing
            valuation = await ValuationService.get_two_factor_valuation(printing_id)
                
            return {
                "card_id": item.get('printing_id'),
                "oracle_id": oracle_id,
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
                "price": valuation.get('valuation_avg', 0), # Show average valuation as primary
                "valuation": valuation,
                "colors": card_data.get('colors'),
                "card_faces": item.get('card_faces'),
                "all_versions": all_versions
            }
        except Exception as e:
            if isinstance(e, HTTPException): raise e
            raise HTTPException(status_code=500, detail=str(e))
