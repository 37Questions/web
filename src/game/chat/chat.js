import React from "react";
import TextareaAutosize from 'react-textarea-autosize';
import ScrollableFeed from "react-scrollable-feed";
import Icon from "../../setup/icon";
import "../panel.scss";
import "./chat.scss";

class Chat extends React.Component {
  chatEndRef = React.createRef();

  onInput = (e) => {
    // Enter key is pressed
    if (e.keyCode === 13) {
      e.preventDefault();
      let body = e.target.value;
      if (body.length < 1) return;

      this.props.socket.sendMessage(body).then((message) => {
        this.props.room.addMessage(message);
        this.setState({});
        this.chatEndRef.current.scrollIntoView();
      }).catch((error) => {
        console.warn(`Failed to send message:`, error);
      })
      e.target.value = "";
    }
  }

  render() {
    if (!this.props.room) return null;
    let users = this.props.room.users;
    let messages = this.props.room.messages;

    let today = new Date();

    let year = today.getFullYear();
    let month = today.getMonth();
    let date = today.getDate();

    return (
      <div className="panel-wrapper" id="chat-wrapper">
        <div className="panel-header" id="chat-header">
          <h1>Chat</h1>
        </div>
        <ScrollableFeed className="panel-scrollable chat-history">
          {
            Object.keys(messages).map((messageId, key) => {
              let message = messages[messageId];

              if (!users.hasOwnProperty(message.user_id)) return null;
              let user = users[message.user_id];


              let createdAt = new Date(message.created_at);
              let timeString;

              if (year === createdAt.getFullYear() && month === createdAt.getMonth()) {
                let msgDate = createdAt.getDate()
                if (date === msgDate || date - 1 === msgDate) {
                  let prefix = (date === msgDate) ? "Today" : "Yesterday";
                  timeString = prefix + " at " + createdAt.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "numeric",
                    hour12: true
                  });
                }
              }

              if (!timeString) timeString = createdAt.toLocaleDateString();

              return (
                <div className={"scrollable-item chat-message " + (message.isSystemMsg ? "system-msg" : "user-msg")} key={key}>
                  <Icon icon={user.icon} className="message-icon" />
                  <div className="message-info">
                    <div className="message-title">
                      <div className="message-user">{user.name}</div>
                      <div className="message-time">{timeString}</div>
                    </div>
                    <div className="message-content">{message.body}</div>
                  </div>
                </div>
              );
            })
          }
          <div ref={this.chatEndRef} />
        </ScrollableFeed>
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