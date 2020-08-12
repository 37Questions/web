import React from "react";
import TextareaAutosize from 'react-textarea-autosize';
import ScrollableFeed from "react-scrollable-feed";
import "../panel.scss";
import "./chat.scss";
import Message from "./message";

class Chat extends React.Component {
  chatEndRef = React.createRef();

  state = {
    editingMessageId: null,
    messages: {}
  };

  addMessage = (message) => {
    let room = this.props.room;
    if (!room) return console.warn(`Tried to add chat message when not in a room:`, this.props);

    if (!room.users.hasOwnProperty(message.userId)) {
      return console.warn(`Received message from unknown user #${message.userId}:`, message, room.users)
    }

    let messages = this.state.messages;
    messages[message.id] = message;

    this.setState({messages: messages});
  };

  onMessageReceived = (data) => {
    if (data.message) this.addMessage(data.message);
  };

  onMessageEdited = (data) => {
    let messages = this.state.messages;
    if (!this.props.room) return console.warn(`Received message edit when not in a room:`, this.state);

    let userId = data.message.userId;
    if (!this.props.room.users.hasOwnProperty(userId)) {
      return console.warn(`Received edited message from unknown user #${userId}:`, data, this.props.room.users)
    }

    let message = data.message;
    if (!messages.hasOwnProperty(message.id)) {
      return console.warn(`Received edited message that was not previously recorded:`, data);
    }

    messages[message.id].body = message.body;
    this.setState({messages: messages});
  };

  onMessageLiked = (data) => {
    let messages = this.state.messages;
    let messageId = data.messageId;

    if (!messages.hasOwnProperty(messageId)) {
      return console.warn(`Received like for unknown message #${messageId}:`, data);
    }

    let message = messages[messageId];
    let like = data.like;

    if (message.likes.hasOwnProperty(like.userId)) {
      return console.warn(`Received like for message #${messageId} by user #${like.userId} that was already recorded:`, message);
    }

    message.likes[like.userId] = like;
    this.setState({messages: messages});
  };

  onMessageUnliked = (data) => {
    let messages = this.state.messages;
    let messageId = data.messageId;

    if (!messages.hasOwnProperty(messageId)) {
      return console.warn(`Received unlike for unknown message #${messageId}:`, data);
    }

    let message = messages[messageId];
    let userId = data.userId;

    if (!message.likes.hasOwnProperty(userId)) {
      return console.warn(`Received unlike for message #${messageId} by user #${userId}, but no like was recorded:`, message);
    }

    delete message.likes[userId];
    this.setState({messages: messages});
  };

  onMessageDeleted = (data) => {
    let messages = this.state.messages;

    let messageId = data.messageId;
    if (!messages.hasOwnProperty(messageId)) {
      return console.warn(`Received deletion for unknown message #${messageId}:`, data);
    }

    delete messages[messageId];

    let unchainMessageId = data.unchainMessageId;
    if (messages.hasOwnProperty(unchainMessageId)) {
      messages[unchainMessageId].isChained = false;
    }

    this.setState({messages: messages});
  }

  componentDidUpdate = (prevProps) => {
    if (!this.props.room || prevProps.room) return;

    console.info("Registering chat event listeners");
    let socket = this.props.socket;

    socket.on("userJoined", this.onMessageReceived);
    socket.on("userLeft", this.onMessageReceived);
    socket.on("userUpdated", this.onMessageReceived);
    socket.on("messageSent", this.onMessageReceived);

    socket.on("messageEdited", this.onMessageEdited);
    socket.on("messageLiked", this.onMessageLiked);
    socket.on("messageUnliked", this.onMessageUnliked);
    socket.on("messageDeleted", this.onMessageDeleted);

    this.setState({
      messages: this.props.room.messages
    });
  }

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
    if (message.userId === this.props.user.id) {
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
      if (newMessage.userId !== message.userId) throw new Error("User Mismatch");
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
      userId: userId,
      since: Math.floor(new Date().getTime() / 1000)
    };

    this.setState({});

    this.props.socket.likeMessage(messageId).then((like) => {
      console.info(`Liked message #${messageId}:`, like);
    }).catch((error) => {
      console.warn(`Failed to like message #${messageId}:`, error.message);
      let message = this.state.messages[messageId];
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
    if (message.userId !== userId) return console.warn(`Tried to delete message posted by other user:`, message);

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

              let userId = message.userId;
              if (!users.hasOwnProperty(userId)) return null;

              let postedBySelf = userId === ownUserId;
              let likedBySelf = message.likes.hasOwnProperty(ownUserId);

              let currentlyEditing = editingMessageId === message.id;

              return (
                <Message
                  key={message.id}
                  message={message}
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
          <div ref={this.chatEndRef}/>
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