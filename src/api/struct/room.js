class Room {
  constructor(room, finishedCreation = true) {
    this.id = room.id;
    this.name = room.name;
    this.lastActive = room.lastActive;
    this.token = room.token;
    this.visibility = room.visibility;
    this.votingMethod = room.votingMethod;

    this.users = room.users;
    this.messages = room.messages;

    this.state = room.state;
    this.questions = room.questions;

    this.finishedCreation = finishedCreation;

    let url = window.location.href.split("?")[0];
    this.link = url + `?room=${this.id}${this.token ? `&token=${this.token}` : ""}`;
  }

  // Add room metadata to the current URL
  pushLink() {
    window.history.pushState(null, null, this.link);
  }

  addMessage(message) {
    if (!this.messages) this.messages = {};
    this.messages[message.id] = message;
  }

  forEachUser(fn) {
    Object.keys(this.users).forEach((userId) => {
      fn(this.users[userId]);
    });
  }

  // Remove room metadata from the current URL
  static resetLink() {
    let url = window.location.href.split("?")[0];
    window.history.pushState(null, null, url);
  }
}

class RoomState {
  static PICKING_QUESTION = "picking_question";
  static COLLECTING_ANSWERS = "collecting_answers";
  static READING_ANSWERS = "reading_answers";
}

export {Room, RoomState};