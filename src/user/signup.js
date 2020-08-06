import React from 'react';
import {getIcons} from "../api";
import "./signup.scss";

class Signup extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      icons: []
    };
  }

  componentDidMount() {
    getIcons().then((icons) => {
      this.setState({
        icons: icons
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
            <input type="text" id="name-input" autoComplete="off" spellCheck="false" placeholder="username..." />
            <p id="icon-hint">Choose an icon</p>
            <div id="icon-selection">
              {
                this.state.icons.map((icon) => {
                  const iconName = icon.icon;
                  return (
                    <div
                      className="icon-wrapper"
                      key={"icon-" + iconName}
                      style={{backgroundColor: icon.background}}
                    >
                      <div className="icon" style={{color: icon.color}}>
                        <i className={"fas fa-" + iconName} />
                      </div>
                    </div>
                  );
                })
              }
            </div>
            <div id="signup-submit">
              Continue
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Signup;