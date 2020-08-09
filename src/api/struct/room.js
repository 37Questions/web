class Room {
  constructor(room, finishedCreation = true) {
    this.id = room.id;
    this.token = room.token;
    this.visibility = room.visibility;
    this.votingMethod = room.votingMethod;
    this.users = room.users;
    this.finishedCreation = finishedCreation;

    let url = window.location.href.split("?")[0];
    this.link = url + `?room=${this.id}&token=${this.token}`;
  }

  // Add room metadata to the current URL
  pushLink() {
    window.history.pushState(null, null, this.link);
  }

  // Remove room metadata from the current URL
  static resetLink() {
    let url = window.location.href.split("?")[0];
    window.history.pushState(null, null, url);
  }
}

export default Room;