import Head from 'next/head';
import Login from '../../components/magicLink/login';
export default function Home() {
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
        <Login />
      </div>
    </>
  );
}