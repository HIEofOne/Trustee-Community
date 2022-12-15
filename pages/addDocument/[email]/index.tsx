import Link from "next/link";
import { useEffect, useState } from "react";

//commands to kill couch db
// sudo lsof -i :5984
//kill "PID"

//@ts-ignore
export default function NewUser({ email }) {
  const [success, setSuccess] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [users, setUsers] = useState("");

  var user = process.env.COUCHDB_USER;
  var pass = process.env.COUCHDB_PASSWORD;
  var url = "http://127.0.0.1:5984/users/";

  var document = {
    email: email,
    verified: true,
  };

  useEffect(() => {
    setLoading(true);
    var authorizationBasic = window.btoa(user + ":" + pass);
    var headers = new Headers();
    headers.append("Authorization", "Basic " + authorizationBasic);

    fetch(url + email, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(document),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("response", data);
        if (data.ok) {
          setSuccess(true);
        }
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getUsers = async () => {
    var authorizationBasic = window.btoa(user + ":" + pass);
    var headers = new Headers();
    headers.append("Authorization", "Basic " + authorizationBasic);
    fetch(url + "_all_docs", {
      method: "GET",
      headers: headers,
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("response", data);
        setLoading(false);
        setUsers(JSON.stringify(data));
      });
  };

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <hr className="solid" />
      <h1>{success ? "Your Trustee, at your service." : "Error"}</h1>
      <p>
        {success
          ? "User succesfully added!"
          : "Sorry, this user already exists. Try again with a different email."}
      </p>
      <button onClick={() => getUsers()}>See All Users (For Testing)</button>{" "}
      <br />
      <p>{users}</p>
      <br />
      <Link href="/">
        <a>Go Home</a>
      </Link>
    </div>
  );
}

//@ts-ignore
NewUser.getInitialProps = async ({ query }) => {
  const { email } = query;
  return { email };
};
