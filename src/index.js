import React from 'react';
import ReactDOM from 'react-dom';
import Wrapper from './game/wrapper';
import Signup from "./setup/signup";
import Api from "./api/api";
import {LoadingScreen, LogoutScreen} from "./splash";
import RoomSetup from "./setup/rooms";
import Socket from "./api/socket";
import {Room, RoomState} from "./api/struct/room";
import {UserState} from "./api/struct/user";
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
  static JOINING_ROOM = 3;
  static JOINING_ROOM_COMPLETE = 4;
  static JOINED_ROOM = 5;
}

const LOADING_DELAY = 1000;

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
    room: null,
    clientRoomId: 0
  };

  gameWrapper = React.createRef();

  loadingUpdate = () => {
    if (this.state.user && this.state.stage === Stage.LOADING) {
      let stage = Stage.LOADED;
      if (this.state.user.name) stage = this.state.room ? Stage.JOINED_ROOM : Stage.SIGNED_UP;

      this.setState({stage: stage});
    } else if (this.state.room && this.state.stage === Stage.JOINING_ROOM_COMPLETE && this.state.canRender) {
      this.setState({stage: Stage.JOINED_ROOM});
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

  setRoomForcefully = (room, user = null) => {
    let clientRoomId = this.state.clientRoomId;
    room.clientId = clientRoomId;
    this.gameWrapper.current.setRoom(room);
    this.setState({
      room: room,
      user: user ? user : this.state.user,
      clientRoomId: clientRoomId + 1
    });
  };

  setRoom = (room) => {
    if (this.state.user.name && room && room.id && this.state.stage === Stage.SIGNED_UP) {
      this.setRoomForcefully(room);
    }
  };

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

  joinRoom = (id, token) => {
    this.setState({
      stage: Stage.JOINING_ROOM,
      canRender: false
    });
    setTimeout(function () {
      this.setState({
        stage: Stage.JOINING_ROOM_COMPLETE,
        canRender: true
      });
    }.bind(this), LOADING_DELAY);
    this.state.socket.joinRoom(id, token).then((room) => {
      console.info(`Joined room #${id}:`, room);
      this.setRoomForcefully(room);
    }).catch((error) => {
      console.info(`Failed to join room #${id}:`, error.message);
      Room.resetLink();
    })
  };

  onLogin = (data) => {
    console.info("Socket Init:", data);
    let user = data.user;

    let roomId = getURLParam("room");
    let token = getURLParam("token");

    if (roomId) {
      this.state.socket.joinRoom(roomId, token).then((room) => {
        console.info(`Joined room #${roomId}:`, room);
        this.setRoomForcefully(room, user);
      }).catch((error) => {
        console.info(`Failed to join room #${roomId}:`, error.message);
        Room.resetLink();

        this.setState({user: user});
      });
    } else this.setState({user: user});
  };

  onForcedLogout = () => {
    this.state.socket.emit("forcedLogout");

    let user = this.state.user;
    if (!user || user.loggedOut) return;

    user.loggedOut = true;

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

    console.info(`User #${user.id} joined the room:`, data);
    room.users[user.id] = user;

    this.setState({room: room});
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
    let userState = data.state;

    if (userName || userIcon || data.state) {
      if (userName) user.name = userName;
      if (userIcon) user.icon = userIcon;
      if (userState) user.state = userState;

      console.info(`Updated user #${userId}:`, user);
      this.setState({room: room});
    }
  };

  onUserStateChanged = (data) => {
    if (!data.state) return console.warn("Received user state update with missing state:", data);

    let room = this.state.room;
    if (!room) return console.warn(`Received user state update when not in a room:`, this.state);

    let userId = data.id;
    if (!room.users.hasOwnProperty(userId)) {
      return console.warn(`Received state update for unknown user #${userId}:`, data, room.users)
    }

    room.users[userId].state = data.state;
    this.setState({room: room});
  };

  onRoundStarted = (data) => {
    let room = this.state.room;
    if (!room) return console.warn(`Received new round data when not in a room:`, this.state);

    room.state = RoomState.PICKING_QUESTION;

    room.forEachUser((user) => {
      user.state = (user.id === data.chosenUserId) ? UserState.SELECTING_QUESTION : UserState.IDLE;
    });

    this.setState({room: room});
  }

  onAdditionalUpdate = (event, data) => {
    switch (event) {
      case "userStateChanged":
        return this.onUserStateChanged(data);
      case "startRound":
        return this.onRoundStarted(data);
      default:
        return console.warn("Received unrecognised socket event", event, data);
    }
  };

  onUserLeft = (data) => {
    let room = this.state.room;
    if (!room) return console.warn(`Received user update when not in a room:`, this.state);

    let userId = data.id;
    if (!room.users.hasOwnProperty(userId)) {
      return console.warn(`Received leave notification for unknown user #${userId}:`, data, room.users)
    }

    let user = room.users[userId];

    user.active = false;
    user.state = UserState.IDLE;

    console.info(`User #${userId} left:`, data);

    this.setState({room: room});
  };

  onQuestionSelected = (data) => {
    let room = this.state.room;
    if (!room) return console.warn(`Received question selection when not in a room:`, this.state);

    room.state = RoomState.COLLECTING_ANSWERS;

    room.forEachUser((user) => {
      if (user.id === data.selectedBy) user.state = UserState.ASKING_QUESTION;
      else user.state = UserState.ANSWERING_QUESTION;
    });

    this.setState({room: room});
  };

  startReadingAnswers = () => {
    let room = this.state.room;
    if (!room) return console.warn(`Received room state when not in a room:`, this.state);

    room.state = RoomState.READING_ANSWERS;

    room.forEachUser((user) => {
      if (user.state === UserState.ASKING_QUESTION) user.state = UserState.READING_ANSWERS;
      else user.state = UserState.IDLE;
    });

    this.setState({room: room});
  };

  componentDidMount() {
    setTimeout(function () {
      this.setState({canRender: true});
    }.bind(this), LOADING_DELAY);
    Api.getUser().then((user) => {
      console.info("User:", user);

      let socket = new Socket(user, this.onAdditionalUpdate);

      socket.on("init", this.onLogin);
      socket.on("forceLogout", this.onForcedLogout);

      socket.on("userJoined", this.onUserJoined);
      socket.on("userUpdated", this.onUserUpdated);
      socket.on("userLeft", this.onUserLeft);
      socket.on("userStateChanged", this.onUserStateChanged);

      socket.on("questionSelected", this.onQuestionSelected);
      socket.on("startReadingAnswers", this.startReadingAnswers);

      this.gameWrapper.current.initSocketEvents(socket);
      this.setState({socket: socket});
    }).catch((error) => {
      console.warn("Failed to get user:", error.message);
    });
  }

  leaveRoom = () => {
    if (!this.state.room) return console.warn("Tried to leave room when not in a room!", this.state);
    this.state.socket.leaveRoom().then((success) => {
      if (!success) return console.warn("Failed to leave current room");
      console.info("Left active room");
      Room.resetLink();
      this.setState({
        stage: Stage.SIGNED_UP,
        room: undefined
      });
    }).catch((error) => {
      console.warn("Failed to leave current room:", error.message);
    });
  };

  render() {
    let canRender = this.state.canRender && this.state.user;
    let stage = this.state.stage;
    let loggedOut = canRender && this.state.user && this.state.user.loggedOut;

    return (
      <div id="app-wrapper">
        {stage < Stage.JOINED_ROOM &&
        <WrapperContainer visible={!canRender || (!this.state.user || stage === Stage.JOINING_ROOM)} onTransitionEnd={this.loadingUpdate}>
          <LoadingScreen/>
        </WrapperContainer>
        }
        {stage < Stage.SIGNED_UP &&
        <WrapperContainer visible={canRender && !loggedOut && !this.state.user.name}
                          onTransitionEnd={this.signupUpdate}>
          <Signup user={this.state.user} onComplete={this.finishSignup}/>
        </WrapperContainer>
        }
        {stage < Stage.JOINED_ROOM &&
        <WrapperContainer
          visible={canRender && stage < Stage.JOINING_ROOM && !loggedOut && this.state.user.name && (!this.state.room || !this.state.room.finishedCreation)}>
          <RoomSetup
            socket={this.state.socket}
            user={this.state.user}
            onRoomCreated={this.setRoom}
            onComplete={this.startGame}
            joinRoom={this.joinRoom}
          />
        </WrapperContainer>
        }
        <WrapperContainer
          visible={canRender && !loggedOut && this.state.user.name && this.state.room && this.state.room.finishedCreation}>
          <Wrapper socket={this.state.socket} user={this.state.user} room={this.state.room} leaveRoom={this.leaveRoom} ref={this.gameWrapper} />
        </WrapperContainer>
        <WrapperContainer visible={loggedOut}>
          <LogoutScreen/>
        </WrapperContainer>
      </div>
    );
  }
}

ReactDOM.render(
  <React.StrictMode>
    <QuestionsGame/>
  </React.StrictMode>,
  document.getElementById('root')
);
