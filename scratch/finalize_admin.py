import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Use discovered service key
DEV_URL = "https://bqfkqnnostzaqueujdms.supabase.co"
DEV_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZmtxbm5vc3R6YXF1ZXVqZG1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgwMDY0NSwiZXhwIjoyMDkxMzc2NjQ1fQ.viEd_jZzUR8KSo5a0RwRKQ6K89iVitCr29QpMEIhIYU"

def finalize_admin(email):
    print(f"Finalizing admin for {email}...")
    supabase: Client = create_client(DEV_URL, DEV_SERVICE_KEY)
    
    # 1. Get user ID
    try:
        users = supabase.auth.admin.list_users()
        user = next((u for u in users if u.email == email), None)
        
        if not user:
            print(f"User {email} not found. Creating...")
            user = supabase.auth.admin.create_user({
                "email": email,
                "password": "admin1234",
                "email_confirm": True,
                "app_metadata": {"role": "admin"}
            })
            user_id = user.user.id
            print(f"User created with ID {user_id}")
        else:
            user_id = user.id
            print(f"Found user ID: {user_id}")
            
            # 2. Confirm email and set role in app_metadata
            supabase.auth.admin.update_user_by_id(
                user_id,
                {
                    "email_confirm": True,
                    "app_metadata": {"role": "admin"}
                }
            )
            print(f"User confirmed and metadata updated.")

        # 3. Update profiles table
        print(f"Updating profiles table for {user_id}...")
        res = supabase.table('profiles').upsert({
            "id": user_id,
            "role": "admin",
            "updated_at": "now()"
        }).execute()
        print(f"Profile update result: {res}")
        
        print(f"\nSUCCESS: User {email} is now an admin.")
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    finalize_admin("test@geeko.com")
