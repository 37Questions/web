import * as React from "react";
import "./suggestion_overlay.scss";
import {InputCard} from "../card/card";
import {Button} from "../../ui/button";

class SuggestionOverlay extends React.Component {
  state = {
    submitted: false
  };

  card = React.createRef();

  onSubmit = (question) => {
    return this.props.socket.suggestQuestion(question).then(() => {
      console.info("Submitted question:", question);
      this.setState({
        submitted: true
      });
    }).catch((err) => {
      console.error("Error:", err);
    });
  };

  close = () => {
    this.setState({
      submitted: false
    });
    this.card.current.reset();
    this.props.close();
  };

  render = () => {
    let desc = (
      <p>
        We're always looking for new questions to add to the game.
        If you have a suggestion, we'd really appreciate it if you submitted it below!
     </p>
    );
    if (this.state.submitted) desc = <p className="submission-thanks">Thanks for your submission!</p>;

    return (
      <div
        id="suggestion-overlay"
        className={(this.props.visible ? "visible" : "")}
        onClick={this.close}
      >
        <div id="suggestion-panel-wrapper">
          <div id="suggestion-panel" onClick={(e) => e.stopPropagation()}>
            <h1>Suggest a Question</h1>
            {desc}
            <div className="suggestion-wrapper">
              <InputCard placeholder="your question..." onSubmit={this.onSubmit} ref={this.card}/>
            </div>
            <Button onClick={this.close}>Close</Button>
          </div>
        </div>
      </div>
    );
  };
}

export {SuggestionOverlay};