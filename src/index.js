import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import Wrapper from './game/wrapper';
import Signup from "./user/signup";
import {getUser} from "./api";

class QuestionsGame extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      user: null
    }
  }

  componentDidMount() {
    getUser().then((user) => {
      this.setState({
        user: user
      });
    });
  }

  render() {
    if (this.state.user === null) {
      return (
        <div className="loading-center">
          Loading...
        </div>
      );
    } else if (!this.state.user.name) {
      return (
        <Signup user={this.state.user} />
      );
    } else {
      return (
        <Wrapper user={this.state.user} />
      );
    }
  }
}

ReactDOM.render(
  <React.StrictMode>
    <QuestionsGame />
  </React.StrictMode>,
  document.getElementById('root')
);
