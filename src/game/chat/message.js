import React from "react";
import Icon from "../../setup/icon";
import TextareaAutosize from "react-textarea-autosize";
import "./message.scss";

function MessageAction(props) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div className={"message-action" + (hovered ? " hovered" : "")}>
      <div className="message-action-title-container">
        <div className="message-action-title">{props.title}</div>
      </div>
      <div
        className="message-action-icon-container"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={props.onClick}
      >
        <div className="message-action-icon">
          <i className={"fa" + (props.type || "s") + " fa-" + props.icon}/>
        </div>
      </div>
    </div>
  );
}

class Message extends React.Component {
  constructor(props) {
    super(props);

    let createdAt = new Date(this.props.message.createdAt * 1000);

    let today = this.props.today;

    if (today.year === createdAt.getFullYear() && today.month === createdAt.getMonth()) {
      let msgDate = createdAt.getDate()
      if (today.date === msgDate || today.date - 1 === msgDate) {
        this.timeString = createdAt.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true
        });

        if (!this.props.message.isChained) {
          let prefix = (today.date === msgDate) ? "" : " Yesterday";
          this.timeString = this.timeString + prefix;
        }
      }
    }

    if (!this.timeString) {
      this.timeString = createdAt.toLocaleDateString("en-US", {
        year: this.props.message.isChained ? "2-digit" : "numeric",
        month: "numeric",
        day: "numeric"
      });
    }
  }

  editingInput = React.createRef();

  state = {
    hovered: false
  };

  saveEdit = () => {
    let input = this.editingInput.current;
    if (!input) return console.warn("Tried to save edit but the input ref was null!");

    let body = input.value;
    if (body.length < 1) return;

    this.props.saveEdit(body);
  }

  onInput = (e) => {
    if (e.keyCode === 13) {
      // Enter key was pressed
      e.preventDefault();
      this.saveEdit();
    } else if (e.keyCode === 27) {
      // Escape key was pressed
      e.preventDefault();
      this.props.setEditing(false);
    }
  }

  startEditing = () => {
    this.props.setEditing(true, () => {
      let input = this.editingInput.current;
      if (!input) return console.warn("Failed to focus textarea when starting editing");

      input.focus();
      input.selectionStart = input.selectionEnd = input.value.length;
    });
  }

  setHovered = (hovered) => {
    if (this.state.hovered === hovered) return;
    this.setState({hovered: hovered});
  }

  toggleLiked = () => {
    if (this.props.likedBySelf) this.props.removeLike();
    else this.props.addLike();
  }

  render = () => {
    let message = this.props.message;
    let users = this.props.users;
    let user = users[message.userId];

    let editing = this.props.currentlyEditing;
    let hovered = this.state.hovered;

    let likedBySelf = this.props.likedBySelf;
    let postedBySelf = this.props.postedBySelf;

    let messageIcon = <Icon icon={user.icon} className="message-icon"/>;
    let messageContent = <div className="message-content">{message.body}</div>;

    let messageClass = "scrollable-item chat-message " + (message.isSystemMsg ? "system-msg" : "user-msg");
    if (hovered) messageClass += " hovered";

    let messageTitle = (
      <div className="message-title">
        <div className="message-user">{user.name}</div>
        <div className="message-time">{this.timeString}</div>
      </div>
    );

    if (message.isChained) {
      messageIcon = (
        <div className="chained-msg-time-container">
          {hovered &&
          <div className="chained-msg-time">
            {this.timeString}
          </div>
          }
        </div>
      );
      messageTitle = null;
      messageClass += " chained-msg";
    }

    if (editing) {
      messageContent = (
        <div className="editable-message-content">
          <TextareaAutosize
            className="text-input edit-message-input"
            maxLength={200}
            onKeyDown={this.onInput}
            defaultValue={message.body}
            async={true}
            ref={this.editingInput}
          />
          <div className="edit-message-footer">
            <div className="text-container">
              escape to <span className="link" onClick={() => this.props.setEditing(false)}>cancel</span>
            </div>
            <div className="divider-icon"><i className="fas fa-circle"/></div>
            <div className="text-container">
              enter to <span className="link" onClick={this.saveEdit}>save</span>
            </div>
          </div>
        </div>
      );
    }

    let likeKeys = Object.keys(message.likes);

    return (
      <div
        className={messageClass}
        onMouseEnter={() => this.setHovered(true)}
        onMouseLeave={() => this.setHovered(false)}
      >
        <div className="message-container">
          {messageIcon}
          <div className="message-info">
            {messageTitle}
            {messageContent}
          </div>
        </div>
        {hovered && !message.isSystemMsg && !editing &&
        <div className="message-actions-container">
          <div className="message-actions">
            {!likedBySelf && <MessageAction icon="heart" title="Like" onClick={this.props.addLike}/>}
            {likedBySelf && <MessageAction icon="heart" type="r" title="Unlike" onClick={this.props.removeLike}/>}
            {postedBySelf && <MessageAction icon="pencil" title="Edit" onClick={this.startEditing}/>}
            {postedBySelf && <MessageAction icon="trash" title="Delete" onClick={this.props.deleteSelf}/>}
            {!postedBySelf && <MessageAction icon="exclamation-triangle" title="Report"/>}
          </div>
        </div>
        }
        {likeKeys.length > 0 &&
        <div className="message-likes-container">
          <div className="message-likes">
            <div className="heart-icon-container">
              <div
                className={"heart-icon" + (likedBySelf ? " filled" : "")}
                onClick={this.toggleLiked}
                title={(likedBySelf ? "Unlike Message" : "Like Message")}
              >
                <i className="fas fa-heart"/>
              </div>
            </div>
            {
              likeKeys.map((userId) => {
                let likeUser = users[userId];

                return (
                  <div className="like-container" key={userId} title={"Liked by " + likeUser.name}>
                    <Icon className="like" icon={likeUser.icon}/>
                  </div>
                );
              })
            }
          </div>
        </div>
        }
      </div>
    );
  };
}

export default Message;