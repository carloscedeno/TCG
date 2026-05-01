import os
import sys
from pathlib import Path

# PRODUCTION CREDENTIALS
PROD_DB = "postgresql://postgres.sxuotvogwvmxuvwbsscv:jLta9LqEmpMzCI5r@aws-0-us-west-2.pooler.supabase.com:6543/postgres"
PROD_SUPABASE_URL = "https://sxuotvogwvmxuvwbsscv.supabase.co"
# I need the real SERVICE_ROLE_KEY to use the supabase client
# Wait, I don't have it!

# But wait, ck_sync.py uses get_supabase() from common.db
# Let's check common.db
