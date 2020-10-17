import * as React from "react";
import {QuestionCard, ResponseCard} from "../card/card";
import {AnswerState} from "../../api/struct/answer";
import "./answer_list.scss";
import {Button} from "../../ui/button";
import Icon from "../../setup/icon";

class AnswerList extends React.Component {
  state = {
    selectedAnswer: null
  };

  wasAskedBySelf = () => this.props.askedBy && this.props.askedBy.id === this.props.self.id;

  clickAnswer = (answer) => {
    if (!this.wasAskedBySelf()) return;

    console.info("Clicked answer:", answer);

    if (answer.state === AnswerState.SUBMITTED) {
      this.props.socket.revealAnswer(answer.displayPosition).catch((error) => {
        console.warn(`Failed to reveal answer #${answer.displayPosition}:`, error.message);
      });
    } else {
      console.info("Started guessing for:", answer);
      this.setState({
        selectedAnswer: answer
      });
    }
  };

  clickStar = (e, answer) => {
    if (!this.wasAskedBySelf()) return;

    e.stopPropagation();
    console.info("Clicked star:", answer);

    let isFavorite = !!this.props.favoriteAnswers.includes(answer.displayPosition);
    if (isFavorite) {
      this.props.socket.clearFavoriteAnswer().catch((error) => {
        console.warn(`Failed to clear favorite answer #${answer.displayPosition}:`, error.message);
      });
    } else if (answer.state === AnswerState.REVEALED) {
      this.props.socket.setFavoriteAnswer(answer.displayPosition).catch((error) => {
        console.warn(`Failed to set favorite answer #${answer.displayPosition}:`, error.message);
      });
    }
  };

  makeGuess = (e, answer, user) => {
    e.stopPropagation();
    console.info("Guess for " + answer + " is " + user);
  };

  stopGuessing = (e) => {
    e.stopPropagation();
    this.setState({
      selectedAnswer: null
    });
  };

  render = () => {
    let askedBy = this.props.askedBy;
    let self = this.props.self;
    let askedBySelf = this.wasAskedBySelf();

    if (this.state.selectedAnswer) {
      let users = this.props.users;

      return (
        <div className="answer-guessing">
          <h1>Someone responded to {askedBySelf ? "your" : (askedBy ? (askedBy.name + "'s") : "a")} question</h1>
          <div className="card-list">
            <QuestionCard text={this.props.question.question} />
            <ResponseCard
              answer={this.state.selectedAnswer}
              canFavorite={true}
              isFavorite={!!this.props.favoriteAnswers.includes(this.state.selectedAnswer.displayPosition)}
              onClickStar={(e) => this.clickStar(e, this.state.selectedAnswer)}
            />
          </div>
          <p className="select-prompt">Select the player who you think wrote this answer</p>
          <div className="user-list">
            {
              Object.keys(users).map((userId) => {
                let user = users[userId];
                if (!user.name || !user.icon || user.id === self.id) return null;

                return (
                  <div
                    className={"guessable-user"}
                    style={{backgroundColor: `hsl(${user.icon.backgroundColor}, 70%, 80%)`}}
                    onClick={(e) => this.makeGuess(e, this.state.selectedAnswer, user)}
                    key={user.id}
                  >
                    <Icon icon={user.icon} className="user-icon"/>
                    <div
                      className="user-name"
                      style={{color: `hsl(${user.icon.color}, 60%, 30%)`}}
                    >
                      {user.name}
                    </div>
                  </div>
                );
              })
            }
          </div>
          <Button className="finish-guessing-btn" onClick={this.stopGuessing}>
            Back
          </Button>
        </div>
      );
    }

    let hiddenAnswers = 0;
    this.props.answers.forEach((answer) => {
      if (answer.state === AnswerState.SUBMITTED) hiddenAnswers++;
    });

    let prompt = "Click any answer to reveal it";
    if (!askedBySelf) prompt = "They are reading the answers";
    else if (hiddenAnswers === 0) {
      if (this.props.favoriteAnswers.length === 0) prompt = "Click on a star to choose your favorite answer";
      else prompt = "Click on an answer to guess who wrote it";
    }

    return (
      <div className="answer-list">
        <h1>{askedBySelf ? "You" : (askedBy ? askedBy.name : "Someone")} asked a question</h1>
        <p className="answer-list-prompt">{prompt}</p>
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
                  isFavorite={!!this.props.favoriteAnswers.includes(answer.displayPosition)}
                  canHover={askedBySelf}
                  canFavorite={askedBySelf}
                  onClick={() => this.clickAnswer(answer)}
                  onClickStar={(e) => this.clickStar(e, answer)}
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