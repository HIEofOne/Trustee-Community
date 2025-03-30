import Head from 'next/head';
import Login from '../../components/magicLink/login';
import { getIronSession } from 'iron-session';
import type { InferGetServerSidePropsType, GetServerSideProps } from "next";
import { SessionData, sessionOptions } from '../../lib/session';
import { generateChallenge } from '../../lib/auth';

export default function Home({
  session,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
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
        <Login challenge={session.challenge} clinical={false} authonly={false}/>
      </div>
    </>
  );
}

export const getServerSideProps = (async (context) => {
  const session = await getIronSession<SessionData>(
    context.req,
    context.res,
    sessionOptions,
  );
  if (!session.isLoggedIn) {
    return {
      redirect: {
        destination: "/myTrustee/dashboard",
        permanent: false,
      },
    };
  }
  const challenge = generateChallenge();
  session.challenge = challenge;
  await session.save();
  return { props: { session } };
}) satisfies GetServerSideProps<{
  session: SessionData
}>;