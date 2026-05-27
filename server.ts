import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import fs from 'fs/promises';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // ... (data dir logic)
  
  // Data paths
  const DATA_DIR = path.join(process.cwd(), 'data');
  const ensureDataDir = async () => {
    try { await fs.mkdir(DATA_DIR); } catch (e) {}
  };

  const readJson = async (filename: string, defaultData: any = []) => {
    const filePath = path.join(DATA_DIR, filename);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      return defaultData;
    }
  };

  const writeJson = async (filename: string, data: any) => {
    const filePath = path.join(DATA_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  };

  await ensureDataDir();

  // API Routes
  app.get('/api/budget', async (req, res) => {
    const data = await readJson('budget.json', { amount: 500000 });
    res.json(data);
  });

  app.post('/api/budget', async (req, res) => {
    const data = { amount: Number(req.body.amount) };
    await writeJson('budget.json', data);
    res.json(data);
  });

  app.get('/api/tracker', async (req, res) => {
    const data = await readJson('tracker.json', []);
    res.json(data);
  });

  app.post('/api/tracker', async (req, res) => {
    const records = await readJson('tracker.json', []);
    const newRecord = { 
      ...req.body, 
      id: Date.now().toString(),
      date: req.body.date || new Date().toISOString()
    };
    records.push(newRecord);
    await writeJson('tracker.json', records);
    res.json(newRecord);
  });

  app.delete('/api/tracker/:id', async (req, res) => {
    const records = await readJson('tracker.json', []);
    const filtered = records.filter((r: any) => String(r.id) !== String(req.params.id));
    await writeJson('tracker.json', filtered);
    res.json({ success: true });
  });

  app.get('/api/orders', async (req, res) => {
    const data = await readJson('orders.json', []);
    res.json(data);
  });

  app.post('/api/orders', async (req, res) => {
    const orders = await readJson('orders.json', []);
    const newOrder = { 
      id: Date.now().toString(), 
      status: 'pending',
      date: new Date().toISOString(),
      ...req.body 
    };
    orders.push(newOrder);
    await writeJson('orders.json', orders);
    res.status(201).json(newOrder);
  });

  app.get('/api/products', async (req, res) => {
    const defaultData = [
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
    const data = await readJson('products.json', null);
    if (data === null) {
      await writeJson('products.json', defaultData);
      return res.json(defaultData);
    }
    res.json(data);
  });

  app.post('/api/products', async (req, res) => {
    const products = await readJson('products.json', []);
    const newProduct = { id: Date.now().toString(), ...req.body };
    products.push(newProduct);
    await writeJson('products.json', products);
    res.status(201).json(newProduct);
  });

  app.put('/api/products/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const products = await readJson('products.json', []);
      const idx = products.findIndex((p: any) => String(p.id) === String(id));
      if (idx !== -1) {
        products[idx] = { ...products[idx], ...req.body, id }; // Keep original ID
        await writeJson('products.json', products);
        res.json(products[idx]);
      } else {
        res.status(404).json({ error: 'Product not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/orders/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const orders = await readJson('orders.json', []);
      const idx = orders.findIndex((o: any) => String(o.id).trim() === String(id).trim());
      if (idx !== -1) {
        orders[idx] = { ...orders[idx], ...req.body, id }; // Keep original ID
        await writeJson('orders.json', orders);
        res.json(orders[idx]);
      } else {
        res.status(404).json({ error: 'Order not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/products/:id', async (req, res) => {
    try {
      const id = req.params.id;
      console.log(`[DELETE PRODUCT] Attempting to delete ID: ${id}`);
      
      let products = await readJson('products.json', []);
      const initialCount = products.length;
      
      products = products.filter((p: any) => String(p.id).trim() !== String(id).trim());
      
      if (products.length === initialCount) {
        console.log(`[DELETE PRODUCT] ID ${id} not found in catalog.`);
        return res.status(404).json({ error: 'Produk tidak ditemukan' });
      }

      await writeJson('products.json', products);
      console.log(`[DELETE PRODUCT] Successfully deleted ${id}. Remaining: ${products.length}`);
      res.json(products);
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/music', async (req, res) => {
    const defaultData = [
      { id: '1', title: 'Die With A Smile', artist: 'Lady Gaga & Bruno Mars', url: 'https://www.youtube.com/watch?v=S01Zsc7G0Bw', cover: 'https://i.ytimg.com/vi/S01Zsc7G0Bw/maxresdefault.jpg' },
      { id: '2', title: 'Night Changes', artist: 'One Direction', url: 'https://www.youtube.com/watch?v=syFZfO_bd7Q', cover: 'https://i.ytimg.com/vi/syFZfO_bd7Q/maxresdefault.jpg' },
      { id: '3', title: 'The Man Who Can\'t Be Moved', artist: 'The Script', url: 'https://www.youtube.com/watch?v=gS9o1FAszdk', cover: 'https://i.ytimg.com/vi/gS9o1FAszdk/maxresdefault.jpg' },
      { id: '4', title: 'Love Yourself', artist: 'Justin Bieber', url: 'https://www.youtube.com/watch?v=oyEuk8j8imI', cover: 'https://i.ytimg.com/vi/oyEuk8j8imI/maxresdefault.jpg' },
      { id: '5', title: 'Locked Out Of Heaven', artist: 'Bruno Mars', url: 'https://www.youtube.com/watch?v=e-fAup2h22o', cover: 'https://i.ytimg.com/vi/e-fAup2h22o/maxresdefault.jpg' },
      { id: '6', title: 'Story of My Life', artist: 'One Direction', url: 'https://www.youtube.com/watch?v=W-TE_Ys4iwM', cover: 'https://i.ytimg.com/vi/W-TE_Ys4iwM/maxresdefault.jpg' },
      { id: '7', title: 'Breakeven', artist: 'The Script', url: 'https://www.youtube.com/watch?v=MzCLLHscJXw', cover: 'https://i.ytimg.com/vi/MzCLLHscJXw/maxresdefault.jpg' },
      { id: '8', title: 'Stay', artist: 'Justin Bieber', url: 'https://www.youtube.com/watch?v=kTJczUoc26U', cover: 'https://i.ytimg.com/vi/kTJczUoc26U/maxresdefault.jpg' }
    ];
    const data = await readJson('music.json', null);
    if (data === null) {
      await writeJson('music.json', defaultData);
      return res.json(defaultData);
    }
    res.json(data);
  });

  app.post('/api/music', async (req, res) => {
    const music = await readJson('music.json', []);
    const newSong = { id: Date.now().toString(), ...req.body };
    music.push(newSong);
    await writeJson('music.json', music);
    res.status(201).json(newSong);
  });

  app.put('/api/music/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const music = await readJson('music.json', []);
      const idx = music.findIndex((s: any) => String(s.id).trim() === String(id).trim());
      if (idx !== -1) {
        music[idx] = { ...music[idx], ...req.body, id }; // Keep original ID
        await writeJson('music.json', music);
        res.json(music[idx]);
      } else {
        res.status(404).json({ error: 'Song not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/music/:id', async (req, res) => {
    try {
      const id = req.params.id;
      console.log(`[DELETE MUSIC] Attempting to delete ID: ${id}`);
      let music = await readJson('music.json', []);
      const initialCount = music.length;
      music = music.filter((s: any) => String(s.id).trim() !== String(id).trim());
      if (music.length === initialCount) {
        return res.status(404).json({ error: 'Lagu tidak ditemukan' });
      }
      await writeJson('music.json', music);
      res.json(music);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/orders/:id', async (req, res) => {
    try {
      const id = req.params.id;
      console.log(`[DELETE ORDER] Attempting to delete ID: ${id}`);
      let orders = await readJson('orders.json', []);
      const initialCount = orders.length;
      orders = orders.filter((o: any) => String(o.id).trim() !== String(id).trim());
      if (orders.length === initialCount) {
        return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
      }
      await writeJson('orders.json', orders);
      res.json(orders);
    } catch (error) {
      console.error('Delete order error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.patch('/api/orders/:id/status', async (req, res) => {
    const orders = await readJson('orders.json', []);
    const idx = orders.findIndex((o: any) => String(o.id) === String(req.params.id));
    if (idx !== -1) {
      orders[idx].status = orders[idx].status === 'pending' ? 'selesai' : 'pending';
      await writeJson('orders.json', orders);
      res.json(orders[idx]);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  });

  app.get('/api/motivations', async (req, res) => {
    const data = await readJson('motivations.json', [
      { id: '1', text: "Masa depan adalah milik mereka yang percaya pada keindahan mimpi mereka.", author: "Eleanor Roosevelt" },
      { id: '2', text: "Jangan biarkan hari kemarin menyita terlalu banyak hari ini.", author: "Will Rogers" },
      { id: '3', text: "Cara terbaik untuk meramalkan masa depan adalah dengan menciptakannya.", author: "Peter Drucker" }
    ]);
    res.json(data);
  });

  app.get('/api/challenges', async (req, res) => {
    const defaultData = [
      { id: '1', title: "Minum Air 2L", category: "Health", icon: "Droplets", stars: 1 },
      { id: '2', title: "No Jajan Hari Ini", category: "Finance", icon: "Wallet", stars: 2 },
      { id: '3', title: "Jalan 5000 Langkah", category: "Fitness", icon: "Footprints", stars: 2 }
    ];
    const data = await readJson('challenges.json', null);
    if (data === null) {
      await writeJson('challenges.json', defaultData);
      return res.json(defaultData);
    }
    // Backward compatibility for existing entries that don't have stars
    const compliantData = data.map((item: any) => ({
      ...item,
      stars: item.stars || 1
    }));
    res.json(compliantData);
  });

  app.post('/api/challenges', async (req, res) => {
    try {
      const challenges = await readJson('challenges.json', [
        { id: '1', title: "Minum Air 2L", category: "Health", icon: "Droplets", stars: 1 },
        { id: '2', title: "No Jajan Hari Ini", category: "Finance", icon: "Wallet", stars: 2 },
        { id: '3', title: "Jalan 5000 Langkah", category: "Fitness", icon: "Footprints", stars: 2 }
      ]);
      const newChallenge = {
        id: Date.now().toString(),
        title: req.body.title,
        category: req.body.category || 'General',
        icon: req.body.icon || 'Zap',
        stars: Number(req.body.stars) || 1,
        isCustom: true
      };
      challenges.push(newChallenge);
      await writeJson('challenges.json', challenges);
      res.status(201).json(newChallenge);
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Internal server error' });
    }
  });

  app.delete('/api/challenges/:id', async (req, res) => {
    try {
      const { id } = req.params;
      let challenges = await readJson('challenges.json', [
        { id: '1', title: "Minum Air 2L", category: "Health", icon: "Droplets", stars: 1 },
        { id: '2', title: "No Jajan Hari Ini", category: "Finance", icon: "Wallet", stars: 2 },
        { id: '3', title: "Jalan 5000 Langkah", category: "Fitness", icon: "Footprints", stars: 2 }
      ]);
      challenges = challenges.filter((c: any) => String(c.id) !== String(id));
      await writeJson('challenges.json', challenges);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Internal server error' });
    }
  });

  app.get('/api/feedbacks', async (req, res) => {
    try {
      const data = await readJson('feedbacks.json', []);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Internal server error' });
    }
  });

  app.post('/api/feedbacks', async (req, res) => {
    try {
      const feedbacks = await readJson('feedbacks.json', []);
      const newFeedback = {
        id: Date.now().toString(),
        name: req.body.name || 'Anonim',
        category: req.body.category || 'Appreciation',
        rating: Number(req.body.rating) || 5,
        subject: req.body.subject,
        message: req.body.message,
        timestamp: new Date().toLocaleString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };
      feedbacks.push(newFeedback);
      await writeJson('feedbacks.json', feedbacks);

      // Telegram Bot Integration
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;

      if (botToken && chatId) {
        // Safe characters escaping or simple clear layout for Markdown
        const telegramMessage = `📬 *Kritik/Saran Baru dari FinTag*!
------------------------------------
👤 *Nama:* ${newFeedback.name}
📂 *Kategori:* ${newFeedback.category}
⭐ *Rating:* ${'⭐'.repeat(newFeedback.rating)} (${newFeedback.rating}/5)
📝 *Subjek:* ${newFeedback.subject}
💬 *Pesan:*
${newFeedback.message}

🕒 _Dikirim pada: ${newFeedback.timestamp}_`;

        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: telegramMessage,
            parse_mode: 'Markdown'
          })
        }).then(response => {
          if (!response.ok) {
            console.error('[TELEGRAM] Error sending message to bot:', response.statusText);
          } else {
            console.log('[TELEGRAM] Message successfully sent to Telegram!');
          }
        }).catch(err => {
          console.error('[TELEGRAM] Network error sending to Telegram:', err);
        });
      } else {
        console.warn('[TELEGRAM] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in environment variables.');
      }

      res.status(201).json(newFeedback);
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Internal server error' });
    }
  });

  app.delete('/api/feedbacks/:id', async (req, res) => {
    try {
      const { id } = req.params;
      let feedbacks = await readJson('feedbacks.json', []);
      feedbacks = feedbacks.filter((f: any) => String(f.id) !== String(id));
      await writeJson('feedbacks.json', feedbacks);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Internal server error' });
    }
  });

  app.get('/api/weather', async (req, res) => {
    // Mock weather since this is a local setup
    res.json({
      temp: 28,
      city: "Medan",
      condition: "Sunny",
      icon: "sun"
    });
  });

  app.post('/api/chat', async (req, res) => {
    console.log('[CHAT] Request diterima dari frontend');
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error('[CHAT] GEMINI_API_KEY tidak ditemukan di environment variables.');
        return res.status(500).json({ 
          error: 'GEMINI_API_KEY belum dikonfigurasi di server.',
          details: 'Jika kamu menjalankan secara lokal, buatlah file .env di root folder dan isi dengan GEMINI_API_KEY=KODE_API_KEY_KAMU (Jangan di file .env.example).'
        });
      }

      const { messages, text, systemInstruction } = req.body;
      console.log('[CHAT] Mengirim pesan ke Gemini...');
      
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: [
          ...messages,
          { role: 'user', parts: [{ text: text }] }
        ],
        config: {
          systemInstruction: systemInstruction
        }
      });

      if (!response || !response.text) {
        console.error('[CHAT] Respons Gemini kosong');
        return res.status(500).json({ error: 'AI mengembalikan respons kosong' });
      }

      console.log('[CHAT] Berhasil mendapatkan respons dari Gemini');
      res.json({ text: response.text });
    } catch (error: any) {
      console.error('[CHAT] Error pada API Chat:', error);
      res.status(500).json({ 
        error: 'Gagal menghasilkan konten', 
        details: error.message || 'Terjadi kesalahan internal pada server'
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
