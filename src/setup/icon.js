import * as React from "react";
import "./icon.scss";

class Icon extends React.Component {
  render() {
    if (!this.props.icon) {
      return <Icon className={this.props.className} icon={{
        name: "exclamation-triangle",
        color: 250,
        backgroundColor: 0
      }} />;
    }
    return (
      <div
        className={"icon-wrapper " + (this.props.className)}
        style={{backgroundColor: `hsl(${this.props.icon.backgroundColor}, 70%, 80%)`}}
        onClick={this.props.onClick}
      >
        <div className="icon" style={{color: `hsl(${this.props.icon.color}, 60%, 30%)`}}>
          <i className={"fas fa-" + this.props.icon.name} />
        </div>
      </div>
    );
  }
}

export default Icon;