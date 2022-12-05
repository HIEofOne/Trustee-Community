import { withIronSessionApiRoute } from 'iron-session/next'
import { NextApiRequest, NextApiResponse } from 'next'
import { SiweMessage } from 'siwe'
import getConfig from "next/config";
const { serverRuntimeConfig } = getConfig();

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req
  console.log(1)
  switch (method) {
    case 'POST':
      try {
        console.log(2)

        const { message, signature } = req.body
        const siweMessage = new SiweMessage(message)
        const fields = await siweMessage.validate(signature)

        if (fields.nonce !== req.session.nonce)
          console.log(3)
          return res.status(422).json({ message: 'Invalid nonce.' })

        req.session.siwe = fields
        await req.session.save()
        console.log(4)
        res.json({ ok: true })
      } catch (_error) {
        console.log(5)
        res.json({ ok: false })
      }
      break
    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}

export default withIronSessionApiRoute(handler, {
    cookieName: 'siwe',
    password: `yGB%@)'8FPudp5";E{s5;fq>c7:evVeU`,
    cookieOptions: {
      secure: serverRuntimeConfig.NODE_ENV === 'production',
    },
  }
)