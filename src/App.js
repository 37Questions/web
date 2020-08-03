import React from 'react';
import './App.scss';
import {Card, InputCard} from "./card/Card";

function App() {
  return (
    <div id="wrapper">
      <Card type="question" text="What would be a strange gift to bring to a wedding?" />
      <Card type="answer" text="An assault rifle." />
      <InputCard />
    </div>
  );
}

export default App;
