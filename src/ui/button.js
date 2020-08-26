import React from "react";
import "./button.scss";

function Button(props) {
  let extraClasses = (props.isDisabled ? " disabled " : " ") + (props.className ? props.className : "");
  return (
    <div
      id={props.id}
      className={"button" + extraClasses}
      onClick={props.onClick}
    >
      {props.children}
    </div>
  );
}

function ActionButton(props) {
  const [hovered, setHovered] = React.useState(false);
  let classes = "action-btn";

  if (hovered) classes += " hovered";
  if (props.disabled) classes += " disabled";
  if (props.className) classes += ` ${props.className}`;

  return (
    <div className={classes}>
      <div className="action-btn-title-container">
        <div className="action-btn-title">{props.title}</div>
      </div>
      <div
        className="action-btn-icon-container"
        onMouseEnter={props.disabled ? undefined : () => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={props.onClick}
      >
        <div className="action-btn-icon">
          <i className={"fa" + (props.type || "s") + " fa-" + props.icon}/>
        </div>
      </div>
    </div>
  );
}

export {Button, ActionButton};