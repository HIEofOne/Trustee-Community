import { withIronSessionApiRoute } from 'iron-session/next'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req
  switch (method) {
    case 'GET':
      res.send({ address: req.session.siwe?.address })
      break
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}


export default withIronSessionApiRoute(handler, {
    cookieName: 'siwe',
    password: `yGB%@)'8FPudp5";E{s5;fq>c7:evVeU`,
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
    },
  })