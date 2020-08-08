import socketIOClient from "socket.io-client";
import Api from "./api";

function createSocket(user) {
  let socket = socketIOClient(Api.ENDPOINT, {
    transports: ["websocket"],
    query: {
      id: user.id,
      token: user.token
    }
  });

  socket.on("init", (data) => {
    console.info("Socket Init:", data);
  });

  return socket;
}

export {createSocket};