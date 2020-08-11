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
          <i className={"fa" + (props.type || "s") + " fa-" + props.icon} />
        </div>
      </div>
    </div>
  );
}

class Message extends React.Component {
  constructor(props) {
    super(props);

    let createdAt = new Date(this.props.message.created_at * 1000);

    let today = this.props.today;

    if (today.year === createdAt.getFullYear() && today.month === createdAt.getMonth()) {
      let msgDate = createdAt.getDate()
      if (today.date === msgDate || today.date - 1 === msgDate) {
        this.timeString = createdAt.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true
        });

        if (!this.props.message.isChained) {
          let prefix = (today.date === msgDate) ? "" : " Yesterday";
          this.timeString = this.timeString + prefix;
        }
      }
    }

    if (!this.timeString) {
      this.timeString = createdAt.toLocaleDateString("en-US", {
        year: this.props.message.isChained ? "2-digit" : "numeric",
        month: "numeric",
        day: "numeric"
      });
    }
  }

  editingInput = React.createRef();

  state = {
    hovered: false
  };

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

  setHovered = (hovered) => {
    if (this.state.hovered === hovered) return;
    this.setState({hovered: hovered});
  }

  toggleLiked = () => {
    if (this.props.likedBySelf) this.props.removeLike();
    else this.props.addLike();
  }

  render = () => {
    let message = this.props.message;
    let users = this.props.users;
    let user = users[this.props.userId];

    let editing = this.props.currentlyEditing;
    let hovered = this.state.hovered;

    let likedBySelf = this.props.likedBySelf;
    let postedBySelf = this.props.postedBySelf;

    let messageIcon = <Icon icon={user.icon} className="message-icon" />;
    let messageContent = <div className="message-content">{message.body}</div>;

    let messageClass = "scrollable-item chat-message " + (message.isSystemMsg ? "system-msg" : "user-msg");
    if (hovered) messageClass += " hovered";

    let messageTitle = (
      <div className="message-title">
        <div className="message-user">{user.name}</div>
        <div className="message-time">{this.timeString}</div>
      </div>
    );

    if (message.isChained) {
      messageIcon = (
        <div className="chained-msg-time-container">
          {hovered &&
            <div className="chained-msg-time">
              {this.timeString}
            </div>
          }
        </div>
      );
      messageTitle = null;
      messageClass += " chained-msg";
    }

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

    let likeKeys = Object.keys(message.likes);

    return (
      <div
        className={messageClass}
        onMouseEnter={() => this.setHovered(true)}
        onMouseLeave={() => this.setHovered(false)}
      >
        <div className="message-container">
          {messageIcon}
          <div className="message-info">
            {messageTitle}
            {messageContent}
          </div>
        </div>
        {hovered && !message.isSystemMsg && !editing &&
          <div className="message-actions-container">
            <div className="message-actions">
              {!likedBySelf && <MessageAction icon="heart" title="Like" onClick={this.props.addLike} />}
              {likedBySelf && <MessageAction icon="heart" type="r" title="Unlike" onClick={this.props.removeLike} />}
              {postedBySelf && <MessageAction icon="pencil" title="Edit" onClick={this.startEditing} />}
              {postedBySelf && <MessageAction icon="trash" title="Delete" onClick={this.props.deleteSelf} />}
              {!postedBySelf && <MessageAction icon="exclamation-triangle" title="Report" />}
            </div>
          </div>
        }
        {likeKeys.length > 0 &&
          <div className="message-likes-container">
            <div className="message-likes">
              <div className="heart-icon-container">
                <div
                  className={"heart-icon" + (likedBySelf ? " filled" : "")}
                  onClick={this.toggleLiked}
                  title={(likedBySelf ? "Unlike Message" : "Like Message")}
                >
                  <i className="fas fa-heart" />
                </div>
              </div>
              {
                likeKeys.map((userId) => {
                  let likeUser = users[userId];

                  return (
                    <div className="like-container" key={userId} title={"Liked by " + likeUser.name}>
                      <Icon className="like" icon={likeUser.icon} />
                    </div>
                  );
                })
              }
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
        console.warn(`Failed to send message:`, error.message);
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
    });
  };

  likeMessage = (message) => {
    let userId = this.props.user.id;
    let messageId = message.id;

    let curLiked = message.likes.hasOwnProperty(userId);
    if (curLiked) return console.warn(`Tried to like message which was already liked:`, message);

    message.likes[this.props.user.id] = {
      user_id: userId,
      since: Math.floor(new Date().getTime() / 1000)
    };

    this.setState({});

    this.props.socket.likeMessage(messageId).then((like) => {
      console.info(`Liked message #${messageId}:`, like);
    }).catch((error) => {
      console.warn(`Failed to like message #${messageId}:`, error.message);
      let message = this.props.room.messages[messageId];
      delete message.likes[userId];
      this.setState({})
    })
  };

  unlikeMessage = (message) => {
    let userId = this.props.user.id;
    let messageId = message.id;

    let existingLike = message.likes[userId];
    if (!existingLike) return console.warn(`Tried to unlike message that wasn't already liked:`, message);

    delete message.likes[userId];
    this.setState({});

    console.info(`Deleted like from message #${messageId}:`, existingLike);

    this.props.socket.unlikeMessage(messageId).then((success) => {
      console.info(`Unliked message #${messageId}:`, success);
    }).catch((error) => {
      console.warn(`Failed to unlike message #${messageId}:`, error.message);
      let message = this.props.room.messages[messageId];
      message.likes[userId] = existingLike;
      this.setState({})
    });
  }

  deleteMessage = (message) => {
    let userId = this.props.user.id;
    if (message.user_id !== userId) return console.warn(`Tried to delete message posted by other user:`, message);

    delete this.props.room.messages[message.id];
    this.setState({});

    this.props.socket.deleteMessage(message.id).then((unchainMessageId) => {
      console.info(`Deleted message #${message.id}:`, message);
      if (unchainMessageId) {
        let messages = this.props.room.messages;
        if (!messages.hasOwnProperty(unchainMessageId)) {
          return console.warn(`Tried to unchain unknown message #${unchainMessageId}:`, this.props.room);
        }
        messages[unchainMessageId].isChained = false;
        this.setState({});
      }
    }).catch((error) => {
      console.warn(`Failed to delete message #${message.id}:`, error.message);
      this.props.room.messages[message.id] = message;
      this.setState({});
    })
  }

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
            Object.keys(messages).map((messageId) => {
              let message = messages[messageId];

              let userId = message.user_id;
              if (!users.hasOwnProperty(userId)) return null;

              let postedBySelf = userId === ownUserId;
              let likedBySelf = message.likes.hasOwnProperty(ownUserId);

              let currentlyEditing = editingMessageId === message.id;

              return (
                <Message
                  key={message.id}
                  message={message}
                  userId={message.user_id}
                  users={users}
                  today={today}
                  postedBySelf={postedBySelf}
                  likedBySelf={likedBySelf}
                  currentlyEditing={currentlyEditing}
                  setEditing={(editing, fn) => this.setEditingMessage(message, editing, fn)}
                  saveEdit={(body) => this.editMessage(message, body)}
                  addLike={() => this.likeMessage(message)}
                  removeLike={() => this.unlikeMessage(message)}
                  deleteSelf={() => this.deleteMessage(message)}
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