
let budget = { amount: 500000 };

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    return res.status(200).json(budget);
  }
  
  if (req.method === 'POST') {
    const { amount } = req.body;
    budget = { amount: Number(amount) || 0 };
    return res.status(200).json(budget);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
