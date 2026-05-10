
const url = 'https://bqfkqnnostzaqueujdms.supabase.co/rest/v1/accessories';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZmtxbm5vc3R6YXF1ZXVqZG1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA2NDUsImV4cCI6MjA5MTM3NjY0NX0.xwqN-nP-_93cd3R1Q9fSkQMkf10d7whvVU6Uhk5uG-s';

async function test() {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test',
        price: 0,
        stock: 0,
        category: 'Accesorios'
      })
    });
    if (response.status === 204 || response.status === 201) {
       console.log('Success (No content)');
       return;
    }
    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Fetch error:', error.message);
  }
}

test();
