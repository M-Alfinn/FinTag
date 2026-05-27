
let music = [
  { id: '1', title: 'Die With A Smile', artist: 'Lady Gaga & Bruno Mars', url: 'https://www.youtube.com/watch?v=S01Zsc7G0Bw', cover: 'https://i.ytimg.com/vi/S01Zsc7G0Bw/maxresdefault.jpg' },
  { id: '2', title: 'Night Changes', artist: 'One Direction', url: 'https://www.youtube.com/watch?v=syFZfO_bd7Q', cover: 'https://i.ytimg.com/vi/syFZfO_bd7Q/maxresdefault.jpg' },
  { id: '3', title: 'The Man Who Can\'t Be Moved', artist: 'The Script', url: 'https://www.youtube.com/watch?v=gS9o1FAszdk', cover: 'https://i.ytimg.com/vi/gS9o1FAszdk/maxresdefault.jpg' },
  { id: '4', title: 'Love Yourself', artist: 'Justin Bieber', url: 'https://www.youtube.com/watch?v=oyEuk8j8imI', cover: 'https://i.ytimg.com/vi/oyEuk8j8imI/maxresdefault.jpg' },
  { id: '5', title: 'Locked Out Of Heaven', artist: 'Bruno Mars', url: 'https://www.youtube.com/watch?v=e-fAup2h22o', cover: 'https://i.ytimg.com/vi/e-fAup2h22o/maxresdefault.jpg' },
  { id: '6', title: 'Story of My Life', artist: 'One Direction', url: 'https://www.youtube.com/watch?v=W-TE_Ys4iwM', cover: 'https://i.ytimg.com/vi/W-TE_Ys4iwM/maxresdefault.jpg' },
  { id: '7', title: 'Breakeven', artist: 'The Script', url: 'https://www.youtube.com/watch?v=MzCLLHscJXw', cover: 'https://i.ytimg.com/vi/MzCLLHscJXw/maxresdefault.jpg' },
  { id: '8', title: 'Stay', artist: 'Justin Bieber', url: 'https://www.youtube.com/watch?v=kTJczUoc26U', cover: 'https://i.ytimg.com/vi/kTJczUoc26U/maxresdefault.jpg' }
];

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    return res.status(200).json(music);
  }
  
  if (req.method === 'POST') {
    const newSong = { id: Date.now().toString(), ...req.body };
    music.push(newSong);
    return res.status(201).json(newSong);
  }

  if (req.method === 'PUT') {
    const { id } = req.query;
    const idx = music.findIndex(s => String(s.id) === String(id));
    if (idx !== -1) {
      music[idx] = { ...music[idx], ...req.body, id };
      return res.status(200).json(music[idx]);
    }
    return res.status(404).json({ error: 'Song not found' });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    music = music.filter(s => String(s.id) !== String(id));
    return res.status(200).json(music);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
