// pages/login.js
import { useRouter } from "next/router";
import { Magic } from "magic-sdk";

export default function Login() {
  const router = useRouter();

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    const { elements } = event.target;

    //Check if user has an acount
    const isRegistered = await fetch(
      "/api/couchdb/isPatient/" + elements.email.value,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((res) => res.json())
      .then((json) => json.success);

    if (isRegistered) {
      //the magic code
      if (typeof window === "undefined") return;
      const magicKey = await fetch("/api/magicLink/key", {
        method: "POST"
      });
      var magicKeyData = await magicKey.json();
      const did = await new Magic(
        magicKeyData.key
        //@ts-ignore
        // process.env.MAGIC_PUB_KEY
      ).auth.loginWithMagicLink({ email: elements.email.value });

      // Once we have the did from magic, login with our own API
      const authRequest = await fetch("/api/magicLink/login", {
        method: "POST",
        headers: { Authorization: `Bearer ${did}` },
      });

      if (authRequest.ok) {
        // Magic Link login successful!
        // Adding user to couchdb

        router.push("/myTrustee/dashboard");
      } else {
        /* handle errors */
      }
    } else {
      alert("Error: Email not registered. Please subscribe to trustee first.");
    }
  };

  return (
    <div>
      <div>
        <hr className="solid" />
        <h3>Login with Email</h3>
        <form onSubmit={handleSubmit}>
          <input name="email" type="email" />
          <button className="btn btn-submit">Log in</button>
        </form>
      </div>
    </div>
  );
}
