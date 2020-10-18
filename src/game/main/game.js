import * as React from "react";
import './game.scss';
import {RoomState} from "../../api/struct/room";
import {UserState} from "../../api/struct/user";
import {LoadingSpinner} from "../../splash";
import {AnswerCollector, AnswerInput} from "./answer_collection";
import {QuestionSelector} from "./question_selection";
import {AnswerList} from "./answer_list";

class Game extends React.Component {
  state = {
    questions: [],
    answers: [],
    answerUserIds: [],
    favoriteAnswers: [],
    hasAnswered: false
  };

  onQuestionsListReceived = (data) => {
    console.info("Received question list:", data);
    this.setState({
      questions: data.questions
    });
  };

  onQuestionSelected = (data) => {
    let questions = [];
    questions.push(data.question);
    this.setState({
      questions: questions,
      hasAnswered: false
    });
  };

  onAnswerSubmitted = () => {
    this.setState({
      hasAnswered: true
    });
  };

  onAnswersReceived = (data) => {
    console.info("Answers received:", data.answers);
    this.setState({
      answers: data.answers,
      answerUserIds: data.answerUserIds
    });
  };

  onAnswerRevealed = (data) => {
    let answer = data.answer;
    console.info("Answer revealed:", answer);

    let answers = this.state.answers;
    if (answers.length < answer.displayPosition) return console.warn("Tried to reveal unknown answer", answer, answers);

    answers[answer.displayPosition] = answer;
    this.setState({answers: answers});
  };

  onAnswerFavorited = (data) => {
    this.setState({favoriteAnswers: [data.displayPosition]});
  };

  onFavoriteAnswerCleared = () => {
    this.setState({favoriteAnswers: []});
  };

  onAnswerGuessed = (data) => {
    let answers = this.state.answers;

    console.info("Received guess for answer #" + data.displayPosition + " for user #" + data.guessedUserId);

    // TODO: democratic guessing
    answers.forEach((answer) => {


      if (answer.displayPosition === data.displayPosition) {
        answer.guesses = [{
          guessedUserId: data.guessedUserId
        }];
      } else {
        // Remove existing guesses for the same user id
        let g = answer.guesses.length;
        while (g--) {
          if (answer.guesses[g].guessedUserId === data.guessedUserId) {
            answer.guesses.splice(g, 1);
          }
        }
      }
    });

    this.setState({
      answers: answers
    });
  };

  componentDidUpdate = (prevProps) => {
    if (!this.props.room) return;
    if (prevProps.room && prevProps.room.clientId === this.props.room.clientId) return;

    console.info("Registering game event listeners");
    let socket = this.props.socket;

    socket.on("newQuestionsList", this.onQuestionsListReceived);
    socket.on("questionSelected", this.onQuestionSelected);
    socket.on("startReadingAnswers", this.onAnswersReceived);
    socket.on("answerRevealed", this.onAnswerRevealed);
    socket.on("answerFavorited", this.onAnswerFavorited);
    socket.on("favoriteAnswerCleared", this.onFavoriteAnswerCleared);
    socket.on("answerGuessed", this.onAnswerGuessed);

    this.setState({
      questions: this.props.room.questions,
      answers: this.props.room.answers,
      answerUserIds: this.props.room.answerUserIds,
      favoriteAnswers: this.props.room.favoriteAnswers,
      hasAnswered: false
    });
  };

  render() {
    let room = this.props.room;
    let questions = this.state.questions;

    if (!room || !questions || !this.props.user) return <LoadingSpinner />;

    let user = room.users[this.props.user.id];
    let activePlayers = room.getActiveUsers(user.id);

    if (room.state === RoomState.PICKING_QUESTION) {
      if (user.state === UserState.SELECTING_QUESTION && questions.length > 0) {
        return (
          <QuestionSelector
            socket={this.props.socket}
            questions={questions}
            activePlayers={activePlayers.length}
          />
        );
      }

      let pickingUser = undefined;
      room.forEachUser((user) => {
        if (user.state === UserState.SELECTING_QUESTION) pickingUser = user;
      });

      return (
        <div>
          <h1>{(pickingUser ? pickingUser.name : "Someone")} is selecting a question...</h1>
          <p>This might take a moment</p>
          <br/>
          <LoadingSpinner/>
        </div>
      );
    } else if (room.state === RoomState.COLLECTING_ANSWERS) {
      let askedBy = undefined;
      let answersReceived = 0;

      room.forEachUser((roomUser) => {
        if (roomUser.state === UserState.ASKING_QUESTION) askedBy = roomUser;
        if (roomUser.active && roomUser.name && roomUser.icon && roomUser.state === UserState.IDLE) answersReceived++;
      });

      if (questions.length < 1) return <LoadingSpinner/>;

      if (user.state === UserState.ASKING_QUESTION) {
        return (
          <AnswerCollector
            socket={this.props.socket}
            question={questions[0]}
            responses={answersReceived}
            players={activePlayers.length}
          />
        );
      }

      return (
        <AnswerInput
          socket={this.props.socket}
          question={questions[0]}
          responses={answersReceived}
          players={activePlayers.length}
          askedBy={askedBy}
          showResponse={user.state === UserState.ANSWERING_QUESTION || this.state.hasAnswered}
          onAnswerSubmitted={this.onAnswerSubmitted}
        />
      );
    } else if (room.state === RoomState.READING_ANSWERS) {
      let [questions, answers] = [this.state.questions, this.state.answers];
      if (questions.length < 1 || answers.length < 1) return <LoadingSpinner />;

      let askedBySelf = user.state === UserState.READING_ANSWERS;
      let askedBy = undefined;

      if (askedBySelf) askedBy = user;
      else {
        room.forEachUser((roomUser) => {
          if (roomUser.state === UserState.READING_ANSWERS) askedBy = roomUser;
        });
      }

      return (
        <AnswerList
          socket={this.props.socket}
          question={questions[0]}
          askedBy={askedBy}
          answers={answers}
          self={user}
          users={room.users}
          answerUserIds={this.state.answerUserIds}
          favoriteAnswers={this.state.favoriteAnswers}
        />
      );
    }

    return (
      <div>
        <h1>Invalid State</h1>
        <p>This should not happen</p>
        <br/>
        <LoadingSpinner/>
      </div>
    );
  }
}

function GameWrapper(props) {
  return (
    <div id="outer-game-wrapper">
      <div id="inner-game-wrapper">
        {props.children}
      </div>
    </div>
  );
}

export {Game, GameWrapper};