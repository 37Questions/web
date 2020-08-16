import * as React from "react";
import {QuestionCard, ResponseCard} from "../card/card";

class AnswerList extends React.Component {
  render = () => {
    return (
      <div>
        <h1>{(this.props.askedBy ? this.props.askedBy.name : "Someone")} asked a question</h1>
        <p>Here are the answers</p>
        <br />
        <div className="card-list">
          <QuestionCard text={this.props.question.question} />
        </div>
        <div className="card-list">
          {
            this.props.answers.map((answer) => {
              return <ResponseCard key={answer.displayPosition} text={answer.answer} />
            })
          }
        </div>
      </div>
    );
  };
}

export {AnswerList};