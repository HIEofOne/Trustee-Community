import React, { Component } from "react";
import Link from "next/link";

export default class Header extends Component {
  render() {
    return (
      <div className="header">
        <Link href="/">
          <h1>HIE of One</h1>
        </Link>
        <h5>HIE of One Trustee Community</h5>
        <Link href="">
          <a>Privacy Policy</a>
        </Link>
        <Link href="">
          <a>Support</a>
        </Link>
      </div>
    );
  }
}
