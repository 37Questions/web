import * as React from "react";
import {InputCard, QuestionCard, ResponseCard} from "../card/card";
import './game.scss';
import {RoomState} from "../../api/struct/room";
import {UserState} from "../../api/struct/user";
import {LoadingSpinner} from "../../splash";
import {Button} from "../../ui/button";

function AnswerCollector(props) {
  return (
    <div>
      <h1>You asked a question</h1>
      <p>{props.responses}/{props.players} players have responded</p>
      <br/>
      <div className="card-list">
        <QuestionCard text={props.question.question}/>
      </div>
      <Button id="read-answers-btn" isDisabled={props.responses < 2}>
        Read Answers
      </Button>

    </div>
  );
}

function AnswerInput(props) {
  const onSubmit = (answer) => {
    console.info("Submitted answer:", answer);
    if (props.onAnswerSubmitted) props.onAnswerSubmitted(answer);
    return props.socket.submitAnswer(answer).then((res) => {
      console.info("Submitted answer:", answer, res);
    });
  };

  return (
    <div>
      <h1>{(props.askedBy ? props.askedBy.name : "Someone")} asked a question</h1>
      <p>{props.responses}/{props.players} players have responded</p>
      <br />
      <div className="card-list">
        <QuestionCard text={props.question.question}/>
        {
          props.showResponse && <InputCard onSubmit={onSubmit} />
        }
      </div>
    </div>
  );
}

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

  componentDidUpdate = (prevProps) => {
    if (!this.props.room || prevProps.room) return;

    console.info("Registering game event listeners");
    let socket = this.props.socket;

    socket.on("newQuestionsList", this.onQuestionsListReceived);
    socket.on("questionSelected", this.onQuestionSelected);

    this.setState({
      questions: this.props.room.questions,
      hasAnswered: false
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

    if (!room || !questions || !this.props.user) {
      return null;
    }

    let user = room.users[this.props.user.id];
    let activePlayers = room.getActiveUsers(user.id);

    if (room.state === RoomState.PICKING_QUESTION) {
      if (user.state === UserState.SELECTING_QUESTION && questions.length > 0) {
        content = (
          <QuestionSelector
            socket={this.props.socket}
            questions={questions}
            activePlayers={activePlayers.length}
          />
        );
      } else {
        let pickingUser = undefined;

        room.forEachUser((user) => {
          if (user.state === UserState.SELECTING_QUESTION) pickingUser = user;
        });

        content = (
          <div>
            <h1>{(pickingUser ? pickingUser.name : "Someone")} is selecting a question...</h1>
            <p>This might take a moment</p>
            <br/>
            <LoadingSpinner/>
          </div>
        )
      }
    } else if (room.state === RoomState.COLLECTING_ANSWERS) {
      let askedBy = undefined;
      let answersReceived = 0;

      room.forEachUser((roomUser) => {
        if (roomUser.state === UserState.ASKING_QUESTION) askedBy = roomUser;
        if (roomUser.active && roomUser.name && roomUser.icon && roomUser.state === UserState.IDLE) answersReceived++;
      });

      if (questions.length < 1) {
        content = <LoadingSpinner/>;
      } else if (user.state === UserState.ASKING_QUESTION) {
        content = (
          <AnswerCollector
            question={questions[0]}
            responses={answersReceived}
            players={activePlayers.length}
          />
        );
      } else {
        content = (
          <AnswerInput
            socket={this.props.socket}
            question={questions[0]}
            responses={answersReceived}
            players={activePlayers.length}
            askedBy={askedBy}
            showResponse={user.state === UserState.ANSWERING_QUESTION || this.state.hasAnswered}
            onAnswerSubmitted={this.onAnswerSubmitted}
          />
        )
      }
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