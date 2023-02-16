import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const Doximity = () => {
  const [docTest, setDocTest] = useState('');
  const router = useRouter();
  const loadDoximity = async() => {
    const isTest = await fetch("/api/doximity",
    { method: "POST", headers: {"Content-Type": "application/json"} })
    .then((res) => res.json());
    router.push(isTest.redirect);
    // setDocTest(JSON.stringify(isTest));
  };
  useEffect(() => {
    loadDoximity();
  },[]);
  return (
    <div>
      {docTest}
    </div>
  );
}

export default Doximity