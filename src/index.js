import React from 'react';
import ReactDOM from 'react-dom';
import Wrapper from './game/wrapper';
import Signup from "./user/signup";
import {getUser} from "./api";
import LoadingScreen from "./loading";
import './index.scss';

function WrapperContainer(props) {
  return (
    <div className={"wrapper-container " + (props.visible ? "visible" : "hidden")}>
      {props.children}
    </div>
  );
}

class QuestionsGame extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      canRender: false,
      user: null
    };
  }

  componentDidMount() {
    setTimeout(function() {
      this.setState({
        canRender: true
      });
    }.bind(this), 1000);
    getUser().then((user) => {
      this.setState({
        user: user
      });
    });
  }

  render() {
    let canRender = this.state.canRender && this.state.user;
    return (
      <div id="app-wrapper">
        <WrapperContainer visible={!this.state.user}>
          <LoadingScreen />
        </WrapperContainer>
        <WrapperContainer visible={canRender && !this.state.user.name}>
          <Signup user={this.state.user} />
        </WrapperContainer>
        <WrapperContainer visible={canRender && this.state.user.name}>
          <Wrapper user={this.state.user} />
        </WrapperContainer>
      </div>
    );
  }
}

ReactDOM.render(
  <React.StrictMode>
    <QuestionsGame />
  </React.StrictMode>,
  document.getElementById('root')
);
