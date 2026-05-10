
const url = 'https://bqfkqnnostzaqueujdms.supabase.co/rest/v1/accessories';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZmtxbm5vc3R6YXF1ZXVqZG1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA2NDUsImV4cCI6MjA5MTM3NjY0NX0.xwqN-nP-_93cd3R1Q9fSkQMkf10d7whvVU6Uhk5uG-s';

async function test() {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name: 'Test Accessory',
        description: 'Test Description',
        price: 10,
        cost: 5,
        suggested_price: 12,
        stock: 10,
        category: 'Accesorios',
        category_code: null,
        game_id: null,
        unit_type: 'Unidad',
        language: 'Inglés',
        image_url: '',
        additional_images: []
      })
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('Error details:', data);
    } else {
      console.log('Success:', data);
    }
  } catch (error) {
    console.error('Fetch error:', error.message);
  }
}

test();
