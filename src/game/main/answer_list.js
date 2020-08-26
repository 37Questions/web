import * as React from "react";
import {QuestionCard, ResponseCard} from "../card/card";
import {AnswerState} from "../../api/struct/answer";

class AnswerList extends React.Component {
  clickAnswer = (answer) => {
    if (!this.props.askedBySelf) return;

    console.info("Clicked answer:", answer);

    if (answer.state === AnswerState.SUBMITTED) {
      this.props.socket.revealAnswer(answer.displayPosition).catch((error) => {
        console.warn(`Failed to reveal answer #${answer.displayPosition}:`, error.message);
      });
    }
  };

  clickStar = (answer) => {
    if (!this.props.askedBySelf) return;

    console.info("Clicked star:", answer);

    if (answer.state === AnswerState.REVEALED) {
      this.props.socket.setFavoriteAnswer(answer.displayPosition).catch((error) => {
        console.warn(`Failed to set favorite answer #${answer.displayPosition}:`, error.message);
      });
    }
  };

  render = () => {
    let askedBy = this.props.askedBy;
    let askedBySelf = this.props.askedBySelf;

    return (
      <div>
        <h1>{askedBySelf ? "You" : (askedBy ? askedBy.name : "Someone")} asked a question</h1>
        <p>{askedBySelf ? "Click any answer to reveal it" : "They are reading the answers"}</p>
        <br />
        <div className="card-list">
          <QuestionCard text={this.props.question.question} />
        </div>
        <div className="card-list">
          {
            this.props.answers.map((answer) => {
              return (
                <ResponseCard
                  key={answer.displayPosition}
                  answer={answer}
                  canHover={answer.state === AnswerState.SUBMITTED}
                  canFavorite={askedBySelf}
                  onClick={() => this.clickAnswer(answer)}
                  onClickStar={() => this.clickStar(answer)}
                />
              );
            })
          }
        </div>
        <br />
      </div>
    );
  };
}

export {AnswerList};