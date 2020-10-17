import socketIOClient from "socket.io-client";
import Api from "./api";
import {Room} from "./struct/room";

class Socket {
  constructor(user, additionalUpdateListener) {
    this.socket = socketIOClient(Api.ENDPOINT, {
      transports: ["websocket"],
      query: {
        id: user.id,
        token: user.token
      }
    });
    this.additionalUpdateListener = additionalUpdateListener;
  }

  async emit(message, data = {}) {
    return new Promise((resolve, reject) => {
      this.socket.emit(message, data, (res) => {
        if (res.error) reject(new Error(res.error));
        else resolve(res);
      });
    });
  }

  on(message, callback) {
    this.socket.on(message, (data) => {
      callback(data);

      if (data && data.additionalUpdate) {
        let update = data.additionalUpdate;
        if (update && this.additionalUpdateListener) {
          this.additionalUpdateListener(update.event, update.data);
        }
      }
    });
  }

  async createRoom(name, visibility, votingMethod) {
    return this.emit("createRoom", {
      name: name,
      visibility: visibility,
      votingMethod: votingMethod
    }).then((res) => {
      let room = new Room(res.room, false);
      room.pushLink();
      return room;
    });
  }

  async joinRoom(id, token) {
    return this.emit("joinRoom", {
      id: id,
      token: token
    }).then((res) => {
      let room = new Room(res.room);
      room.pushLink();
      return room;
    });
  }

  async leaveRoom() {
    return this.emit("leaveRoom").then((res) => {
      return res.success;
    });
  }

  async sendMessage(body) {
    return this.emit("sendMessage", {
      body: body
    }).then((res) => res.message);
  }

  async editMessage(id, body) {
    return this.emit("editMessage", {
      id: id,
      body: body
    }).then((res) => res.message);
  }

  async likeMessage(id) {
    return this.emit("likeMessage", {
      id: id
    }).then((res) => res.like);
  }

  async unlikeMessage(id) {
    return this.emit("unlikeMessage", {
      id: id
    }).then((res) => res.success);
  }

  async deleteMessage(id) {
    return this.emit("deleteMessage", {
      id: id
    }).then((res) => res.unchainMessageId);
  }

  suggestQuestion = (question) => this.emit("suggestQuestion", {question: question});

  submitQuestion = (id) => this.emit("submitQuestion", {id: id});
  submitAnswer = (answer) => this.emit("submitAnswer", {answer: answer});

  startReadingAnswers = () => this.emit("startReadingAnswers");
  revealAnswer = (displayPosition) => this.emit("revealAnswer", {displayPosition: displayPosition});
  setFavoriteAnswer = (displayPosition) => this.emit("setFavoriteAnswer", {displayPosition: displayPosition});
  clearFavoriteAnswer = () => this.emit("clearFavoriteAnswer");
}


export default Socket;