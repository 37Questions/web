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
        <div className="panel-header">
          <h1>Scoreboard</h1>
        </div>
        <div className="panel-scrollable">
          {
            Object.keys(users).map((userId, key) => {
              let user = users[userId];
              if (!user.name || !user.icon) return null;

              return (
                <div className="scrollable-item scoreboard-user" key={key}>
                  <Icon icon={user.icon} className="user-icon" />
                  <div className="user-info">
                    <div className="user-name">{user.name}</div>
                    <div className="user-state">{(user.active ? "Active" : "Inactive")}</div>
                  </div>
                  <div className="user-score">{user.score}</div>
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