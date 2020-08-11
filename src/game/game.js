import * as React from "react";
import {InputCard, QuestionCard, ResponseCard} from "./card/card";
import './game.scss';

class Game extends React.Component {
  render() {
    return (
      <div id="game-wrapper">
        <div className="card-list">
          <QuestionCard text="What should they offer at the concession stands in movie theaters?" />
          <ResponseCard text="Popcorn? There will be a fun card game here one day..." />
          <InputCard />
        </div>
      </div>
    );
  }
}

export default Game;