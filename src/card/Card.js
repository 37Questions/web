import React from 'react';
import './Card.scss';

class Card extends React.Component {
  render() {
    return (
      <div className={this.props.type + " card"}>
        <p className="text">{this.props.text}</p>
      </div>
    )
  }
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

    this.input = React.createRef();
    this.submit = this.submit.bind(this);
  }

  handleInput(e) {
    let text = e.target.textContent;
    console.info("Text:", text);
    e.target.textContent = text.substring(0, 100);
  }

  submit() {
    let text = this.input.current.textContent;
    console.info("Submit:", text);
  }

  render() {
    return (
      <div className="input response card">
        <p
          contentEditable="true"
          className="text"
          placeholder="your answer..."
          onKeyUpCapture={this.handleInput}
          onPaste={this.handleInput}
          ref={this.input}
        />
        <div className="corner">
          <p className="submit-text">Submit</p>
          <div className="submit-btn-wrapper" onClick={this.submit}>
            <span className="submit-icon" title="Submit">
              <i className="far fa-paper-plane" />
            </span>
          </div>
        </div>
      </div>
    );
  }
}

export {QuestionCard, ResponseCard, InputCard};