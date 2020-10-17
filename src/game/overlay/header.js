import React from "react";
import onClickOutside from "react-onclickoutside";
import logo from "../../logo.svg";
import "./header.scss"

function Header(props) {
  return (
    <div id="header-wrapper">
      <div id="header-title" className="header-item">
        <img src={logo} className="header-logo" alt="" />
        <h1>37 Questions</h1>
      </div>
      <div
        id="menu-button"
        className={"header-item ignore-react-onclickoutside" + (props.withMenu ? " with-menu" : "")}
        onClick={() => props.toggleMenu(!props.withMenu)}
      >
        <h1>Menu</h1>
        <div className="menu-icon">
          <i className="fas fa-ellipsis-h" />
        </div>
      </div>
    </div>
  );
}

function HeaderMenuItem(props) {
  return (
    <div className="menu-item" onClick={props.onClick}>
      <div className="title">{props.title}</div>
      <div className="icon">
        <i className={"far fa-" + props.icon} />
      </div>
    </div>
  )
}

class HeaderMenu extends React.Component {
  handleClickOutside = () => {
    if (this.props.visible) this.props.setVisible(false);
  };

  render = () => {
    return (
      <div id="header-menu-container" className={(this.props.visible ? "visible" : "")}>
        <div id="header-menu">
          <HeaderMenuItem title="Suggest a Question" icon="lightbulb" onClick={this.props.openSuggestionPanel} />
          <HeaderMenuItem title="Support us on Patreon" icon="hand-holding-usd"/>
          <HeaderMenuItem title="Leave Room" icon="house-leave" onClick={this.props.leaveRoom} />
        </div>
      </div>
    );
  };
}

HeaderMenu = onClickOutside(HeaderMenu);

export {Header, HeaderMenu};