import {InputCard, QuestionCard} from "../card/card";
import {Button} from "../../ui/button";
import * as React from "react";

function AnswerCollector(props) {
  const startReadingAnswers = () => {
    if (props.responses < 2) return console.warn("At least 2 responses are required");
    props.socket.startReadingAnswers().then((res) => {
      console.info("Reading answers:", res);
    }).catch((error) => {
      console.warn("Failed to start reading answers:", error.message);
    });
  };

  return (
    <div>
      <h1>You asked a question</h1>
      <p>{props.responses}/{props.players} players have responded</p>
      <br/>
      <div className="card-list">
        <QuestionCard text={props.question.question}/>
      </div>
      <Button id="read-answers-btn" isDisabled={props.responses < 2} onClick={startReadingAnswers}>
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
      <br />
    </div>
  );
}


export {AnswerCollector, AnswerInput};