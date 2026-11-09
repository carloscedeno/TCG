import os
import sys
from pathlib import Path
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
sys.path.append(str(PROJECT_ROOT))

load_dotenv(PROJECT_ROOT / ".env.dev")
load_dotenv(PROJECT_ROOT / ".env")

from scripts.sync.common.db import get_supabase

def fix_images():
    sb = get_supabase()
    supabase_url = str(sb.supabase_url)
    print(f"Target Supabase URL: {supabase_url}")
    assert "bqfkqnnostzaqueujdms" in supabase_url, "Must be DEV"
    assert "sxuotvogwvmxuvwbsscv" not in supabase_url, "Cannot be PROD"

    prods = sb.table("products").select("id, name, image_url, printing_id").execute().data
    scan_prods = [p for p in prods if "user-uploads" in (p.get("image_url") or "")]
    print(f"Total products in DEV: {len(prods)}")
    print(f"Products with robot camera scan URLs: {len(scan_prods)}")

    updated_count = 0
    for p in scan_prods:
        prod_id = p["id"]
        pr_id = p["printing_id"]
        scan_url = p["image_url"]

        pr_res = sb.table("card_printings").select("image_url_normal, related_uris, tcg_specific_printing_attributes").eq("printing_id", pr_id).single().execute()
        pr_data = pr_res.data
        official_url = pr_data.get("image_url_normal")

        if not official_url:
            print(f"Warning: No official url for product {p['name']} (printing {pr_id})")
            continue

        # Preserve scan url in related_uris and tcg_specific_printing_attributes
        rel = pr_data.get("related_uris") or {}
        rel["raw_scan_url"] = scan_url

        attrs = pr_data.get("tcg_specific_printing_attributes") or {}
        attrs["raw_scan_url"] = scan_url

        # Update card_printings
        sb.table("card_printings").update({
            "image_url": official_url,
            "related_uris": rel,
            "tcg_specific_printing_attributes": attrs
        }).eq("printing_id", pr_id).execute()

        # Update products
        sb.table("products").update({
            "image_url": official_url
        }).eq("id", prod_id).execute()

        updated_count += 1
        print(f"[{updated_count}/{len(scan_prods)}] Fixed '{p['name']}':")
        print(f"   -> Official: {official_url}")

    print(f"\nAll {updated_count} products and printings successfully updated to official images!")

if __name__ == "__main__":
    fix_images()
