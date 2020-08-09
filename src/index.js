import React from 'react';
import ReactDOM from 'react-dom';
import Wrapper from './game/wrapper';
import Signup from "./setup/signup";
import Api from "./api/api";
import {LoadingScreen, LogoutScreen} from "./splash";
import RoomSetup from "./setup/rooms";
import Socket from "./api/socket";
import Room from "./api/struct/room";
import './index.scss';

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
      if (this.state.room) {
        stage = Stage.JOINED_ROOM;
      }
      this.setState({
        stage: stage
      });
    }
  };

  setRoom = (room) => {
    if (this.state.user.name && room && room.id && this.state.stage === Stage.SIGNED_UP) {
      this.setState({
        room: room
      });
    }
  }

  startGame = () => {
    let room = this.state.room;
    if (this.state.user.name && room && room.id && this.state.stage === Stage.SIGNED_UP) {
      room.finishedCreation = true;
      this.setState({
        stage: Stage.JOINED_ROOM,
        room: room
      });
    }
  };

  onForcedLogout = () => {
    this.state.socket.emit("forcedLogout");

    let user = this.state.user;
    if (!user || user.logged_out) return;

    user.logged_out = true;

    this.setState({
      socket: null,
      user: user,
      room: null
    });
  };

  onUserJoined = (data) => {
    let user = data.user;
    if (!user) return console.warn(`Received join data with no user:`, data)

    let room = this.state.room;
    if (!room) return console.warn(`Received join data when not in a room:`, this.state);

    console.info(`User #${user.id} joined the room:`, user);
    room.users[user.id] = user;

    this.setState({ room: room });
  };

  onUserUpdated = (data) => {
    let room = this.state.room;
    if (!room) return console.warn(`Received user update when not in a room:`, this.state);

    let userId = data.id;

    if (!room.users.hasOwnProperty(userId)) {
      return console.warn(`Received user update for unknown user #${userId}:`, data, room.users)
    }

    let user = room.users[userId];

    let userName = data.name;
    let userIcon = data.icon;

    if (userName || userIcon) {
      if (userName) user.name = userName;
      if (userIcon) user.icon = userIcon;

      console.info(`Updated user #${userId}:`, user);

      this.setState({
        room: room
      });
    }
  };

  onUserLeft = (data) => {
    let room = this.state.room;
    if (!room) return console.warn(`Received user update when not in a room:`, this.state);

    let userId = data.id;
    if (!room.users.hasOwnProperty(userId)) {
      return console.warn(`Received leave notification for unknown user #${userId}:`, data, room.users)
    }

    if (data.message) room.addMessage(data.message);

    room.users[userId].active = false;
    console.info(`User #${userId} left:`, room.users[userId]);


    this.setState({
      room: room
    });
  };

  onChatMessage = (data) => {
    let room = this.state.room;
    if (!room) return console.warn(`Received chat message when not in a room:`, this.state);

    let userId = data.message.user_id;
    if (!room.users.hasOwnProperty(userId)) {
      return console.warn(`Received chat message from unknown user #${userId}:`, data, room.users)
    }

    room.addMessage(data.message);

    this.setState({
      room: room
    });
  }

  onLogin = (data) => {
    console.info("Socket Init:", data);
    let user = data.user;

    let roomId = getURLParam("room");
    let token = getURLParam("token");

    if (roomId && token) {
      this.state.socket.joinRoom(roomId, token).then((room) => {
        console.info(`Joined room #${roomId}:`, room);
        this.setState({
          user: user,
          room: room
        });
      }).catch((error) => {
        console.info(`Failed to join room #${roomId}:`, error.message);
        Room.resetLink();

        this.setState({ user: user });
      });
    } else this.setState({ user: user });
  };

  componentDidMount() {
    setTimeout(function() {
      this.setState({ canRender: true });
    }.bind(this), 1000);
    Api.getUser().then((user) => {
      console.info("User:", user);

      let socket = new Socket(user);
      this.setState({ socket: socket });

      socket.on("init", this.onLogin);
      socket.on("forceLogout", this.onForcedLogout);
      socket.on("userJoined", this.onUserJoined);
      socket.on("userUpdated", this.onUserUpdated);
      socket.on("userLeft", this.onUserLeft);
      socket.on("chatMessage", this.onChatMessage);
    });
  }

  render() {
    let canRender = this.state.canRender && this.state.user;
    let stage = this.state.stage;
    let loggedOut = canRender && this.state.user && this.state.user.logged_out;

    return (
      <div id="app-wrapper">
        {stage < Stage.LOADED &&
          <WrapperContainer visible={!this.state.user} onTransitionEnd={this.loadingUpdate} >
            <LoadingScreen />
          </WrapperContainer>
        }
        {stage < Stage.SIGNED_UP &&
          <WrapperContainer visible={canRender && !loggedOut && !this.state.user.name} onTransitionEnd={this.signupUpdate}>
            <Signup user={this.state.user} onComplete={this.finishSignup} />
          </WrapperContainer>
        }
        {stage < Stage.JOINED_ROOM &&
          <WrapperContainer visible={canRender && !loggedOut && this.state.user.name && (!this.state.room || !this.state.room.finishedCreation)}>
            <RoomSetup
              socket={this.state.socket}
              user={this.state.user}
              onRoomCreated={this.setRoom}
              onComplete={this.startGame}
            />
          </WrapperContainer>
        }
        <WrapperContainer visible={canRender && !loggedOut && this.state.user.name && this.state.room && this.state.room.finishedCreation}>
          <Wrapper socket={this.state.socket} user={this.state.user} room={this.state.room} />
        </WrapperContainer>
        <WrapperContainer visible={loggedOut}>
          <LogoutScreen />
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
