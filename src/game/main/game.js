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
      <h1>{(props.askedBy ? props.askedBy.name : "You")} asked a question</h1>
      <p>{props.responses}/{props.players} players have responded</p>
      <br/>
      <div className="card-list">
        <QuestionCard text={props.question.question}/>
      </div>
      {!props.askedBy &&
        <Button id="read-answers-btn" isDisabled={props.responses < 2}>
          Read Answers
        </Button>
      }

    </div>
  );
}

function AnswerInput(props) {
  return (
    <div>
      <h1>{(props.askedBy ? props.askedBy.name : "Someone")} asked a question</h1>
      <p>{props.responses}/{props.players} players have responded</p>
      <br />
      <div className="card-list">
        <QuestionCard text={props.question.question}/>
        <InputCard />
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
    answersReceived: 0
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
      questions: questions
    });
  }

  componentDidUpdate = (prevProps) => {
    if (!this.props.room || prevProps.room) return;

    console.info("Registering game event listeners");
    let socket = this.props.socket;

    socket.on("newQuestionsList", this.onQuestionsListReceived);
    socket.on("questionSelected", this.onQuestionSelected);

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

      if (user.state !== UserState.ASKING_QUESTION) {
        room.forEachUser((user) => {
          if (user.state === UserState.ASKING_QUESTION) askedBy = user;
        });
      }

      if (questions.length < 1) {
        content = <LoadingSpinner/>;
      } else if (user.state === UserState.ANSWERING_QUESTION) {
        content = (
          <AnswerInput
            question={questions[0]}
            responses={this.state.answersReceived}
            players={activePlayers.length}
            askedBy={askedBy}
          />
        )
      } else {

        content = (
          <AnswerCollector
            question={questions[0]}
            responses={this.state.answersReceived}
            players={activePlayers.length}
            askedBy={askedBy}
          />
        );
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