import React from 'react';
import './Card.scss';

class Card extends React.Component {
  render() {
    return (
      <div className={"card " + this.props.type}>
        <p className="text">{this.props.text}</p>
      </div>
    );
  }
}

class InputCard extends React.Component {
  render() {
    return (
      <div className="card answer input">
        <p className="text" contentEditable="true" placeholder="your answer..."></p>
      </div>
    );
  }
}

export {Card, InputCard};