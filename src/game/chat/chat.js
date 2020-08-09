import * as React from "react";
import "../panel.scss";
import "./chat.scss";

class Chat extends React.Component {
  render() {
    return (
      <div className="panel-wrapper" id="chat-wrapper">
        <div className="panel-header">
          <h1>Chat</h1>
        </div>
        <div className="panel-content">

        </div>
      </div>
    );
  }
}

export default Chat;