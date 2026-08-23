import sys, os, base64
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path('supabase/.env.local'))
sys.path.append('e:/TCG Web App')
from scripts.sync.common.odoo_client import OdooClient
from scripts.sync.common.db import get_supabase

supabase = get_supabase()
odoo = OdooClient()

print("Fetching accessories without images from Supabase...")
accessories = supabase.table('accessories').select('id, odoo_id, name').is_('image_url', 'null').not_.is_('odoo_id', 'null').execute().data

print(f"Found {len(accessories)} accessories without images.")

updated = 0
for acc in accessories:
    odoo_id = acc['odoo_id']
    sb_id = acc['id']
    
    # Fetch image from Odoo
    # We use image_512 to save space and bandwidth, it's usually enough for web catalogs
    product = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'search_read', [[['id', '=', odoo_id]]], {'fields': ['image_512'], 'limit': 1})
    
    if product and product[0].get('image_512'):
        img_b64 = product[0]['image_512']
        img_data = base64.b64decode(img_b64)
        
        file_path = f"accessories/{sb_id}.jpg"
        
        # Upload to Supabase Storage
        res = supabase.storage.from_('public_assets').upload(file_path, img_data, {'content-type': 'image/jpeg', 'upsert': 'true'})
        
        if res.error:
            print(f"Failed to upload image for {acc['name']}: {res.error}")
        else:
            # Get public URL
            public_url = supabase.storage.from_('public_assets').get_public_url(file_path).replace('?format=json', '')
            
            # Update database
            supabase.table('accessories').update({'image_url': public_url}).eq('id', sb_id).execute()
            updated += 1
            print(f"Updated image for {acc['name']}")

print(f"Done! Updated images for {updated} accessories.")
