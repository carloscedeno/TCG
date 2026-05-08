import os
import re

root_dir = 'frontend/src'
replacements = {
    r'geeko-cyan-neon': 'white',
    r'geeko-cyan': 'white',
    r'geeko-green': 'white',
    r'neon-text-cyan': 'text-white',
    r'bg-cyan-500': 'bg-white',
    r'text-cyan-400': 'text-white',
    r'to-cyan-500': 'to-white',
    r'text-geeko-cyan': 'text-white',
    r'bg-geeko-cyan': 'bg-white',
    r'border-geeko-cyan': 'border-white',
    r'shadow-geeko-cyan': 'shadow-white/20',
    r'rgba\(0,\s*229,\s*255,\s*[\d.]+\)': 'rgba(255, 255, 255, 0.1)',
    r'rgba\(0,229,255,[\d.]+\)': 'rgba(255, 255, 255, 0.1)',
    r'rgba\(0,\s*255,\s*133,\s*[\d.]+\)': 'rgba(255, 255, 255, 0.1)',
    r'rgba\(0,255,133,[\d.]+\)': 'rgba(255, 255, 255, 0.1)',
    r'from-pink-500\s+via-purple-500\s+to-cyan-500': 'white',
    r'bg-gradient-to-r\s+from-pink-500\s+via-purple-500\s+to-cyan-500': 'bg-white/10',
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
