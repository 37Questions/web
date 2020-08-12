import React from "react";
import logo from "../logo.svg";
import "./header.scss"

function Header() {
  return (
    <div id="header-wrapper">
      <div id="header-title">
        <img src={logo} className="header-logo" alt="" />
        <h1>37 Questions</h1>
      </div>
    </div>
  );
}

export default Header;