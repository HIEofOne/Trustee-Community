// pages/login.js
import { useRouter } from "next/router";
import { Magic } from "magic-sdk";

export default function Login() {
  const router = useRouter();

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    const { elements } = event.target;

    //Check if user has an acount
    const patient = await fetch(
      "/api/couchdb/patients/" + elements.email.value,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
      .then((res) => res.json())

    if (typeof window === "undefined") return;
    const did = await new Magic(
      //@ts-ignore
      process.env.NEXT_PUBLIC_MAGIC_PUB_KEY
    ).auth.loginWithMagicLink({ email: elements.email.value});

    // Once we have the did from magic, login with our own API
    const authRequest = await fetch("/api/magicLink/login", {
      method: "POST",
      headers: { Authorization: `Bearer ${did}` },
    });

    if (authRequest.ok) {
      // Magic Link login successful!
      // Check if patient exists
      //TODO - Stripe payment varified
      if (patient && patient.acceptsTerms) {
        router.push("/myTrustee/dashboard");
      } else {
        // add account to couchdb
        var body = {
          email: elements.email.value
        };
        //create new patient in db if doesnt alr exist
        await fetch(`/api/couchdb/patients/new`, {
          method: "POST",
          headers : { 
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })
        //continue with signup
        router.push("/newPatient/" + elements.email.value);
        
      }
    } else {
      /* handle errors */
    }
  };

  return (
    <div>
      <div>
        <form onSubmit={handleSubmit}>
          <p><strong>Subscribe</strong> to your own Trustee or <strong>Login</strong> with existing account.</p>
          <input name="email" type="email" placeholder="Email Address" />
          <button className="btn btn-submit">Submit</button>
        </form>
      </div>
    </div>
  );
}
