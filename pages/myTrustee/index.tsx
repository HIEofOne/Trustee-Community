import Head from 'next/head';
import Link from 'next/link'
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
        <hr className="solid" />
        <h2>MyTrustee</h2>
        <Link href="/myTrustee/login">
          <a><button className="btn">Login</button></a>
        </Link>
      </div>
    </>
  );
}