import React, {useState} from 'react';
import "./rooms.scss";
import SetupFooter from "./footer";

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

class RoomSetup extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      mode: SELECT_OPTION
    }

    this.setMode = this.setMode.bind(this);
  }

  setMode(mode) {
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
        <RoomSetupWrapper>
          <h1>Create Room</h1>
          <h2>Here you can configure the game to your liking.</h2>
          <br />
          <p>Room Visibility</p>
          <div className="room-option">
            <input type="checkbox" className="room-option-checkbox" />
            <p className="room-option-label">Public Room</p>
          </div>
          <div className="buttons-list">
            <div className="setup-button">Create Room</div>
            <div className="setup-button" onClick={() => this.setMode(SELECT_OPTION)}>Back</div>
          </div>
        </RoomSetupWrapper>
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