const odooUrl = "https://geekorium1.odoo.com";
const payload = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      service: "common",
      method: "authenticate",
      args: ["geekorium1", "administraciongeekorium@gmail.com", "c11a1deec17010ecbecd5bdb44b6af81e569e207", {}]
    },
    id: Math.floor(Math.random() * 1000000)
};

const response = await fetch(`${odooUrl}/jsonrpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
});

const text = await response.text();
console.log(text.substring(0, 200));
