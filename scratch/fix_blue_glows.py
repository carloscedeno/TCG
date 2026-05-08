import os
import re

root_dir = 'frontend/src'
# We are restoring Electric Blue (#0099FF) which is rgba(0, 153, 255)
replacements = {
    r'rgba\(0,\s*229,\s*255,\s*': 'rgba(0, 153, 255, ',
    r'rgba\(0,229,255,': 'rgba(0, 153, 255,',
    r'#00D1FF': '#0099FF', # Re-map old cyan to electric blue
    r'#00FF85': '#0099FF', # Re-map old green to electric blue where it was used as glow
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
                    print(f"Updated: {path}")
            except Exception as e:
                print(f"Error processing {path}: {e}")
