import React from 'react';
import "./rooms.scss";
import SetupFooter from "./footer";

class RoomSetup extends React.Component {
  render() {
    return (
      <div className="setup-wrapper">
        <div className="outer-setup-container">
          <div id="room-setup" className="inner-setup-container">
            <h1>37 Questions</h1>
            <p>Join or create a room to start playing.</p>
            <div id="join-or-create-btns">
              <div className="setup-button">Create Room </div>
              <div className="setup-button">Join Room</div>
            </div>
            <SetupFooter />
          </div>
        </div>
      </div>
    );
  }
}

export default RoomSetup;