import psycopg2
import concurrent.futures

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
            connect_timeout=5
        )
        conn.close()
        return region, True
    except Exception as e:
        return region, False

print(f"Scanning regions for {project_ref}...")
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
    results = list(executor.map(try_connect, regions))

for region, success in results:
    if success:
        print(f"SUCCESS: {region}")
    else:
        # print(f"Failed: {region}")
        pass
