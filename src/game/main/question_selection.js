import * as React from "react";
import {QuestionCard} from "../card/card";
import {AnswerCollector} from "./answer_collection";

class QuestionSelector extends React.Component {
  state = {
    submittedQuestion: undefined
  };

  onClick = (question) => {
    console.info("Submitting Question:", question);

    this.setState({
      submittedQuestion: question
    }, () => {
      this.props.socket.submitQuestion(question.id).then((res) => {
        console.info("Submitted question for real:", res);
      }).catch((error) => {
        console.warn(`Failed to submit question #${question.id}:`, error.message);
        this.setState({
          submittedQuestion: undefined
        });
      });
    });
  };

  render = () => {
    if (this.state.submittedQuestion) {
      return (
        <AnswerCollector
          question={this.state.submittedQuestion}
          responses={0}
          players={this.props.activePlayers}
        />
      );
    }

    return (
      <div>
        <h1>Choose a Question</h1>
        <p>Select one of the questions below to ask the room</p>
        <br/>
        <div className="card-list">
          {
            this.props.questions.map((question) => {
              return (
                <QuestionCard
                  key={question.id}
                  text={question.question}
                  canHover={true}
                  onClick={() => this.onClick(question)}
                />
              );
            })
          }
        </div>
      </div>
    );
  };
}

export {QuestionSelector};