// pages/login.js
import { useRouter } from "next/router";
import { Magic } from "magic-sdk";
import getConfig from "next/config";
const { serverRuntimeConfig } = getConfig();

//@ts-ignore
export default function Login(props) {
  const router = useRouter();
  const { children } = props;

    //@ts-ignore
  const handleSubmit = async (event) => {
    event.preventDefault();

    const { elements } = event.target;

    if (typeof window === 'undefined') return
    // the magic code
    const did = await new Magic(
        //@ts-ignore
      serverRuntimeConfig.NEXT_PUBLIC_MAGIC_PUB_KEY
    ).auth.loginWithMagicLink({ email: elements.email.value });

    // Once we have the did from magic, login with our own API
    const authRequest = await fetch("/api/magicLink/login", {
      method: "POST",
      headers: { Authorization: `Bearer ${did}` },
    });

    if (authRequest.ok) {
      // We successfully logged in, our API
      // set authorization cookies and show wrapped tsx
      return children
    } else {
      /* handle errors */
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="email">Email</label>
      <input name="email" type="email" />
      <button>Log in</button>
    </form>
  );
}
