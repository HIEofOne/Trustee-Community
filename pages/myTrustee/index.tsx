import Head from 'next/head';
import Login from '../../components/magicLink/login';
import { withIronSessionSsr } from "iron-session/next";
import { generateChallenge, isLoggedIn } from "../../lib/auth";
import { sessionOptions } from "../../lib/session";

export default function Home({ challenge }: { challenge: string }) {
  return (
    <>
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
          if (document.cookie && document.cookie.includes('authed')) {
            window.location.href = "/myTrustee/dashboard"
          }
        `,
          }}
        />
      </Head>
      <div>
        <h2>My Trustee</h2>
        <Login challenge={challenge} authonly={false}/>
      </div>
    </>
  );
}

export const getServerSideProps = withIronSessionSsr(async function ({
  req,
  res,
}) {
  if (isLoggedIn(req)) {
    return {
      redirect: {
        destination: "/myTrustee/dashboard",
        permanent: false,
      },
    };
  }
  const challenge = generateChallenge();
  req.session.challenge = challenge;
  await req.session.save();
  return { props: { challenge } };
},
sessionOptions);