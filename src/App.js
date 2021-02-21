import "./App.css";
import React from "react";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.lastFrame = window.performance.now();
    this.lastSave = window.performance.now();
    const storedState = localStorage.getItem("save");
    if (storedState) {
      this.state = JSON.parse(storedState);
    } else {
      this.state = {};
    }
    window.addEventListener("beforeunload", this.save);
  }

  render() {
    let s = this.state;

    return (
      <>
        <h2>Light Game</h2>
        <div id="game">
          <div className="panel"></div>
          <div>
            <div className="panel" id="tabs"></div>
            <div className="panel" id="light"></div>
          </div>
        </div>
      </>
    );
  }

  save = () => {
    localStorage.setItem("save", JSON.stringify(this.state));
  };

  componentDidMount() {
    this.renderID = window.requestAnimationFrame(this.gameLoop);
  }

  componentWillUnmount() {
    window.addEventListener("beforeunload", this.save);
    window.cancelAnimationFrame(this.renderID);
  }

  gameLoop = (tFrame) => {
    if (tFrame > this.lastSave + 10000) {
      this.save();
      this.lastSave = tFrame;
    }
    let delta = tFrame - this.lastFrame;
    if (delta > 1000) {
      console.log("delta too large: " + delta);
      delta = 1000;
    }
    let minDelta = 1000 / 10;
    while (delta > minDelta) {
      delta -= minDelta;
      this.update(minDelta);
    }
    this.lastFrame = tFrame - delta;
    this.renderID = window.requestAnimationFrame(this.gameLoop);
  };

  update = (delta) => {
    let s = this.state;
    let updates = {};

    this.setState(updates);
  };
}

export default App;
