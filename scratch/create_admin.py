import os
import psycopg2
from dotenv import load_dotenv

# Load dev environment variables
load_dotenv('.env.dev')

def create_admin_user(email, password):
    db_url = os.getenv('DATABASE_URL_POOLER') or os.getenv('DATABASE_URL')
    if not db_url:
        print("Error: DATABASE_URL not found in .env.dev")
        return False
    
    # Strip query parameters for psycopg2
    if '?' in db_url:
        db_url = db_url.split('?')[0]

    print(f"Connecting to database to create admin: {email}")
    
    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        cur = conn.cursor()

        # 1. Enable pgcrypto if not enabled
        cur.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")

        # 2. Check if user exists
        cur.execute("SELECT id FROM auth.users WHERE email = %s", (email,))
        existing_user = cur.fetchone()

        user_id = None
        if existing_user:
            user_id = existing_user[0]
            print(f"User {email} already exists with ID {user_id}. Updating password...")
            cur.execute("""
                UPDATE auth.users 
                SET encrypted_password = crypt(%s, gen_salt('bf')),
                    updated_at = now()
                WHERE id = %s
            """, (password, user_id))
        else:
            print(f"Creating new user {email}...")
            import uuid
            user_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO auth.users (
                    instance_id, id, aud, role, email, encrypted_password, 
                    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
                    created_at, updated_at, last_sign_in_at, confirmation_token, 
                    is_super_admin
                )
                VALUES (
                    '00000000-0000-0000-0000-000000000000',
                    %s, 'authenticated', 'authenticated', %s, 
                    crypt(%s, gen_salt('bf')),
                    now(), '{"provider":"email","providers":["email"]}', '{}',
                    now(), now(), now(), '', false
                )
            """, (user_id, email, password))
            print(f"User created with ID {user_id}")

        # 3. Ensure profile exists and is admin
        cur.execute("""
            INSERT INTO public.profiles (id, role, updated_at)
            VALUES (%s, 'admin', now())
            ON CONFLICT (id) DO UPDATE SET role = 'admin', updated_at = now();
        """, (user_id,))
        print(f"Profile updated to admin for {email}")

        # 4. (Optional but recommended) Update raw_app_meta_data to include role
        cur.execute("""
            UPDATE auth.users 
            SET raw_app_meta_data = jsonb_set(
                COALESCE(raw_app_meta_data, '{}'::jsonb),
                '{role}',
                '"admin"'
            )
            WHERE id = %s
        """, (user_id,))
        print(f"Metadata updated for {email}")

        # 5. Check auth.identities
        try:
            cur.execute("SELECT count(*) FROM auth.identities WHERE user_id = %s", (user_id,))
            identity_count = cur.fetchone()[0]
            if identity_count == 0:
                print(f"Creating identity for {email}...")
                cur.execute("""
                    INSERT INTO auth.identities (
                        id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
                    )
                    VALUES (
                        %s, %s, jsonb_build_object('sub', %s, 'email', %s), 'email', now(), now(), now()
                    )
                """, (user_id, user_id, user_id, email))
                print(f"Identity created for {email}")
        except Exception as e:
            print(f"Warning: Could not check/create identity: {e}")

        cur.close()
        conn.close()
        print("SUCCESS: Admin user created/updated successfully.")
        return True

    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    import sys
    email = "test@geeko.com"
    password = "admin1234"
    if len(sys.argv) > 1:
        email = sys.argv[1]
    if len(sys.argv) > 2:
        password = sys.argv[2]
        
    create_admin_user(email, password)
