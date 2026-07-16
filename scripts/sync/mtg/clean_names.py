import sys
import os
import re
from pathlib import Path

# Add project root to path
current_dir = Path(__file__).parent
sys.path.append(str(current_dir.parent.parent.parent))

from scripts.sync.common.db import get_supabase

def clean_names():
    supabase = get_supabase()
    batch_size = 500
    start = 0
    total_updated = 0
    
    print("Fetching all products...")
    items = []
    limit = 1000
    offset = 0
    while True:
        res = supabase.table('products').select('id, name, set_code, finish, condition').order('id').range(offset, offset + limit - 1).execute()
        items.extend(res.data)
        if len(res.data) < limit:
            break
        offset += limit
    
    updates = []
    
    for item in items:
        original_name = item.get('name', '')
        if not original_name:
            continue
            
        clean_name = original_name
        
        while re.match(r'^\[[A-Z0-9]+\]\s+', clean_name):
            clean_name = re.sub(r'^\[[A-Z0-9]+\]\s+', '', clean_name)
            
        while re.search(r'\s+-\s+[A-Z]+$', clean_name) or re.search(r'\s+\(Foil\)$', clean_name) or re.search(r'\s+\(Descatalogada\)$', clean_name):
            clean_name = re.sub(r'\s+-\s+[A-Z]+$', '', clean_name)
            clean_name = re.sub(r'\s+\(Foil\)$', '', clean_name)
            clean_name = re.sub(r'\s+\(Descatalogada\)$', '', clean_name)
            
        if clean_name != original_name:
            updates.append({'id': item['id'], 'name': clean_name})
            
    print(f"Found {len(updates)} products to clean out of {len(items)}")
    
    # Update in batches
    for i in range(0, len(updates), batch_size):
        batch = updates[i:i+batch_size]
        print(f"Updating batch {i} to {i+len(batch)}...")
        supabase.table('products').upsert(batch).execute()
        
    print("Done cleaning names.")

if __name__ == '__main__':
    clean_names()
