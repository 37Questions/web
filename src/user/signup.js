import React from 'react';
import Api from "../api";
import Icon from "./icon";
import "./signup.scss";

const MIN_USERNAME_LENGTH = 3;

class Signup extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      icons: [],
      selectedIcon: null,
      canSubmit: false
    };

    this.username = React.createRef();
    this.selectIcon = this.selectIcon.bind(this);
    this.onInput = this.onInput.bind(this);
    this.submit = this.submit.bind(this);
  }

  componentDidMount() {
    Api.getIcons().then((icons) => {
      this.setState({
        icons: icons
      });
    });
  }

  selectIcon(icon) {
    if (icon !== this.state.selectedIcon) {
      this.setState({
        selectedIcon: icon,
        canSubmit: (icon && this.username.current.value.length >= MIN_USERNAME_LENGTH)
      });
    }
  }

  onInput() {
    if (this.state.selectedIcon && this.username.current.value.length >= MIN_USERNAME_LENGTH) {
      if (!this.state.canSubmit) {
        this.setState({
          canSubmit: true
        });
      }
    } else if (this.state.canSubmit) {
      this.setState({
        canSubmit: false
      });
    }
  }

  submit() {
    if (!this.state.canSubmit) return;

    let username = this.username.current.value;
    let icon = this.state.selectedIcon;

    if (!icon || username.length < MIN_USERNAME_LENGTH) return;

    Api.setupUser(this.props.user, username, icon).then((error) => {
      if (error) return console.info("User setup failed:", error);
      this.props.onComplete({
        id: this.props.user.id,
        token: this.props.user.token,
        name: username,
        icon: icon
      });
    });
  }


  render() {
    return (
      <div id="signup-wrapper">
        <div id="signup-form-container">
          <div id="signup-form">
            <h1>37 Questions</h1>
            <h2>A game of wit and skill</h2>
            <p id="name-hint">Choose a username</p>
            <input
              type="text"
              id="name-input"
              autoComplete="off"
              spellCheck="false"
              placeholder="username..."
              ref={this.username}
              onInput={this.onInput}
            />
            <p id="icon-hint">Choose an icon</p>
            <div id="icon-selection">
              {
                this.state.icons.map((icon, key) => {
                  return (
                    <Icon
                      icon={icon}
                      className={(this.state.selectedIcon === icon ? " selected" : "")}
                      key={key}
                      onClick={() => this.selectIcon(icon)}
                    />
                  );
                })
              }
            </div>
            <div id="signup-submit" className={(this.state.canSubmit ? "" : "disabled")} onClick={this.submit}>
              Continue
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Signup;