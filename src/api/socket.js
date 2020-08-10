import socketIOClient from "socket.io-client";
import Api from "./api";
import Room from "./struct/room";

class Socket {
  constructor(user) {
    this.socket = socketIOClient(Api.ENDPOINT, {
      transports: ["websocket"],
      query: {
        id: user.id,
        token: user.token
      }
    });
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
    this.socket.on(message, callback);
  }

  async createRoom(visibility, votingMethod) {
    return this.emit("createRoom", {
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

  async sendMessage(body) {
    return this.emit("sendMessage", {
      body: body
    }).then((res) => {
      return res.message;
    })
  }

  async editMessage(id, body) {
    return this.emit("editMessage", {
      id: id,
      body: body
    }).then((res) => {
      return res.message;
    })
  }
}


export default Socket;