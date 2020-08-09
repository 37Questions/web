import React from "react";
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
      <h1>37 Questions</h1>
      <h2>A game of wit and skill is loading...</h2>
      <br /><br />
      <LoadingSpinner />
    </div>
  );
}

function LogoutScreen() {
  return (
    <div className="splash-wrapper logout-wrapper">
      <h1>Logged Out</h1>
      <h2>You can only play 37 Questions in one tab at a time!</h2>
    </div>
  );
}

export {LoadingScreen, LogoutScreen, LoadingSpinner};