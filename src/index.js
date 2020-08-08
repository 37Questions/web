import React from 'react';
import ReactDOM from 'react-dom';
import Wrapper from './game/wrapper';
import Signup from "./setup/signup";
import Api from "./api/api";
import {LoadingScreen} from "./loading";
import RoomSetup from "./setup/rooms";
import './index.scss';
import {createSocket} from "./api/socket";

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

export function getURLParam(name) {
  let results = new RegExp('[?&]' + name + '=([^&#]*)').exec(window.location.href);
  return results ? results[1] : null;
}

class QuestionsGame extends React.Component {
  state = {
    stage: Stage.LOADING,
    canRender: false,
    socket: null,
    user: null,
    room: null
  };

  loadingUpdate = () => {
    if (this.state.user && this.state.stage === Stage.LOADING) {
      let stage = Stage.LOADED;
      if (this.state.user.name) stage = this.state.room ? Stage.JOINED_ROOM : Stage.SIGNED_UP;

      this.setState({ stage: stage });
    }
  };

  finishSignup = (name, icon) => {
    let user = this.state.user;
    user.name = name;
    user.icon = icon;
    this.setState({
      user: user
    });
  };

  signupUpdate = () => {
    if (this.state.user.name && this.state.stage === Stage.LOADED) {
      let stage = Stage.SIGNED_UP;
      if (this.state.user.room_id) {
        stage = Stage.JOINED_ROOM;
      }
      this.setState({
        stage: stage
      });
    }
  };

  startGame = (room) => {
    if (this.state.user.name && room && room.id && this.state.stage === Stage.SIGNED_UP) {
      let user = this.state.user;
      user.room_id = room.id;
      this.setState({
        stage: Stage.JOINED_ROOM,
        user: user,
        room: room
      });
    }
  };

  componentDidMount() {
    setTimeout(function() {
      this.setState({
        canRender: true
      });
    }.bind(this), 1000);
    Api.getUser().then((user) => {
      console.info("User:", user);
      let socket = createSocket(user);

      let roomId = getURLParam("room");
      let token = getURLParam("token");

      if (roomId && token) {
        socket.emit("joinRoom", {
          id: roomId,
          token: token
        }, (res) => {
          if (res.error) {
            let url = window.location.href.split("?")[0];
            window.history.pushState(null, null, url);
            console.info(`Failed to join room #${roomId}:`, res.error);
            this.setState({
              socket: socket,
              user: user
            });
          } else {
            user.room_id = res.room.id;

            this.setState({
              socket: socket,
              user: user,
              room: res.room
            });
          }
        });
      } else if (user.room_id) {
        socket.emit("rejoinRoom", {}, (res) => {
          if (res.error) {
            console.info(`Failed to rejoin room #${user.room_id}:`, res.error);
            this.setState({
              socket: socket,
              user: user
            });
          } else {
            console.info(`Rejoined room #${user.room_id}:`, res.room);
            this.setState({
              socket: socket,
              user: user,
              room: res.room
            });
          }
        });
      } else {
        this.setState({
          socket: socket,
          user: user
        });
      }
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
            <RoomSetup socket={this.state.socket} user={this.state.user} onComplete={this.startGame} />
          </WrapperContainer>
        }
        <WrapperContainer visible={canRender && this.state.user.name && this.state.user.room_id}>
          <Wrapper socket={this.state.socket} user={this.state.user} room={this.state.room} />
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
