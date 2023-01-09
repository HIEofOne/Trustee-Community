// pages/api/key.js

//@ts-ignore
const Key = (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  res.json({key: process.env.MAGIC_PUB_KEY});
};

export default Key;
