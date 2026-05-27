
let products = [
  { 
    id: '1', 
    name: 'Gantungan Kunci NFC Pro', 
    price: 25000, 
    image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&q=80&w=400', 
    description: 'Gantungan kunci NFC premium dengan desain minimalis. Tahan air, awet, dan sangat praktis.' 
  },
  { 
    id: '2', 
    name: 'FinTag Card Pro', 
    price: 50000, 
    image: 'https://images.unsplash.com/photo-1625591338076-905a0980907e?auto=format&fit=crop&q=80&w=400', 
    description: 'Kartu NFC eksklusif dengan finish doff yang elegan. Cocok untuk pengganti kartu nama atau ID card.' 
  }
];

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    return res.status(200).json(products);
  }
  
  if (req.method === 'POST') {
    const newProduct = { id: Date.now().toString(), ...req.body };
    products.push(newProduct);
    return res.status(201).json(newProduct);
  }

  if (req.method === 'PUT') {
    const { id } = req.query;
    const idx = products.findIndex(p => String(p.id) === String(id));
    if (idx !== -1) {
      products[idx] = { ...products[idx], ...req.body, id };
      return res.status(200).json(products[idx]);
    }
    return res.status(404).json({ error: 'Product not found' });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    products = products.filter(p => String(p.id) !== String(id));
    return res.status(200).json(products);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
