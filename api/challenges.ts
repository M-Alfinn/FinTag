export default async function handler(req: any, res: any) {
  res.status(200).json([
    { id: '1', title: "Minum Air 2L", category: "Health", icon: "Droplets" },
    { id: '2', title: "No Jajan Hari Ini", category: "Finance", icon: "Wallet" },
    { id: '3', title: "Jalan 5000 Langkah", category: "Fitness", icon: "Footprints" }
  ]);
}
