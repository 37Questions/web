class Room {
  constructor(room, finishedCreation = true) {
    this.id = room.id;
    this.lastActive = room.lastActive;
    this.token = room.token;
    this.visibility = room.visibility;
    this.votingMethod = room.votingMethod;

    this.users = room.users;
    this.messages = room.messages;

    this.finishedCreation = finishedCreation;

    let url = window.location.href.split("?")[0];
    this.link = url + `?room=${this.id}&token=${this.token}`;
  }

  // Add room metadata to the current URL
  pushLink() {
    window.history.pushState(null, null, this.link);
  }

  addMessage(message) {
    if (!this.messages) this.messages = {};
    this.messages[message.id] = message;
  }

  // Remove room metadata from the current URL
  static resetLink() {
    let url = window.location.href.split("?")[0];
    window.history.pushState(null, null, url);
  }
}

export default Room;