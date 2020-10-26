import * as React from "react";
import './game.scss';
import {RoomState, RoomVotingMethod} from "../../api/struct/room";
import {UserState} from "../../api/struct/user";
import {LoadingSpinner} from "../../splash";
import {AnswerCollector, AnswerInput} from "./answer_collection";
import {QuestionSelector} from "./question_selection";
import {AnswerList} from "./answer_list";
import {Button} from "../../ui/button";

class Game extends React.Component {
  state = {
    questions: [],
    answers: [],
    answerUserIds: [],
    favoriteAnswers: [],
    guessResults: {},
    hasAnswered: false
  };

  onRoundStarted = () => {
    this.setState({
      answers: [],
      answerUserIds: [],
      favoriteAnswers: [],
      guessResults: {},
      hasAnswered: false
    });
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
      hasAnswered: false,
      favoriteAnswers: []
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

  onResultsReceived = (data) => {
    this.setState({
      guessResults: data.guessResults
    });
  };

  initSocketEvents = (socket) => {
    console.info("Registering game event listeners");

    socket.on("startRound", this.onRoundStarted);
    socket.on("newQuestionsList", this.onQuestionsListReceived);
    socket.on("questionSelected", this.onQuestionSelected);
    socket.on("startReadingAnswers", this.onAnswersReceived);
    socket.on("answerRevealed", this.onAnswerRevealed);
    socket.on("answerFavorited", this.onAnswerFavorited);
    socket.on("favoriteAnswerCleared", this.onFavoriteAnswerCleared);
    socket.on("answerGuessed", this.onAnswerGuessed);
    socket.on("startViewingResults", this.onResultsReceived);
  };

  setRoom = (room) => {
    console.info("Initializing game room");

    this.setState({
      questions: room.questions,
      answers: room.answers,
      answerUserIds: room.answerUserIds,
      favoriteAnswers: room.favoriteAnswers,
      guessResults: room.guessResults,
      hasAnswered: false
    });
  };

  kickVoteButton = (user) => {
    if (!user) return null;

    const placeKickVote = (user) => {
      this.props.socket.placeKickVote(user.id).catch((err) => {
        console.warn("Failed to place kick vote:", err.message);
      });
    };

    let [kickVotes, votedToKick] = [0, false];
    if (user && this.props.room.kickVotes.hasOwnProperty(user.id)) {
      let votes = this.props.room.kickVotes[user.id];

      kickVotes = votes.length;
      votedToKick = votes.includes(this.props.user.id);
    }

    return (
      <Button className="small" onClick={() => placeKickVote(user)} isDisabled={votedToKick}>
        Vote{votedToKick ? "d" : ""} to Kick ({kickVotes}/3)
      </Button>
    );
  };

  render() {
    let room = this.props.room;
    let questions = this.state.questions;

    if (!room || !questions || !this.props.user) return <LoadingSpinner/>;

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
          {this.kickVoteButton(pickingUser)}
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
          room={this.props.room}
          question={questions[0]}
          responses={answersReceived}
          players={activePlayers.length}
          askedBy={askedBy}
          showResponse={user.state === UserState.ANSWERING_QUESTION || this.state.hasAnswered}
          onAnswerSubmitted={this.onAnswerSubmitted}
          kickVoteButton={this.kickVoteButton(askedBy)}
        />
      );
    } else if (room.state === RoomState.READING_ANSWERS || room.state === RoomState.VIEWING_RESULTS) {
      let [questions, answers] = [this.state.questions, this.state.answers];
      if (questions.length < 1 || answers.length < 1) return <LoadingSpinner/>;

      let askedBySelf = user.state === UserState.READING_ANSWERS || user.state === UserState.ASKED_QUESTION;
      let wonBySelf = user.state === UserState.WINNER || user.state === UserState.WINNER_ASKING_NEXT;
      let askedBy, wonBy, continueBy = null;

      if (askedBySelf) askedBy = user;
      if (wonBySelf) wonBy = user;

      room.forEachUser((roomUser) => {
        if (!askedBy && (roomUser.state === UserState.READING_ANSWERS || roomUser.state === UserState.ASKED_QUESTION)) askedBy = roomUser;
        if (!wonBy && (roomUser.state === UserState.WINNER || roomUser.state === UserState.WINNER_ASKING_NEXT)) wonBy = roomUser;
        if (!continueBy && (roomUser.state === UserState.ASKING_NEXT || roomUser.state === UserState.WINNER_ASKING_NEXT)) continueBy = roomUser;
      });

      if (room.votingMethod === RoomVotingMethod.WINNER) continueBy = wonBy;

      return (
        <AnswerList
          socket={this.props.socket}
          question={questions[0]}
          askedBy={askedBy}
          wonBy={wonBy}
          continueBy={continueBy}
          answers={answers}
          self={user}
          room={room}
          answerUserIds={this.state.answerUserIds}
          favoriteAnswers={this.state.favoriteAnswers}
          guessResults={this.state.guessResults}
          kickVoteButton={this.kickVoteButton}
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