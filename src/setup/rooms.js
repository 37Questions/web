import React, {createRef} from 'react';
import Select from 'react-select';
import SetupFooter from "./footer";
import {LoadingSpinner} from "../splash";
import "./rooms.scss";

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
  { value: "rotate", label: "Rotate" },
  { value: "democratic", label: "Democratic" }
];

const visibilityOptions = [
  { value: "private", label: "Public" },
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

  getWarning = (votingMethod, visibility) => {
    if (votingMethod.value === "rotate" && visibility.value === "public") {
      return {
        message: "Democratic voting is strongly recommended in public rooms!",
        for: "votingMethod"
      };
    } else return null;
  }

  changeVotingMethod = (method) => {
    if (method === this.state.votingMethod) return;
    this.setState({
      votingMethod: method,
      warning: this.getWarning(method, this.state.visibility)
    });
  }

  changeVisibility = (visibility) => {
    if (visibility === this.state.visibility) return;
    this.setState({
      visibility: visibility,
      warning: this.getWarning(this.state.votingMethod, visibility)
    });
  }

  createRoom = () => {
    if (this.state.stage > RoomCreationStage.CONFIGURING) return;

    let votingMethod = this.state.votingMethod.value;
    let visibility = this.state.visibility.value;

    console.info("Voting method:", votingMethod, "Visibility:", visibility);
    this.setState({
      stage: RoomCreationStage.LOADING
    });

    this.props.socket.createRoom(visibility, votingMethod).then((room) => {
      console.info("Created Room:", room);
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

  roomLink = createRef();

  copyRoomLink = (e) => {
    if (!this.roomLink.current) return;

    this.roomLink.current.select();
    document.execCommand("copy");

    e.target.focus();
  };

  onComplete = () => {
    if (!this.state.room) return;
    this.props.onComplete(this.state.room);
  };

  render () {
    let stage = this.state.stage;
    if (stage === RoomCreationStage.CONFIGURING) {
      return (
        <RoomSetupWrapper>
          <h1>Room Settings</h1>
          <h2>Adjust these settings to fine-tune your game.</h2>
          <br/>
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
            <div className="setup-button" onClick={this.createRoom}>Create Room</div>
            <div className="setup-button" onClick={() => this.props.changeMode(SELECT_OPTION)}>Back</div>
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
            />
            <div className="room-link-text">
              {this.state.room.link}
            </div>
          </div>
          <div className="setup-button" onClick={this.onComplete}>
            Start Game
          </div>
        </RoomSetupWrapper>
      )
    }
  }
}

class RoomSetup extends React.Component {
  state = {
    mode: SELECT_OPTION
  };

  setMode = (mode) => {
    if (mode !== this.state.mode && mode >= SELECT_OPTION && mode <= JOIN_ROOM) {
      this.setState({
        mode: mode
      });
    }
  }

  render() {
    let mode = this.state.mode;
    if (mode === SELECT_OPTION) {
      return (
        <RoomSetupWrapper>
          <h1>37 Questions</h1>
          <h2>Join or create a room to start playing.</h2>
          <div className="buttons-list">
            <div className="setup-button" onClick={() => this.setMode(CREATE_ROOM)}>Create Room </div>
            <div className="setup-button" onClick={() => this.setMode(JOIN_ROOM)}>Join Room</div>
          </div>
        </RoomSetupWrapper>
      );
    } else if (mode === CREATE_ROOM) {
      return (
        <RoomCreationMenu
          socket={this.props.socket}
          user={this.props.user}
          changeMode={this.setMode}
          onComplete={this.props.onComplete}
        />
      );
    } else if (mode === JOIN_ROOM) {
      return (
        <RoomSetupWrapper>
          <h1>Join Room</h1>
          <h2>If you're trying to play with a friend, ask them for the link to their room.</h2>
          <div className="buttons-list">
            <div className="setup-button disabled">Join Room</div>
            <div className="setup-button" onClick={() => this.setMode(SELECT_OPTION)}>Back</div>
          </div>
        </RoomSetupWrapper>
      );
    }
  }
}

export default RoomSetup;