import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def fix_relationships():
    try:
        conn = psycopg2.connect(
            host=os.getenv('host'),
            port=os.getenv('port'),
            user=os.getenv('user'),
            password=os.getenv('password'),
            dbname=os.getenv('dbname')
        )
        cur = conn.cursor()
        
        print("Adding foreign key constraints...")
        
        # Add FK from card_printings to cards
        try:
            cur.execute("ALTER TABLE card_printings ADD CONSTRAINT fk_card_printings_cards FOREIGN KEY (card_id) REFERENCES cards(card_id);")
            print("Added FK: card_printings -> cards")
        except Exception as e:
            print(f"Could not add FK card_printings -> cards: {e}")
            conn.rollback()
        else:
            conn.commit()

        # Add FK from card_printings to sets
        try:
            cur.execute("ALTER TABLE card_printings ADD CONSTRAINT fk_card_printings_sets FOREIGN KEY (set_id) REFERENCES sets(set_id);")
            print("Added FK: card_printings -> sets")
        except Exception as e:
            print(f"Could not add FK card_printings -> sets: {e}")
            conn.rollback()
        else:
            conn.commit()

        # Add FK from aggregated_prices to card_printings
        try:
            cur.execute("ALTER TABLE aggregated_prices ADD CONSTRAINT fk_aggregated_prices_printings FOREIGN KEY (printing_id) REFERENCES card_printings(printing_id);")
            print("Added FK: aggregated_prices -> card_printings")
        except Exception as e:
            print(f"Could not add FK aggregated_prices -> card_printings: {e}")
            conn.rollback()
        else:
            conn.commit()

        # Add FK from sets to games
        try:
            cur.execute("ALTER TABLE sets ADD CONSTRAINT fk_sets_games FOREIGN KEY (game_id) REFERENCES games(game_id);")
            print("Added FK: sets -> games")
        except Exception as e:
            print(f"Could not add FK sets -> games: {e}")
            conn.rollback()
        else:
            conn.commit()

        # Add FK from cards to games
        try:
            cur.execute("ALTER TABLE cards ADD CONSTRAINT fk_cards_games FOREIGN KEY (game_id) REFERENCES games(game_id);")
            print("Added FK: cards -> games")
        except Exception as e:
            print(f"Could not add FK cards -> games: {e}")
            conn.rollback()
        else:
            conn.commit()

        cur.close()
        conn.close()
        print("Finished fixing relationships.")
        
    except Exception as e:
        print(f"Error connecting to database: {e}")

if __name__ == "__main__":
    fix_relationships()
