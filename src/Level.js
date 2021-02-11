import React, { Component } from "react";

class Level extends Component {
  constructor(props) {
    super(props);
    this.state = {
        level: this.props.level
    }
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick(level) {
    this.props.onChange(level);
    this.setState({level});
  }
  render() {
    return (
      <div className={`level-button-box`}>
        <div className={`level-button low ${(this.state.level >= 1) ? "active" : ""}`} onClick={() => (this.state.level === 1) ? this.handleClick(0) : this.handleClick(1)}>&nbsp;</div>
        <div className={`level-button medium ${(this.state.level >= 2) ? "active" : ""}`} onClick={() => this.handleClick(2)}>&nbsp;</div>
        <div className={`level-button high ${(this.state.level >= 3) ? "active" : ""}`} onClick={() => this.handleClick(3)}>&nbsp;</div>
        <div className={`level-button full ${(this.state.level >= 4) ? "active" : ""}`} onClick={() => this.handleClick(4)}>&nbsp;</div>
      </div>);
  }
}


export default Level;
