// pages/api/key.js

const Key = (req: any, res: any) => {
  if (req.method !== 'POST') return res.status(405).end();
  res.json({key: process.env.MAGIC_PUB_KEY});
};

export default Key;
