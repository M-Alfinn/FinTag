export default async function handler(req: any, res: any) {
  res.status(200).json([
    { id: '1', text: "Masa depan adalah milik mereka yang percaya pada keindahan mimpi mereka.", author: "Eleanor Roosevelt" },
    { id: '2', text: "Jangan biarkan hari kemarin menyita terlalu banyak hari ini.", author: "Will Rogers" },
    { id: '3', text: "Cara terbaik untuk meramalkan masa depan adalah dengan menciptakannya.", author: "Peter Drucker" }
  ]);
}
