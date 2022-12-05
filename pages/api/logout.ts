import { withIronSessionApiRoute } from 'iron-session/next'
import { NextApiRequest, NextApiResponse } from 'next'
import getConfig from "next/config";
const { serverRuntimeConfig } = getConfig();

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req
  switch (method) {
    case 'GET':
      req.session.destroy()
      res.send({ ok: true })
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
      secure: serverRuntimeConfig.NODE_ENV === 'production',
    },
  })