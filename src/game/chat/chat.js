import React from "react";
import TextareaAutosize from 'react-textarea-autosize';
import ScrollableFeed from "react-scrollable-feed";
import Icon from "../../setup/icon";
import "../panel.scss";
import "./chat.scss";

function MessageAction(props) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div className={"message-action" + (hovered ? " hovered" : "")}>
      <div className="message-action-title-container">
        <div className="message-action-title">{props.title}</div>
      </div>
      <div
        className="message-action-icon-container"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="message-action-icon">
          <i className={"fas fa-" + props.icon} />
        </div>
      </div>
    </div>
  );
}

class Message extends React.Component {
  constructor(props) {
    super(props);

    let today = this.props.today;
    let createdAt = new Date(this.props.message.created_at * 1000);

    if (today.year === createdAt.getFullYear() && today.month === createdAt.getMonth()) {
      let msgDate = createdAt.getDate()
      if (today.date === msgDate || today.date - 1 === msgDate) {
        let prefix = (today.date === msgDate) ? "Today" : "Yesterday";
        this.timeString = prefix + " at " + createdAt.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true
        });
      }
    }

    if (!this.timeString) this.timeString = createdAt.toLocaleDateString();
  }

  render = () => {
    let message = this.props.message;
    let user = this.props.user;

    return (
      <div className={"scrollable-item chat-message " + (message.isSystemMsg ? "system-msg" : "user-msg")}>
        <div className="message-container">
          <Icon icon={user.icon} className="message-icon" />
          <div className="message-info">
            <div className="message-title">
              <div className="message-user">{user.name}</div>
              <div className="message-time">{this.timeString}</div>
            </div>
            <div className="message-content">{message.body}</div>
          </div>
        </div>
        {!message.isSystemMsg &&
          <div className="message-actions-container">
            <div className="message-actions">
              <MessageAction icon="heart" title="Like" />
              {this.props.postedBySelf && <MessageAction icon="pencil" title="Edit" />}
              <MessageAction icon="ellipsis-h" title="More" />
            </div>
          </div>
        }
      </div>
    );
  }
}

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
    let ownUserId = this.props.user.id;

    let date = new Date();
    let today = {
      year: date.getFullYear(),
      month: date.getMonth(),
      date: date.getDate()
    };

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

              let postedBySelf = user.id === ownUserId;

              return <Message key={key} message={message} user={user} today={today} postedBySelf={postedBySelf} />;
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