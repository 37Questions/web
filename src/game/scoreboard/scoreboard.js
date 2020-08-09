import * as React from "react";
import "../panel.scss";
import "./scoreboard.scss";
import Icon from "../../setup/icon";

class Scoreboard extends React.Component {
  render() {
    if (!this.props.room) return <div className="panel-wrapper" id="scoreboard-wrapper" />

    let users = this.props.room.users;

    return (
      <div className="panel-wrapper" id="scoreboard-wrapper">
        <p>Scoreboard</p>
        <div className="scoreboard-list">
          {
            Object.keys(users).map((userId, key) => {
              let user = users[userId];
              if (!user.name || !user.icon) return;

              return (
                <div className="scoreboard-user" key={key}>
                  <Icon icon={user.icon} />
                  {(`${user.id}: ${user.name} (${user.active ? "active" : "inactive"})`)}
                </div>
              );
            })
          }
        </div>
      </div>
    );
  }
}

export default Scoreboard;