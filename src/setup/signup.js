import React from 'react';
import Api from "../api/api";
import Icon from "./icon";
import "./signup.scss";
import SetupFooter from "./footer";

const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 12;

class Signup extends React.Component {
  state = {
    icons: [],
    selectedIcon: null,
    canSubmit: false,
    usernameError: null
  };

  username = React.createRef();

  componentDidMount() {
    Api.getIcons().then((icons) => {
      this.setState({
        icons: icons
      });
    });
  }

  selectIcon = (icon) => {
    if (icon !== this.state.selectedIcon) {
      this.setState({
        selectedIcon: icon,
        canSubmit: (icon && this.username.current.value.length >= MIN_USERNAME_LENGTH)
      });
    }
  }

  onInput = () => {
    let username = this.username.current.value;
    let containsSpace = username.includes(" ");
    if (this.state.selectedIcon && username.length >= MIN_USERNAME_LENGTH && !containsSpace) {
      if (!this.state.canSubmit) {
        this.setState({
          canSubmit: true,
          usernameError: null
        });
      }
    } else if (this.state.canSubmit || containsSpace !== !!this.state.usernameError) {
      this.setState({
        canSubmit: false,
        usernameError: containsSpace ? "Username cannot contain spaces" : null
      });
    }
  }

  onKeyDown = (e) => {
    // If the enter key was pressed
    if (e.keyCode === 13) {
      e.preventDefault();
      this.submit();
    }
  };

  submit = () => {
    if (!this.state.canSubmit) return;

    let username = this.username.current.value;
    let icon = this.state.selectedIcon;

    if (!icon || username.length < MIN_USERNAME_LENGTH) return;

    console.info("Setup:", this.props);

    Api.setupUser(this.props.user, username, icon).then((error) => {
      if (error) return console.info("User setup failed:", error);
      this.props.onComplete(username, icon);
    });
  }


  render() {
    return (
      <div className="setup-wrapper">
        <div className="outer-setup-container">
          <div id="signup-form" className="inner-setup-container">
            <h1>37 Questions</h1>
            <h2>A game of wit and skill</h2>
            <p id="name-hint">
              Choose a username
              { this.state.usernameError && <div className="username-error">{this.state.usernameError}</div> }
            </p>
            <input
              type="text"
              id="name-input"
              className={"setup-input" + (this.state.usernameError ? " with-error" : "")}
              autoComplete="off"
              spellCheck="false"
              placeholder="Username..."
              ref={this.username}
              onInput={this.onInput}
              onKeyDown={this.onKeyDown}
              maxLength={MAX_USERNAME_LENGTH}
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
            <div
              id="signup-submit"
              className={"setup-button" + (this.state.canSubmit ? "" : " disabled")}
              onClick={this.submit}
            >
              Continue
            </div>
            <SetupFooter />
          </div>
        </div>
      </div>
    );
  }
}

export default Signup;