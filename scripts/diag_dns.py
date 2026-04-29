import os
import socket
import sys

def diag():
    url = os.getenv('SUPABASE_URL', '')
    print(f"DEBUG: SUPABASE_URL length: {len(url)}")
    if len(url) > 4:
        print(f"DEBUG: SUPABASE_URL starts with: {url[:2]}... and ends with: ...{url[-2:]}")
    
    # Try to clean it like the script does
    clean_url = url.strip().replace('"', '').replace("'", "")
    if clean_url and not clean_url.startswith('http'):
        if '.supabase.co' in clean_url:
            clean_url = f"https://{clean_url}"
        else:
            clean_url = f"https://{clean_url}.supabase.co"
    
    print(f"DEBUG: Cleaned URL: {clean_url.replace(url[2:-2], '***') if len(url) > 4 else '***'}")
    
    # Try DNS resolution of the hostname
    try:
        hostname = clean_url.split('//')[-1].split('/')[0]
        print(f"DEBUG: Target hostname: {hostname}")
        ip = socket.gethostbyname(hostname)
        print(f"DEBUG: Successfully resolved {hostname} to {ip}")
    except Exception as e:
        print(f"DEBUG: DNS Resolution failed for {hostname}: {e}")

if __name__ == "__main__":
    diag()
