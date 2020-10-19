import React, {createRef} from 'react';
import Select from 'react-select';
import SetupFooter from "./footer";
import {LoadingSpinner} from "../splash";
import Api from "../api/api";
import "./rooms.scss";
import {Button} from "../ui/button";

const SELECT_OPTION = 0;
const CREATE_ROOM = 1;
const JOIN_ROOM = 2;

function RoomSetupWrapper(props) {
  return (
    <div className="setup-wrapper">
      <div className="outer-setup-container">
        <div id="room-setup" className="inner-setup-container">
          {props.children}
          <SetupFooter />
        </div>
      </div>
    </div>
  );
}

const votingMethods = [
  { value: "winner", label: "Winner Votes", desc: "Winner Votes" },
  { value: "rotate", label: "Rotational", desc: "Rotational Voting" }
  // TODO: democratic voting
  // { value: "democratic", label: "Democratic", desc: "Democratic Voting" }
];

const visibilityOptions = [
  { value: "private", label: "Private" },
  { value: "public", label: "Public" }
];

class RoomCreationStage {
  static CONFIGURING = 0;
  static LOADING = 1;
  static CREATED = 2;
}

class RoomCreationMenu extends React.Component {
  state = {
    stage: RoomCreationStage.CONFIGURING,
    votingMethod: votingMethods[0],
    visibility: visibilityOptions[0],
    warning: null,
    room: null
  };

  fallbackRoomName = this.props.user ? (this.props.user.name + "'s Room") : undefined;

  getWarning = (votingMethod, visibility) => {
    // TODO: democratic voting
    /*if (votingMethod.value !== "democratic" && visibility.value === "public") {
      return {
        message: "Democratic voting is strongly recommended in public rooms!",
        for: "votingMethod"
      };
    } else */return null;
  }

  onNameInput = (e) => {
    // Enter key was pressed
    if (e.keyCode === 13) {
      e.preventDefault();
      this.createRoom();
    }
  };

  changeVotingMethod = (method) => {
    if (method === this.state.votingMethod) return;
    this.setState({
      votingMethod: method,
      warning: this.getWarning(method, this.state.visibility)
    });
  };

  changeVisibility = (visibility) => {
    if (visibility === this.state.visibility) return;
    this.setState({
      visibility: visibility,
      warning: this.getWarning(this.state.votingMethod, visibility)
    });
  };

  createRoom = () => {
    if (this.state.stage > RoomCreationStage.CONFIGURING) return;

    let name = this.roomName.current.value || this.fallbackRoomName;
    let votingMethod = this.state.votingMethod.value;
    let visibility = this.state.visibility.value;

    console.info("Creating Room with Name:", name, "Voting method:", votingMethod, "Visibility:", visibility);
    this.setState({
      stage: RoomCreationStage.LOADING
    });

    this.props.socket.createRoom(name, visibility, votingMethod).then((room) => {
      console.info("Created Room:", room);
      this.props.onRoomCreated(room);
      this.setState({
        stage: RoomCreationStage.CREATED,
        room: room
      });
    }).catch((error) => {
      this.setState({
        stage: RoomCreationStage.CONFIGURING,
        warning: {
          message: "Room Creation Failed: " + error.message
        }
      });
    });
  };

  roomName = createRef();
  roomLink = createRef();

  copyRoomLink = (e) => {
    if (!this.roomLink.current) return;

    this.roomLink.current.select();
    document.execCommand("copy");

    e.target.focus();
  };

  onComplete = () => {
    if (!this.state.room) return;
    this.props.onComplete();
  };

  render () {
    let stage = this.state.stage;
    if (stage === RoomCreationStage.CONFIGURING) {
      return (
        <RoomSetupWrapper>
          <h1>Room Setup</h1>
          <h2>Personalize and configure your room</h2>
          <p>Give your room a friendly name</p>
          <div id="room-input-container">
            <input
              type="text"
              id="room-name-input"
              className="setup-input"
              autoComplete="off"
              spellCheck="false"
              ref={this.roomName}
              onKeyDown={this.onNameInput}
              placeholder={(this.props.user ? this.fallbackRoomName : "Room Name...")}
              maxLength={32}
            />
          </div>
          <p>Customize your game</p>
          <div className="room-option">
            <p className="room-option-label">Privacy</p>
            <div className="room-option-dropdown">
              <Select
                className="dropdown-container"
                classNamePrefix="dropdown"
                value={this.state.visibility}
                onChange={this.changeVisibility}
                options={visibilityOptions}
              />
            </div>
          </div>
          <div className={"room-option" + (this.state.warning && this.state.warning.for === "votingMethod" ? " with-error" : "")}>
            <p className="room-option-label">Voting Method</p>
            <div className="room-option-dropdown">
              <Select
                className="dropdown-container"
                classNamePrefix="dropdown"
                value={this.state.votingMethod}
                onChange={this.changeVotingMethod}
                options={votingMethods}
              />
            </div>
          </div>
          {this.state.warning && <div className={"setup-warning"}>{this.state.warning.message}</div>}
          <div className="buttons-list">
            <Button className="setup-button" onClick={this.createRoom}>
              Create Room
            </Button>
            <Button className="setup-button" onClick={(e) => this.props.changeMode(e, SELECT_OPTION)}>
              Back
            </Button>
          </div>
        </RoomSetupWrapper>
      );
    }
    if (stage === RoomCreationStage.LOADING) {
      return (
        <RoomSetupWrapper>
          <h1>Creating Room</h1>
          <h2>This may take a few seconds.</h2>
          <br />
          <LoadingSpinner />
          <br />
        </RoomSetupWrapper>
      );
    } else if (stage === RoomCreationStage.CREATED) {
      return (
        <RoomSetupWrapper>
          <h1>Created Room!</h1>
          <h2>To invite friends, send them the link below.</h2>
          <br />
          <div className="room-link-container">
            <div className="room-link-icon-container" onClick={this.copyRoomLink}>
              <div className="room-link-icon">
                <i className="far fa-link" />
              </div>
            </div>
            <textarea
              className="room-link-textarea"
              ref={this.roomLink}
              readOnly={true}
              value={this.state.room.link}
              aria-hidden={true}
            />
            <div className="room-link-text">
              {this.state.room.link}
            </div>
          </div>
          <Button className="setup-button" onClick={this.onComplete}>
            Start Game
          </Button>
        </RoomSetupWrapper>
      )
    }
  }
}

class RoomCard extends React.Component {
  constructor(props) {
    super(props);

    let room = props.room;

    this.votingString = room.votingMethod[0].toUpperCase() + room.votingMethod.slice(1) + " Voting";

    for (let i = 0; i < votingMethods.length; i++) {
      let method = votingMethods[i];
      if (method.value === room.votingMethod) {
        this.votingString = method.desc;
        break;
      }
    }

    const sinceActive = (new Date().getTime() / 1000) - room.lastActive;
    this.timeString = "Now";

    if (sinceActive > 60 * 60 * 24) {
      const days = Math.round(sinceActive / 60 / 60 / 24);
      if (days < 2) this.timeString = "1 day ago";
      else this.timeString = `${days} days ago`;
    } else if (sinceActive > 60 * 60) {
      const hrs = Math.round(sinceActive / 60 / 60);
      if (hrs < 2) this.timeString = "1 hour ago";
      else this.timeString = `${hrs} hrs ago`;
    } else if (sinceActive > 60) {
      const mins = Math.round(sinceActive / 60);
      if (mins < 2) this.timeString = "1 min ago";
      else this.timeString = `${mins} mins ago`;
    } else if (sinceActive > 30) {
      this.timeString = `${Math.round(sinceActive)} secs ago`;
    }
  }
  render() {
    let room = this.props.room;

    return (
      <div className="room-card">
        <div className="room-header">{room.name}</div>
        <div className="room-info">
          <p><b>Active {this.timeString}</b></p>
          <p>{room.players} Players ({room.activePlayers} Active)</p>
          <p>{this.votingString}</p>
        </div>
        <Button className="setup-button join-room-button" onClick={() => this.props.joinRoom(room.id, room.token)}>
          Join
        </Button>
      </div>
    );
  }
}

class RoomJoinMenu extends React.Component {
  state = {
    rooms: null
  };

  componentDidMount = () => {
    Api.getRooms().then((rooms) => {
      this.setState({
        rooms: rooms
      });
    })
  };

  render = () => {
    let roomList = (
      <div className="rooms-list-loading">
        <LoadingSpinner />
      </div>
    );

    if (this.state.rooms) {
      if (this.state.rooms.length < 1) {
        roomList = (
          <p>
            There are currently no rooms available to join!<br />
            Try <span className="link" onClick={(e) => this.props.changeMode(e, CREATE_ROOM)}>creating a room</span>.
          </p>
        )
      } else {
        roomList = (
          <div className="rooms-list-container">
            <div className="rooms-list">
              {
                this.state.rooms.map((room) => <RoomCard room={room} joinRoom={this.props.joinRoom} key={room.id} />)
              }
            </div>
          </div>
        );
      }
    }

    return (
      <RoomSetupWrapper>
        <h1>Join Room</h1>
        <h2>If you're trying to play with a friend, ask them for the link to their room.</h2>
        <br />
        {roomList}
        <Button className="setup-button" onClick={(e) => this.props.changeMode(e, SELECT_OPTION)}>
          Back
        </Button>
      </RoomSetupWrapper>
    );
  };
}

class RoomSetup extends React.Component {
  state = {
    mode: SELECT_OPTION
  };

  setMode = (e, mode) => {
    e.stopPropagation();
    if (mode !== this.state.mode && mode >= SELECT_OPTION && mode <= JOIN_ROOM) {
      this.setState({
        mode: mode
      });
    }
  };

  render = () => {
    let mode = this.state.mode;
    if (mode === SELECT_OPTION) {
      return (
        <RoomSetupWrapper>
          <h1>37 Questions</h1>
          <h2>Join or create a room to start playing.</h2>
          <div className="buttons-list">
            <Button className="setup-button" onClick={(e) => this.setMode(e, CREATE_ROOM)}>
              Create Room
            </Button>
            <Button className="setup-button" onClick={(e) => this.setMode(e, JOIN_ROOM)}>
              Join Room
            </Button>
          </div>
        </RoomSetupWrapper>
      );
    } else if (mode === CREATE_ROOM) {
      return (
        <RoomCreationMenu
          socket={this.props.socket}
          user={this.props.user}
          changeMode={this.setMode}
          onRoomCreated={this.props.onRoomCreated}
          onComplete={this.props.onComplete}
        />
      );
    } else if (mode === JOIN_ROOM) {
      return (
        <RoomJoinMenu
          changeMode={this.setMode}
          joinRoom={this.props.joinRoom}
        />
      );
    }
  }
}

export default RoomSetup;