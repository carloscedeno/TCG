import re

filepath = r"e:\TCG Web App\frontend\src\pages\Admin\AdminDashboard.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the start
content = content.replace(
    '                {(() => false)() && (\n                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">\n                        <div className="space-y-8">',
    '                {/* Hidden Scrapers */}\n                {(() => false)() && (\n                    <div className="grid grid-cols-1 gap-8">\n                        <div className="space-y-8">'
)

# Wait, if I just leave the block hidden, the user's issue isn't fixed!
# Let's completely remove the `(() => false)() && (` and closing `)}`
# And remove the first column.

# Actually, I'll just do this:
new_content = []
lines = content.split('\n')
skip = False
for i, line in enumerate(lines):
    if line.strip() == '{(() => false)() && (':
        new_content.append('                <div className="grid grid-cols-1 gap-8">')
        skip = True
        continue
    if skip and 'CONTROL DE MISIÓN' in line:
        skip = False
        # Add the parent div for this column
        new_content.append('                    <div className="space-y-8">')
        new_content.append(line)
        continue
    
    # Check for the closing brace of the wrapper
    if i == 637 and line.strip() == ')}':
        continue # skip the closing brace
        
    if not skip:
        new_content.append(line)

with open(filepath, "w", encoding="utf-8") as f:
    f.write('\n'.join(new_content))

print("Dashboard fixed.")
