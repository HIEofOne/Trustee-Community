import React, { Component } from "react";
import Link from "next/link";

export default class Header extends Component {
  render() {
    return (
      <div className="header">
        <Link href="/" passHref>
          <h1>HIE of One</h1>
        </Link>
        <h5>HIE of One Trustee Community</h5>
        <Link href="" passHref>
          <a>Privacy Policy</a>
        </Link>
        <Link href="" passHref>
          <a>Support</a>
        </Link>
      </div>
    );
  }
}
