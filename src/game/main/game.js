import * as React from "react";
import {InputCard, QuestionCard, ResponseCard} from "../card/card";
import './game.scss';

function QuestionSelector(props) {
  return (
    <div className="question-selection-screen">
      <h1>Choose a Question</h1>
      <p>Select one of the questions below to ask the room</p>
      <br />
      <div className="card-list">
        {
          props.questions.map((question) => {
            return (
              <QuestionCard key={question.id} text={question.question} canHover={true}/>
            );
          })
        }
      </div>
    </div>
  );
}

class Game extends React.Component {
  render() {
    let content = (
      <div className="card-list">
        <QuestionCard text="What should they offer at the concession stands in movie theaters?"/>
        <ResponseCard text="Popcorn? There will be a fun card game here one day..."/>
        <InputCard/>
      </div>
    );

    if (!this.props.room) {
      content = null;
    } else if (this.props.room.questions.length > 0) {
      content = <QuestionSelector questions={this.props.room.questions}/>
    }

    return (
      <div id="outer-game-wrapper">
        <div id="inner-game-wrapper">
          {content}
        </div>
      </div>
    );
  }
}

export default Game;