import os
import re

root_dir = 'frontend/src'
# Restoring original Geeko Cyan (#00D1FF) which is rgba(0, 209, 255)
replacements = {
    r'rgba\(0,\s*153,\s*255,\s*': 'rgba(0, 209, 255, ',
    r'rgba\(0,153,255,': 'rgba(0, 209, 255,',
    r'#0099FF': '#00D1FF',
}

for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith(('.tsx', '.css', '.ts')):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = content
                for old, new in replacements.items():
                    new_content = re.sub(old, new, new_content)
                
                if new_content != content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Restored: {path}")
            except Exception as e:
                print(f"Error processing {path}: {e}")
