
const csvHeaders = ['name', 'description', 'price', 'stock', 'category_code', 'unit_type', 'language', 'cost', 'suggested_price', 'game_id'];
const mapping = {
    name: '',
    description: '',
    price: '',
    stock: '',
    category_code: '',
    unit_type: '',
    language: '',
    cost: '',
    suggested_price: '',
    game_id: ''
};

const catalogMap = {
    name: ['name', 'producto', 'nombre'],
    price: ['price', 'precio', 'venta'],
    cost: ['cost', 'costo'],
    suggested_price: ['suggested_price', 'precio_sugerido', 'sugerido'],
    category_code: ['category_code', 'categoría', 'categoria', 'category'],
    game_id: ['game_id', 'id_juego', 'juego'],
    stock: ['stock', 'cantidad', 'inventario'],
    description: ['description', 'descripción', 'descripcion'],
    unit_type: ['unit_type', 'unidad', 'tipo'],
    language: ['language', 'idioma']
};

const newMapping = { ...mapping };
Object.entries(catalogMap).forEach(([field, aliases]) => {
    const found = csvHeaders.find(h => aliases.includes(h.toLowerCase().trim()));
    if (found) newMapping[field] = found;
});

console.log("Original Headers:", csvHeaders);
console.log("Auto-mapped:", newMapping);

const allMapped = Object.values(newMapping).every(v => v !== '');
console.log("All fields mapped:", allMapped);
