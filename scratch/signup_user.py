import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('.env.dev')

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_ANON_KEY')

def signup_user(email, password):
    print(f"Attempting to signup user {email} via Supabase API...")
    supabase: Client = create_client(url, key)
    
    try:
        # Try to signup
        res = supabase.auth.sign_up({
            "email": email,
            "password": password,
        })
        print(f"Signup response: {res}")
        return True
    except Exception as e:
        print(f"Signup error: {e}")
        # If user already exists, it might fail or return a specific error
        if "already registered" in str(e).lower():
            print("User already exists.")
            return True
        return False

if __name__ == "__main__":
    signup_user("test@geeko.com", "admin1234")
