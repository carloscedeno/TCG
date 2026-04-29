import requests
h = {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZmtxbm5vc3R6YXF1ZXVqZG1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA2NDUsImV4cCI6MjA5MTM3NjY0NX0.xwqN-nP-_93cd3R1Q9fSkQMkf10d7whvVU6Uhk5uG-s',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZmtxbm5vc3R6YXF1ZXVqZG1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA2NDUsImV4cCI6MjA5MTM3NjY0NX0.xwqN-nP-_93cd3R1Q9fSkQMkf10d7whvVU6Uhk5uG-s'
}
r = requests.get('https://bqfkqnnostzaqueujdms.supabase.co/rest/v1/orders?total_amount=eq.6.3&limit=5', headers=h)
data = r.json()
for d in data:
    print(f"ID: {d['id']} | Created: {d['created_at']}")
