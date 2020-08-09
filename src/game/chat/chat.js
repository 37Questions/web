import React from "react";
import TextareaAutosize from 'react-textarea-autosize';
import "../panel.scss";
import "./chat.scss";
import Icon from "../../setup/icon";

class Chat extends React.Component {
  onInput = (e) => {
    // Enter key is pressed
    if (e.keyCode === 13) {
      e.preventDefault();
    }
  }

  render() {
    if (!this.props.room) return null;
    let users = this.props.room.users;
    let messages = this.props.room.messages;

    return (
      <div className="panel-wrapper" id="chat-wrapper">
        <div className="panel-header" id="chat-header">
          <h1>Chat</h1>
        </div>
        <div className="panel-scrollable" id="chat-history">
          {
            Object.keys(messages).map((messageId, key) => {
              let message = messages[messageId];

              if (!users.hasOwnProperty(message.user_id)) return null;
              let user = users[message.user_id];

              let date = new Date(message.created_at);
              let time = "Today at " + date.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "numeric",
                hour12: true
              });

              return (
                <div className={"scrollable-item chat-message " + (message.isSystemMsg ? "system-msg" : "user-msg")} key={key}>
                  <Icon icon={user.icon} className="message-icon" />
                  <div className="message-info">
                    <div className="message-title">
                      <div className="message-user">{user.name}</div>
                      <div className="message-time">{time}</div>
                    </div>
                    <div className="message-content">{message.body}</div>
                  </div>
                </div>
              );
            })
          }
        </div>
        <div id="chat-input-container">
          <TextareaAutosize
            id="chat-input"
            placeholder="Type a message..."
            maxLength={200}
            onKeyDown={this.onInput}
          />
        </div>
      </div>
    );
  }
}

export default Chat;