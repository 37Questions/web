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
  }

  onAnswerSubmitted = () => {
    this.setState({
      hasAnswered: true
    });
  }

  onAnswersReceived = (data) => {
    console.info("Answers:", data.answers);
    this.setState({
      answers: data.answers
    });
  }

  componentDidUpdate = (prevProps) => {
    if (!this.props.room || prevProps.room) return;

    console.info("Registering game event listeners");
    let socket = this.props.socket;

    socket.on("newQuestionsList", this.onQuestionsListReceived);
    socket.on("questionSelected", this.onQuestionSelected);
    socket.on("startReadingAnswers", this.onAnswersReceived);

    this.setState({
      questions: this.props.room.questions,
      answers: this.props.room.answers,
      hasAnswered: false
    });
  }

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

      let askedBy = undefined;
      room.forEachUser((roomUser) => {
        if (roomUser.state === UserState.READING_ANSWERS) askedBy = roomUser;
      });

      return (
        <AnswerList question={questions[0]} askedBy={askedBy} answers={answers} />
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