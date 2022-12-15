import { withIronSessionApiRoute } from 'iron-session/next'
import { NextApiRequest, NextApiResponse } from 'next'
import { generateNonce } from 'siwe'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req
  switch (method) {
    case 'GET':
      req.session.nonce = generateNonce()
      await req.session.save()
      res.setHeader('Content-Type', 'text/plain')
      res.send(req.session.nonce)
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
}
)