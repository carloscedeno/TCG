import os
import psycopg2
import concurrent.futures
from dotenv import load_dotenv

load_dotenv('.env.dev')

regions = [
    'us-west-2', 'us-east-1', 'us-east-2', 'us-west-1', 
    'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3', 
    'ap-southeast-1', 'ap-northeast-1', 'ap-northeast-2', 'ap-southeast-2', 'ap-south-1',
    'sa-east-1'
]

project_ref = "bqfkqnnostzaqueujdms"
password = "jLta9LqEmpMzCI5r"

def try_connect(region):
    host = f"aws-0-{region}.pooler.supabase.com"
    try:
        conn = psycopg2.connect(
            user=f"postgres.{project_ref}",
            password=password,
            host=host,
            port=6543,
            dbname="postgres",
            connect_timeout=3
        )
        conn.close()
        return region, True, None
    except Exception as e:
        return region, False, str(e)

print(f"Scanning regions for {project_ref}...")
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
    results = list(executor.map(try_connect, regions))

found = False
for region, success, error in results:
    if success:
        print(f"✅ SUCCESS: {region}")
        found = True
    else:
        if "tenant/user" not in error:
            # print(f"❌ Failed: {region} ({error})")
            pass

if not found:
    print("❌ No regions found. Trying direct connection hosts...")
    # Try direct connection with different variations
    direct_hosts = [
        f"db.{project_ref}.supabase.co",
        f"{project_ref}.supabase.co",
        f"db.{project_ref}.supabase.net"
    ]
    for host in direct_hosts:
        try:
            conn = psycopg2.connect(
                user=f"postgres.{project_ref}",
                password=password,
                host=host,
                port=5432,
                dbname="postgres",
                connect_timeout=3
            )
            conn.close()
            print(f"✅ SUCCESS DIRECT: {host}")
            found = True
        except Exception as e:
            print(f"❌ Failed Direct: {host} ({e})")
