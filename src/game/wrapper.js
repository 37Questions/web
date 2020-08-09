import React, {useState} from 'react';
import Game from "./game";
import Scoreboard from "./scoreboard/scoreboard";
import Chat from "./chat/chat";
import Header from "./header";
import './wrapper.scss';

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
          <i className={"far fa-angle-left"} />
        </div>
        {!props.textBefore && text}
      </div>
    </div>
  );
}

function Wrapper(props) {
  const PANELS_HIDDEN = 0;
  const USER_PANEL_VISIBLE = 1;
  const CHAT_PANEL_VISIBLE = 2;

  const [panelStatus, setPanelStatus] = useState(PANELS_HIDDEN);
  const hidePanels = () => setPanelStatus(PANELS_HIDDEN);

  const toggleUserPanel = () => {
    setPanelStatus(panelStatus === USER_PANEL_VISIBLE ? PANELS_HIDDEN : USER_PANEL_VISIBLE);
  };

  const toggleChatPanel = () => {
    setPanelStatus(panelStatus === CHAT_PANEL_VISIBLE ? PANELS_HIDDEN : CHAT_PANEL_VISIBLE);
  }

  const getPanelString = () => {
    if (panelStatus === USER_PANEL_VISIBLE) return "with-user-panel";
    if (panelStatus === CHAT_PANEL_VISIBLE) return "with-chat-panel";
    return "without-panels";
  }

  return (
    <div id="wrapper">
      <div id="top-bar">
        <Header />
      </div>
      <div id="game-wrapper" className={getPanelString()}>
        <div id="game-layout">
          <div className="side container" id="user-container">
            <Scoreboard room={props.room} />
          </div>
          <SidebarButton
            id="user-panel-btn"
            title="Scoreboard"
            onClick={toggleUserPanel}
            isLeft={panelStatus === USER_PANEL_VISIBLE}
            activated={panelStatus === USER_PANEL_VISIBLE}
          />
          <div className="container" id="game-container">
            <Game />
          </div>
          <div className="side container" id="chat-container">
            <Chat room={props.room} />
          </div>
          <SidebarButton
            id="chat-panel-btn"
            title="Chat"
            textBefore={true}
            onClick={toggleChatPanel}
            isLeft={panelStatus !== CHAT_PANEL_VISIBLE}
            activated={panelStatus === CHAT_PANEL_VISIBLE}
          />
        </div>
        <div
          className="overlay"
          onClick={hidePanels}
        />
      </div>
    </div>
  );
}

export default Wrapper;
