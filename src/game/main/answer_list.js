import * as React from "react";
import {QuestionCard, ResponseCard} from "../card/card";
import {AnswerState} from "../../api/struct/answer";
import {RoomState, RoomVotingMethod} from "../../api/struct/room";
import {UserState} from "../../api/struct/user";
import {Button} from "../../ui/button";
import Icon from "../../setup/icon";
import "./answer_list.scss";

class AnswerList extends React.Component {
  state = {
    selectedAnswer: null
  };

  wasAskedBySelf = () => this.props.askedBy && this.props.askedBy.id === this.props.self.id;
  wasWonBySelf = () => this.props.wonBy && this.props.wonBy.id === this.props.self.id;

  canInteract = () => this.props.room.state === RoomState.READING_ANSWERS && this.wasAskedBySelf();
  canFinishRound = () => {
    let [method, state] = [this.props.room.votingMethod, this.props.self.state];
    return (method === RoomVotingMethod.WINNER && state === UserState.WINNER) || (method === RoomVotingMethod.ROTATE && (state === UserState.ASKING_NEXT || state === UserState.WINNER_ASKING_NEXT));
  };

  clickAnswer = (answer) => {
    if (!this.canInteract()) return;

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
    if (!this.canInteract()) return;

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
    if (!this.canInteract()) return;

    e.stopPropagation();
    console.info("Guess for ", answer, " is ", user);

    this.props.socket.makeAuthorGuess(answer.displayPosition, user.id).catch((error) => {
      console.warn(`Failed to make guess for answer #${answer.displayPosition}:`, error.message);
    });
  };

  stopGuessing = (e) => {
    e.stopPropagation();
    this.setState({
      selectedAnswer: null
    });
  };

  onContinue = (e) => {
    e.stopPropagation();

    let room = this.props.room;

    if (room.state === RoomState.READING_ANSWERS) {
      if (!this.canInteract()) return;

      let unguessedAnswers = 0;
      this.props.answers.forEach((answer) => {
        if (answer.guesses.length === 0) unguessedAnswers++;
      });
      if (this.props.favoriteAnswers.length === 0 || unguessedAnswers > 0) {
        console.warn("Tried to finalize guesses in incorrect state", this.props);
        return;
      }
      console.info("Finalizing guesses..");
      this.props.socket.finalizeGuesses().catch((err) => {
        console.warn("Failed to finalize guesses:", err.message);
      });
    } else if (room.state === RoomState.VIEWING_RESULTS) {
      if (!this.canFinishRound()) return;

      console.info("Finishing round...");
      this.props.socket.finishRound().catch((err) => {
        console.warn("Failed to finish round:", err.message);
      });
    }

  };

  render = () => {
    let room = this.props.room;
    let askedBy = this.props.askedBy;
    let self = this.props.self;
    let selectedAnswer = this.state.selectedAnswer;
    let askedBySelf = this.wasAskedBySelf();
    let canInteract = this.canInteract();

    if (canInteract && selectedAnswer) {
      let answerUserIds = this.props.answerUserIds;
      return (
        <div className="answer-guessing">
          <h1>Someone responded to {askedBySelf ? "your" : (askedBy ? (askedBy.name + "'s") : "a")} question</h1>
          <div className="card-list">
            <QuestionCard text={this.props.question.question}/>
            <ResponseCard
              answer={selectedAnswer}
              users={room.users}
              canFavorite={true}
              isFavorite={!!this.props.favoriteAnswers.includes(selectedAnswer.displayPosition)}
              onClickStar={(e) => this.clickStar(e, selectedAnswer)}
            />
          </div>
          <p className="select-prompt">Select the player who you think wrote this answer</p>
          <div className="user-list">
            {
              Object.keys(room.users).map((userId) => {
                let user = room.users[userId];
                if (!user.name || !user.icon || user.id === self.id || !answerUserIds.includes(user.id)) return null;

                let selected = false;
                for (let g = 0; g < selectedAnswer.guesses.length; g++) {
                  if (selectedAnswer.guesses[g].guessedUserId === user.id) selected = true;
                }

                let selectedElsewhere = false;
                if (!selected) {
                  for (let a = 0; a < this.props.answers.length; a++) {
                    let answer = this.props.answers[a];
                    for (let g = 0; g < answer.guesses.length; g++) {
                      let guess = answer.guesses[g];
                      if (guess.guessedUserId === user.id) {
                        selectedElsewhere = true;
                        break;
                      }
                    }
                  }
                }

                return (
                  <div
                    className={"guessable-user" + (selected ? " selected" : (selectedElsewhere ? " selected-elsewhere" : ""))}
                    style={{backgroundColor: `hsl(${user.icon.backgroundColor}, 70%, 80%)`}}
                    onClick={(e) => this.makeGuess(e, selectedAnswer, user)}
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
          <br/>
        </div>
      );
    }

    let hiddenAnswers = 0;
    let unguessedAnswers = 0;
    let numFavorites = this.props.favoriteAnswers.length;
    this.props.answers.forEach((answer) => {
      if (answer.state === AnswerState.SUBMITTED) hiddenAnswers++;
      else if (answer.guesses.length === 0) unguessedAnswers++;
    });

    let guessResults = this.props.guessResults;
    let canContinue = false;
    let title, prompt;

    let askedByName = (askedBySelf ? "You" : (askedBy ? askedBy.name : "Someone"));

    if (room.state === RoomState.READING_ANSWERS) {
      title = askedByName + " asked a question";
      prompt = "Click any answer to reveal it";
      if (!askedBySelf) prompt = "They are reading the answers";
      else if (hiddenAnswers === 0) {
        if (numFavorites === 0) prompt = "Click on a star to choose your favorite answer";
        else if (unguessedAnswers > 0) prompt = "Click on an answer to guess who wrote it";
        else prompt = "Press Continue to finalize your guesses"
      }
      canContinue = numFavorites > 0 && unguessedAnswers === 0;
    } else if (room.state === RoomState.VIEWING_RESULTS) {
      let wonBySelf = this.wasWonBySelf();
      let wonBy = this.props.wonBy;
      title = askedByName + " chose " + (wonBySelf ? "your" : (wonBy ? (wonBy.name + "'s") : "someone's"))
        + " answer as " + (askedBySelf ? "your" : "their") + " favorite!";

      let correctAnswers = 0;
      Object.keys(guessResults).forEach((displayPosition) => {
        let correct = guessResults[displayPosition];
        if (correct) correctAnswers++;
      });
      prompt = (askedBySelf ? "You" : "They") + " guessed " + correctAnswers + " answer" + (correctAnswers === 1 ? "" : "s") + " correctly";
      if (this.canFinishRound()) {
        prompt = "Press Continue to start the next round";
        canContinue = true;
      }
    }

    let button = null;
    let finalizeBtn = false;

    if (room.state === RoomState.READING_ANSWERS) {
      if (askedBySelf) finalizeBtn = true;
      else button = this.props.kickVoteButton(askedBy);
    } if (room.state === RoomState.VIEWING_RESULTS) {
     if (canContinue) finalizeBtn = true;
     else if (this.props.continueBy !== this.props.self.id) button = this.props.kickVoteButton(this.props.continueBy);
    }

    if (finalizeBtn) button = (
      <Button className="finalize-guesses-btn" onClick={this.onContinue} isDisabled={!canContinue}>
        Continue
      </Button>
    );

    return (
      <div className="answer-list">
        <h1>{title}</h1>
        <p className="answer-list-prompt">{prompt}</p>
        <br/>
        <div className="card-list">
          <QuestionCard text={this.props.question.question}/>
        </div>
        <div className="card-list">
          {
            this.props.answers.map((answer) => {
              let isCorrectlyGuessed = false;
              if (room.state === RoomState.VIEWING_RESULTS) {
                if (!guessResults.hasOwnProperty(answer.displayPosition)) return null;
                isCorrectlyGuessed = guessResults[answer.displayPosition];
              }
              return (
                <ResponseCard
                  key={answer.displayPosition}
                  answer={answer}
                  users={room.users}
                  isFavorite={!!this.props.favoriteAnswers.includes(answer.displayPosition)}
                  canHover={canInteract}
                  canFavorite={canInteract}
                  showGuessResults={room.state === RoomState.VIEWING_RESULTS}
                  isCorrectlyGuessed={isCorrectlyGuessed}
                  onClick={() => this.clickAnswer(answer)}
                  onClickStar={(e) => this.clickStar(e, answer)}
                />
              );
            })
          }
        </div>
        {button}
        <br/>
      </div>
    );
  };
}

export {AnswerList};