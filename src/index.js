import React from 'react';
import ReactDOM from 'react-dom';
import Wrapper from './game/wrapper';
import Signup from "./setup/signup";
import Api from "./api";
import LoadingScreen from "./loading";
import './index.scss';
import RoomSetup from "./setup/rooms";

function WrapperContainer(props) {
  return (
    <div
      className={"wrapper-container " + (props.visible ? "visible" : "hidden")}
      onTransitionEnd={props.onTransitionEnd}
    >
      {props.children}
    </div>
  );
}

class Stage {
  static LOADING = 0;
  static LOADED = 1;
  static SIGNED_UP = 2;
  static JOINED_ROOM = 3;
}

class QuestionsGame extends React.Component {
  state = {
    stage: Stage.LOADING,
    canRender: false,
    user: null
  };

  finishSignup = (user) => {
    this.setState({
      user: user
    });
  };

  loadingUpdate = () => {
    if (this.state.user && this.state.stage === Stage.LOADING) {
      this.setState({
        stage: this.state.user.name ? Stage.SIGNED_UP : Stage.LOADED
      });
    }
  };

  signupUpdate = () => {
    if (this.state.user.name && this.state.stage === Stage.LOADED) {
      this.setState({
        stage: Stage.SIGNED_UP
      });
    }
  };

  finishRoomSetup(user, room) {
    console.info("Finished room setup :)");
  };

  componentDidMount() {
    setTimeout(function() {
      this.setState({
        canRender: true
      });
    }.bind(this), 1000);
    Api.getUser().then((user) => {
      console.info("User:", user);
      this.setState({
        user: user
      });
    });
  }

  render() {
    let canRender = this.state.canRender && this.state.user;
    let stage = this.state.stage;

    return (
      <div id="app-wrapper">
        {stage < Stage.LOADED &&
          <WrapperContainer visible={!this.state.user} onTransitionEnd={this.loadingUpdate} >
            <LoadingScreen />
          </WrapperContainer>
        }
        {stage < Stage.SIGNED_UP &&
          <WrapperContainer visible={canRender && !this.state.user.name} onTransitionEnd={this.signupUpdate}>
            <Signup user={this.state.user} onComplete={this.finishSignup} />
          </WrapperContainer>
        }
        {stage < Stage.JOINED_ROOM &&
          <WrapperContainer visible={canRender && this.state.user.name && !this.state.user.room_id}>
            <RoomSetup user={this.state.user} onComplete={this.finishRoomSetup} />
          </WrapperContainer>
        }
        <WrapperContainer visible={canRender && this.state.user.room_id}>
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
