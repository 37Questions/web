import React, {useState} from 'react';
import {Header, HeaderMenu} from "./header";
import Scoreboard from "./scoreboard/scoreboard";
import Chat from "./chat/chat";
import './wrapper.scss';
import {GameWrapper, Game} from "./main/game";

function SidebarButton(props) {
  const [hovered, setHovered] = useState(false);
  const onMouseEnter = () => setHovered(true);
  const onMouseLeave = () => setHovered(false);

  const onClick = () => props.activated && handleClick();

  const onClickIcon = (e) => {
    e.stopPropagation();
    handleClick();
  }

  const handleClick = () => {
    setHovered(false);
    props.onClick();
  }

  const text = (
    <div className="title">
      <p className="title-text">{props.title}</p>
    </div>
  );

  return (
    <div
      className="sidebar-button-container" id={props.id}
      onClick={onClick}
    >
      <div className={"sidebar-button" + (hovered ? " hovered" : "")}>
        {props.textBefore && text}
        <div
          className={"icon" + (props.isLeft ? "" : " flipped")}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onClick={onClickIcon}
        >
          <div className={"unread-counter-wrapper" + (props.unreads > 0 ? " visible" : "")}>
            <div className="unread-counter">
              {props.unreads}
            </div>
          </div>
          <i className={"far fa-angle-left"} />
        </div>
        {!props.textBefore && text}
      </div>
    </div>
  );
}

class PanelStatus {
  static PANELS_HIDDEN = 0;
  static USER_PANEL_VISIBLE = 1;
  static CHAT_PANEL_VISIBLE = 2;
}

class Wrapper extends React.Component {
  constructor(props) {
    super(props);

    this.onChatUpdate = this.onChatUpdate.bind(this);
  }

  state = {
    panelStatus: PanelStatus.PANELS_HIDDEN,
    unreads: 0,
    headerMenuVisible: false
  };

  toggleUserPanel = () => {
    let status = this.state.panelStatus;
    status = status === PanelStatus.USER_PANEL_VISIBLE ? PanelStatus.PANELS_HIDDEN : PanelStatus.USER_PANEL_VISIBLE;
    this.setState({
      panelStatus: status
    });
  };

  toggleChatPanel = () => {
    let status = this.state.panelStatus;
    status = status === PanelStatus.CHAT_PANEL_VISIBLE ? PanelStatus.PANELS_HIDDEN : PanelStatus.CHAT_PANEL_VISIBLE;
    this.setState({
      panelStatus: status,
      unreads: status === PanelStatus.CHAT_PANEL_VISIBLE ? 0 : this.state.unreads
    });
  }

  hidePanels = () => this.setState({panelStatus: PanelStatus.PANELS_HIDDEN});

  getPanelString = () => {
    switch (this.state.panelStatus) {
      case PanelStatus.USER_PANEL_VISIBLE:
        return "with-user-panel";
      case PanelStatus.CHAT_PANEL_VISIBLE:
        return "with-chat-panel";
      default:
        return "without-panels";
    }
  }

  setHeaderMenuVisible(headerMenuVisible) {
    this.setState({headerMenuVisible: headerMenuVisible});
  }

  onChatUpdate = () => {
    console.info("UPODATE I:)", this);
    if (this.state.panelStatus === PanelStatus.CHAT_PANEL_VISIBLE) return;
    this.setState({
      unreads: this.state.unreads + 1
    });
  };

  render = () => {
    let panelStatus = this.state.panelStatus;
    let headerMenuVisible = this.state.headerMenuVisible;

    let socket = this.props.socket;
    let room =this.props.room;
    let user = this.props.user;

    return (
      <div id="wrapper">
        <div id="top-bar">
          <Header withMenu={headerMenuVisible} toggleMenu={this.setHeaderMenuVisible} />
        </div>
        <div id="game-wrapper" className={this.getPanelString()}>
          <div id="game-layout">
            <div className="side container" id="user-container">
              <Scoreboard room={room} />
            </div>
            <SidebarButton
              id="user-panel-btn"
              title="Scoreboard"
              onClick={this.toggleUserPanel}
              isLeft={panelStatus === PanelStatus.USER_PANEL_VISIBLE}
              activated={panelStatus === PanelStatus.USER_PANEL_VISIBLE}
            />
            <div className="container" id="game-container">
              <GameWrapper>
                <Game socket={socket} room={room} user={user} />
              </GameWrapper>
            </div>
            <div className="side container" id="chat-container">
              <Chat socket={socket} room={room} user={user} onUpdate={this.onChatUpdate}/>
            </div>
            <SidebarButton
              id="chat-panel-btn"
              title="Chat"
              textBefore={true}
              onClick={this.toggleChatPanel}
              isLeft={panelStatus !== PanelStatus.CHAT_PANEL_VISIBLE}
              activated={panelStatus === PanelStatus.CHAT_PANEL_VISIBLE}
              unreads={this.state.unreads}
            />
          </div>
          <div
            className="overlay"
            onClick={this.hidePanels}
          />
          <HeaderMenu visible={headerMenuVisible} setVisible={this.setHeaderMenuVisible} leaveRoom={this.props.leaveRoom} />
        </div>
      </div>
    );
  };
}

export default Wrapper;
