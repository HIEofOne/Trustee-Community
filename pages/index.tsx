import * as React from "react";
import Link from 'next/link';



//Landing Page
const Home = () => {
  
  return (
    <div>
      <div>
        <hr className="solid" />
        <h2>Patients</h2>
        <div>
          <Link href="/newPatient" passHref>
            <button className="btn btn-accented">
              Subscribe to your own Trustee. First month is free, then $2/month
            </button>
          </Link>
          <br></br>
          <Link href="/myTrustee" passHref>
            <button className="btn">
              Sign-in and manage your records access policies
            </button>
          </Link>
        </div>
      </div>
      <div>
        <hr className="solid" />
        <h2>Clinicians and other Care Team</h2>
        <div>
          <Link href="/getCredentials" passHref>
            <button className="btn btn-accented">
              Get standard access credentials for patients in this community
            </button>
          </Link>
          <br></br>
          <Link href="/requestAccess" passHref>
            <button className="btn">
              Request access to patient records
            </button>
          </Link>
        </div>
      </div>
      <div>
        <hr className="solid" />
        <h2>Patient Community Organizers</h2>
        <p>Trustee Community software is Free and Open Source. Please visit our GitHub wiki to start your own patient community. You will be able to set your own privacy policy and sponsor or charge for services.</p>
        <Link href="https://github.com/OliverMoscow/HIEofOne-demo" passHref><button className="btn btn-simple">GitHub Wiki</button></Link>
    </div>
    </div>
  );
};

export default Home;
