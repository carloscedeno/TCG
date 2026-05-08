import os

root_dir = 'frontend/src'
replacements = {
    'geeko-cyan-neon': 'white',
    'geeko-cyan': 'white',
    'geeko-green': 'white',
    'neon-text-cyan': 'text-white',
    'bg-cyan-500': 'bg-white',
    'text-cyan-400': 'text-white',
    'text-geeko-cyan': 'text-white',
    'bg-geeko-cyan': 'bg-white',
    'border-geeko-cyan': 'border-white',
    'shadow-geeko-cyan': 'shadow-white/20',
    'group-hover:text-geeko-cyan': 'group-hover:text-white',
    'hover:text-geeko-cyan': 'hover:text-white',
    'hover:bg-geeko-cyan': 'hover:bg-white',
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
                    new_content = new_content.replace(old, new)
                
                if new_content != content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated: {path}")
            except Exception as e:
                print(f"Error processing {path}: {e}")
