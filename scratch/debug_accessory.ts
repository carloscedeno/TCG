
import { createClient } from '@supabase/supabase-client';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function testCreate() {
  const accessory = {
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
  };

  const { data, error } = await supabase
    .from('accessories')
    .insert([accessory])
    .select()
    .single();

  if (error) {
    console.error('Error details:', error);
  } else {
    console.log('Success:', data);
  }
}

testCreate();
