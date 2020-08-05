import React from 'react';
import './card.scss';

function CardBacking() {
  return (
    <div className="card back">
      <div className="title-wrapper">
        <h1 className="big">37</h1>
        <h2 className="small">Questions</h2>
      </div>
    </div>
  );
}

function Card(props) {
  return (
    <div className="outer-card">
      <div className="inner-card">
        <div className={props.type + " card front"}>
          <p className="text">{props.text}</p>
        </div>
        <CardBacking />
      </div>
    </div>
  )
}

function QuestionCard(props) {
  return (
    <Card type="question" text={props.text} />
  );
}

function ResponseCard(props) {
  return (
    <Card type="response" text={props.text} />
  )
}

class InputCard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      error: null,
      flipped: false
    };

    this.input = React.createRef();

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onInputChanged = this.onInputChanged.bind(this);
    this.submit = this.submit.bind(this);
  }

  onKeyDown(e) {
    // If the enter key was pressed
    if (e.keyCode === 13) {
      e.preventDefault();
      this.submit();
    }
  }

  onInputChanged(e) {
    let text = e.target.value;
    this.validateInput(text);
  }

  validateInput(text) {
    if (text.length < 1) {
      this.setState({
        error: "too short!"
      });
      return false;
    } else if (this.state.error) {
      this.setState({
        error: null
      });
    }
    return true;
  }

  submit() {
    let text = this.input.current.value;

    if (this.validateInput(text)) {
      this.setState({
        flipped: !this.state.flipped
      });
    }
  }

  render() {
    return (
      <div className="outer-card">
        <div className={"inner-card" + (this.state.flipped ? " flipped" : "")}>
          <div className={"input response" + (this.state.error ? " error" : "") + " card front"}>
            <textarea
              maxLength="140"
              className="text"
              placeholder={this.state.error || "your answer..."}
              onKeyDown={this.onKeyDown}
              onInput={this.onInputChanged}
              ref={this.input}
            />
            <div className="corner">
              <div className="submit-text">Submit</div>
              <div className="submit-btn-wrapper" onClick={this.submit}>
                <span className="submit-icon" title="Submit">
                  <i className="far fa-paper-plane" />
                </span>
              </div>
            </div>
          </div>
          <CardBacking />
        </div>
      </div>
    );
  }
}

export {QuestionCard, ResponseCard, InputCard};