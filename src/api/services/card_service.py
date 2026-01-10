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
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        try:
            # Determine joins
            cards_join = "cards!inner" if (q or rarity or game or color) else "cards"
            sets_join = "sets!inner" if set_name else "sets"
            
            query = supabase.table('card_printings').select(
                f'printing_id, image_url, '
                f'{cards_join}(card_id, card_name, type_line, rarity, game_id, colors), '
                f'{sets_join}(set_name), '
                'aggregated_prices(avg_market_price_usd)',
                count='exact'
            )
            
            if q: query = query.ilike('cards.card_name', f'%{q}%')
            if rarity:
                rarities = [r.strip().lower() for r in rarity.split(',')]
                query = query.in_('cards.rarity', rarities)
            if game:
                game_names = [g.strip() for g in game.split(',')]
                game_map = {'Magic: The Gathering': 22, 'Pokémon': 23, 'Lorcana': 24, 'Yu-Gi-Oh!': 26}
                game_ids = [game_map[gn] for gn in game_names if gn in game_map]
                if game_ids: query = query.in_('cards.game_id', game_ids)
            if set_name:
                set_list = [s.strip() for s in set_name.split(',')]
                query = query.in_('sets.set_name', set_list)
            if color:
                color_names = [c.strip() for c in color.split(',')]
                color_map = {'White': 'W', 'Blue': 'U', 'Black': 'B', 'Red': 'R', 'Green': 'G', 'Colorless': 'C'}
                color_codes = [color_map[cn] for cn in color_names if cn in color_map]
                if color_codes: query = query.overlap('cards.colors', color_codes)

            query = query.limit(limit).offset(offset)
            response = query.execute()
            
            cards = []
            for item in response.data:
                if not item.get('cards'): continue
                card_data = item.get('cards')
                set_data = item.get('sets') or {}
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
            
            return {"cards": cards, "total_count": response.count}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    async def get_card_details(printing_id: str) -> Dict[str, Any]:
        try:
            from .valuation_service import ValuationService
            
            query = supabase.table('card_printings').select(
                'printing_id, image_url, artist, flavor_text, collector_number, rarity, card_faces, '
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
            
            # Fetch valuation
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
                "card_faces": item.get('card_faces')
            }
        except Exception as e:
            if isinstance(e, HTTPException): raise e
            raise HTTPException(status_code=500, detail=str(e))
