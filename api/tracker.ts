
let records: any[] = [];

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    return res.status(200).json(records);
  }
  
  if (req.method === 'POST') {
    const { amount, category, description, date } = req.body;
    const newRecord = {
      id: Date.now().toString(),
      amount: Number(amount) || 0,
      category: category || 'Lainnya',
      description: description || '',
      date: date || new Date().toISOString()
    };
    records.push(newRecord);
    return res.status(201).json(newRecord);
  }

  if (req.method === 'DELETE') {
    const id = req.query.id;
    if (!id) {
       // Check if ID is in the path if used as /api/tracker/[id]
       // But vercel.json rewrites /api/(.*) to /api/$1
       // So /api/tracker/123 -> /api/tracker.ts?id=123 (if using query)
       // Or we handle it differently.
    }
    records = records.filter(r => String(r.id) !== String(id));
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
