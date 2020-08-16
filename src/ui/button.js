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

export {Button};