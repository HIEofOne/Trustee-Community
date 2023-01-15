// pages/api/key.js

//@ts-ignore
const Key = (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  console.log(process.env.MAGIC_PUB_KEY)
  console.log(process.env.ENCRYPTION_SECRET)
  res.json({key: process.env.MAGIC_PUB_KEY});
};

export default Key;
