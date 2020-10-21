import React from "react";
import logo from "./logo.svg";
import "./splash.scss";

function LoadingSpinner() {
  return (
    <div className="loading-icon-container">
      <div className="loading-icon">
        <i className="fad fa-spinner-third fa-spin" />
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="splash-wrapper loading-wrapper">
      <img src={logo} className="splash-logo" alt="logo" />
      <h1>37 Questions</h1>
      <h2>A game of wit and skill is loading...</h2>
      <br /><br />
      <LoadingSpinner />
    </div>
  );
}

function LogoutScreen(props) {
  return (
    <div className="splash-wrapper logout-wrapper">
      <h1>{props.info ? props.info.logoutTitle : "Logged Out"}</h1>
      <h2>{props.info ? props.info.logoutDesc : "You have been logged out."}</h2>
    </div>
  );
}

export {LoadingScreen, LogoutScreen, LoadingSpinner};