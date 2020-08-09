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

    this.socket.on("init", (data) => {
      console.info("Socket Init:", data);
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

  async createRoom(visibility, votingMethod) {
    return this.emit("createRoom", {
      visibility: visibility,
      votingMethod: votingMethod
    }).then((res) => {
      let room = new Room(res.room);
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

  async rejoinRoom() {
    return this.emit("rejoinRoom").then((res) => {
      let room = new Room(res.room);
      room.pushLink();
      return room;
    });
  }
}


export default Socket;