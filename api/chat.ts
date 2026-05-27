import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    return res.status(200).json({ message: 'API Chat is active. Please use POST.' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('[API CHAT] Request received');
  
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[API CHAT] Missing API Key');
      return res.status(500).json({ 
        error: 'GEMINI_API_KEY belum dikonfigurasi di Vercel.',
        details: 'Pastikan kamu sudah menambahkan GEMINI_API_KEY di Project Settings > Environment Variables di dashboard Vercel.'
      });
    }

    const { messages, text, systemInstruction } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

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
      return res.status(500).json({ error: 'AI mengembalikan respons kosong' });
    }

    return res.status(200).json({ text: response.text });
  } catch (error: any) {
    console.error('[API CHAT] Error:', error);
    return res.status(500).json({ 
      error: 'Gagal menghubungi AI', 
      details: error.message 
    });
  }
}
