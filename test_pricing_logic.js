
// Verification script for fetchCardDetails logic
const marketPriceFoil = 24.99;
const marketPriceNonFoil = 16.99;

// Mock exactProd (from products table)
const exactProd_ZeroPrice = { id: 'p1', stock: 5, price: 0 };
const exactProd_CustomPrice = { id: 'p2', stock: 3, price: 29.99 };
const exactProd_NullPrice = { id: 'p3', stock: 1, price: null };

function calculateFinalPrice(exactProd, marketPrice) {
    return (exactProd?.price && Number(exactProd.price) > 0) ? Number(exactProd.price) : marketPrice;
}

console.log('--- Test Cases ---');
console.log('1. Store Price is 0, Market is 24.99:', calculateFinalPrice(exactProd_ZeroPrice, marketPriceFoil) === 24.99 ? 'PASS' : 'FAIL');
console.log('2. Store Price is 29.99, Market is 24.99:', calculateFinalPrice(exactProd_CustomPrice, marketPriceFoil) === 29.99 ? 'PASS' : 'FAIL');
console.log('3. Store Price is null, Market is 24.99:', calculateFinalPrice(exactProd_NullPrice, marketPriceFoil) === 24.99 ? 'PASS' : 'FAIL');
console.log('4. No Store Record, Market is 16.99:', calculateFinalPrice(null, marketPriceNonFoil) === 16.99 ? 'PASS' : 'FAIL');
