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
  state = {
    questions: {}
  };

  onQuestionsListReceived = (data) => {
    console.info("Received question list:", data);
    this.setState({
      questions: data.questions
    });
  };

  componentDidUpdate = (prevProps) => {
    if (!this.props.room || prevProps.room) return;

    console.info("Registering game event listeners");
    let socket = this.props.socket;

    socket.on("newQuestionsList", this.onQuestionsListReceived);

    this.setState({
      questions: this.props.room.questions
    });
  }

  render() {
    let content = (
      <div className="card-list">
        <QuestionCard text="What should they offer at the concession stands in movie theaters?"/>
        <ResponseCard text="Popcorn? There will be a fun card game here one day..."/>
        <InputCard/>
      </div>
    );

    let room = this.props.room;
    let questions = this.state.questions;

    if (!room || !questions) {
      content = null;
    } else if (questions.length > 0) {
      content = <QuestionSelector questions={questions}/>
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