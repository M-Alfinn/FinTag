
let orders: any[] = [];

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    return res.status(200).json(orders);
  }
  
  if (req.method === 'POST') {
    const newOrder = { 
      id: Date.now().toString(), 
      status: 'pending',
      date: new Date().toISOString(),
      ...req.body 
    };
    orders.push(newOrder);
    return res.status(201).json(newOrder);
  }

  if (req.method === 'PATCH') {
    const { id } = req.query;
    const idx = orders.findIndex(o => String(o.id) === String(id));
    if (idx !== -1) {
      orders[idx].status = orders[idx].status === 'pending' ? 'selesai' : 'pending';
      return res.status(200).json(orders[idx]);
    }
    return res.status(404).json({ error: 'Order not found' });
  }

  if (req.method === 'PUT') {
    const { id } = req.query;
    const idx = orders.findIndex(o => String(o.id) === String(id));
    if (idx !== -1) {
      orders[idx] = { ...orders[idx], ...req.body, id };
      return res.status(200).json(orders[idx]);
    }
    return res.status(404).json({ error: 'Order not found' });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    orders = orders.filter(o => String(o.id) !== String(id));
    return res.status(200).json(orders);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
