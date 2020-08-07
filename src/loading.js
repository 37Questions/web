import React from "react";
import "./loading.scss";

function LoadingScreen() {
  return (
    <div className="loading-wrapper">
      <h1>37 Questions</h1>
      <h2>A game of wit and skill is loading...</h2>
      <br /><br />
      <div className="loading-icon-container">
        <div className="loading-icon">
          <i className="fad fa-spinner-third fa-spin" />
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;