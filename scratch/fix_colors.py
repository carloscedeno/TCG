import os
import re

patterns = {
    r'#00AEB4': '#0099FF',
    r'#00D1FF': '#0099FF',
    r'rgba\(0, 174, 180': 'rgba(0, 153, 255',
    r'rgba\(0,174,180': 'rgba(0, 153, 255',
    r'rgba\(0, 209, 255': 'rgba(0, 153, 255',
    r'rgba\(0,209,255': 'rgba(0, 153, 255',
    r'geeko-green': 'geeko-cyan',
    r'text-emerald-500': 'text-geeko-cyan',
    r'bg-emerald-500': 'bg-geeko-cyan',
    r'border-emerald-500': 'border-geeko-cyan',
}

def replace_in_file(file_path):
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    new_content = content
    for pattern, replacement in patterns.items():
        new_content = re.sub(pattern, replacement, new_content, flags=re.IGNORECASE)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated: {file_path}")

root_dir = r'e:\TCG Web App\frontend\src'
for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith(('.tsx', '.ts', '.css')):
            replace_in_file(os.path.join(root, file))
