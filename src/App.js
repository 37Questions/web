import React from 'react';
import socketIOClient from "socket.io-client";
import './App.scss';
import {QuestionCard, ResponseCard, InputCard} from "./card/Card";

const socket = socketIOClient("http://192.168.0.102:3000");

socket.on("init", (data) => {
  console.info("init:", data);
});

function App() {
  return (
    <div id="wrapper">
      <QuestionCard text="What should they offer at the concession stands in movie theaters?" />
      <ResponseCard type="answer" text="An assault rifle." />
      <InputCard />
    </div>
  );
}

export default App;
