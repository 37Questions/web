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
        onClick={props.onClick}
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

  editingInput = React.createRef();

  saveEdit = () => {
    let input = this.editingInput.current;
    if (!input) return console.warn("Tried to save edit but the input ref was null!");

    let body = input.value;
    if (body.length < 1) return;

    this.props.saveEdit(body);
  }

  onInput = (e) => {
    if (e.keyCode === 13) {
      // Enter key was pressed
      e.preventDefault();
      this.saveEdit();
    } else if (e.keyCode === 27) {
      // Escape key was pressed
      e.preventDefault();
      this.props.setEditing(false);
    }
  }

  startEditing = () => {
    this.props.setEditing(true, () => {
      let input = this.editingInput.current;
      if (!input) return console.warn("Failed to focus textarea when starting editing");

      input.focus();
      input.selectionStart = input.selectionEnd = input.value.length;
    });
  }

  render = () => {
    let message = this.props.message;
    let user = this.props.user;
    let editing = this.props.currentlyEditing;

    let messageContent = <div className="message-content">{message.body}</div>;

    if (editing) {
      messageContent = (
        <div className="editable-message-content">
          <TextareaAutosize
            className="text-input edit-message-input"
            maxLength={200}
            onKeyDown={this.onInput}
            defaultValue={message.body}
            async={true}
            ref={this.editingInput}
          />
          <div className="edit-message-footer">
            <div className="text-container">
              escape to <span className="link" onClick={() => this.props.setEditing(false)}>cancel</span>
            </div>
            <div className="divider-icon"><i className="fas fa-circle" /></div>
            <div className="text-container">
              enter to <span className="link" onClick={this.saveEdit}>save</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={"scrollable-item chat-message " + (message.isSystemMsg ? "system-msg" : "user-msg")}>
        <div className="message-container">
          <Icon icon={user.icon} className="message-icon" />
          <div className="message-info">
            <div className="message-title">
              <div className="message-user">{user.name}</div>
              <div className="message-time">{this.timeString}</div>
            </div>
            {messageContent}
          </div>
        </div>
        {!editing && !message.isSystemMsg &&
          <div className="message-actions-container">
            <div className="message-actions">
              <MessageAction icon="heart" title="Like" />
              {this.props.postedBySelf &&
                <MessageAction icon="pencil" title="Edit" onClick={this.startEditing} />
              }
              <MessageAction icon="ellipsis-h" title="More" />
            </div>
          </div>
        }
      </div>
    );
  };
}

class Chat extends React.Component {
  state = {
    editingMessageId: null
  };

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

  setEditingMessage = (message, editing, fn) => {
    if (message.user_id === this.props.user.id) {
      this.setState({
        editingMessageId: editing ? message.id : null
      }, fn);
    }
  };

  editMessage = (message, body) => {
    if (!this.state.editingMessageId || this.state.editingMessageId !== message.id) {
      console.warn(`Tried to edit message ${message.id} when in invalid state:`, this.state);
    }

    let oldBody = message.body;

    let room = this.props.room;

    message.body = body;
    room.messages[message.id] = message;

    this.setState({
      editingMessageId: null,
      room: room
    });

    this.props.socket.editMessage(message.id, body).then((newMessage) => {
      if (newMessage.id !== message.id) throw new Error("ID Mismatch");
      if (newMessage.user_id !== message.user_id) throw new Error("User Mismatch");
      if (newMessage.room_id !== message.room_id) throw new Error("Room Mismatch");
      if (!!newMessage.isSystemMsg !== !!message.isSystemMsg) throw new Error("Message Type Mismatch");

      if (newMessage.body !== message.body) {
        let room = this.props.room;
        room.messages[newMessage.id] = newMessage;

        this.setState({room: room});
      }
    }).catch((error) => {
      console.warn(`Failed to edit message #${message.id}:`, error.message);

      let room = this.props.room;
      room.messages[message.id].body = oldBody;

      this.setState({room: room});
    })
  };

  render = () => {
    if (!this.props.room) return null;

    let users = this.props.room.users;
    let messages = this.props.room.messages;

    let ownUserId = this.props.user.id;
    let editingMessageId = this.state.editingMessageId;

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
              let currentlyEditing = editingMessageId === message.id;

              return (
                <Message
                  key={key}
                  message={message}
                  user={user}
                  today={today}
                  postedBySelf={postedBySelf}
                  currentlyEditing={currentlyEditing}
                  setEditing={(editing, fn) => this.setEditingMessage(message, editing, fn)}
                  saveEdit={(body) => this.editMessage(message, body)}
                />
              );
            })
          }
          <div ref={this.chatEndRef} />
        </ScrollableFeed>
        <div id="chat-input-container">
          <TextareaAutosize
            id="chat-input"
            className="text-input"
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