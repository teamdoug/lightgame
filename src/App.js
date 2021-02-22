import "./App.css";
import React from "react";

const maxWidth = 3000;
const maxHeight = 3000;

class App extends React.Component {
  constructor(props) {
    super(props);
    this.lastFrame = window.performance.now();
    this.lastSave = window.performance.now();
    this.mainPanel = React.createRef();
    this.canvas = React.createRef();
    const storedState = localStorage.getItem("save");
    if (false && storedState) {
      this.state = JSON.parse(storedState);
      this.state.field = this.getInitField();
    } else {
      this.state = this.getInitState();
      this.state.field = this.getInitField();
    }
    window.addEventListener("beforeunload", this.save);
    window.addEventListener("resize", this.resizeCanvas);
  }

  getInitState = () => {
    return {
      photons: 0,
      starMass: 10,
      starRadius: 20,
      particleMass: 1,
      particleRadius: 10,
      particlePhotons: 1,
    };
  };

  getInitField = () => {
    return {
      particles: [...Array(1000).keys()].map(() => this.genParticle(false)),
    };
  };

  render() {
    let s = this.state;
    const canvas = this.canvas.current;
    if (canvas !== null) {
      this.drawCanvas(canvas);
    }

    return (
      <div id="verticalFlex">
        <h2 className="header">{s.photons} photons</h2>

        <div id="flex">
          <div className="panel" id="leftPanel">
            Mass: {s.starMass}
          </div>
          <div ref={this.mainPanel} className="panel" id="mainPanel">
            <canvas ref={this.canvas}></canvas>
          </div>
        </div>
        <div className="progress">X</div>
      </div>
    );
  }

  genParticle = (offScreen) => {
    let pRad = this.state.particleRadius;
    let x, y, vx, vy;
    if (offScreen) {
      let offVertical = getRandomInt(2) === 0;
      let topLeft = getRandomInt(2) === 0;
      if (offVertical) {
        x = getRandomInt(maxWidth) - maxWidth / 2;
        vx = this.getRandomVelocity(false) * (x > 0 ? -1 : 1);
        vy = -this.getRandomVelocity(false);
        y = maxWidth / 2 - pRad;
        if (topLeft) {
          y = -y;
          vy = -vy;
        }
      } else {
        y = getRandomInt(maxHeight) - maxHeight / 2;
        x = maxHeight / 2 - pRad;
        vy = this.getRandomVelocity(false) * (y > 0 ? -1 : 1);
        vx = -this.getRandomVelocity(false);
        if (topLeft) {
          x = -x;
          vx = -vx;
        }
      }
    } else {
      x = getRandomInt(maxWidth) - maxWidth / 2;
      y = getRandomInt(maxHeight) - maxHeight / 2;
      vx = this.getRandomVelocity(true);
      vy = this.getRandomVelocity(true);
    }
    return {
      x,
      y,
      vx,
      vy,
    };
  };

  getRandomVelocity = (allowNegative) => {
    let vel = getRandomInt(80) + 20;
    if (allowNegative && Math.random() < 0.5) {
      vel = -vel;
    }
    return vel;
  };

  drawCanvas = (canvas) => {
    let s = this.state;
    let pRad = s.particleRadius;
    let [w, h] = [canvas.width, canvas.height];
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();
    ctx.strokeStyle = "#ee3";
    ctx.arc(w / 2, h / 2, s.starRadius, 0, 2 * Math.PI);
    ctx.stroke();
    for (const particle of s.field.particles) {
      let { x, y } = particle;
      if (
        x < -w / 2 - pRad ||
        x > w / 2 + pRad ||
        y < -h / 2 - pRad ||
        y > h / 2 + pRad
      ) {
        continue;
      }
      ctx.beginPath();
      ctx.strokeStyle = "#bbb";
      ctx.arc(x + w / 2, y + h / 2, 10, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };

  save = () => {
    localStorage.setItem("save", JSON.stringify(this.state));
  };

  resizeCanvas = () => {
    if (this.canvas.current !== null) {
      this.canvas.current.style.width = "100%";
      this.canvas.current.style.height = "100%";
      if (this.canvas.current.offsetWidth > maxWidth) {
        this.canvas.current.width = maxWidth;
        this.canvas.current.style.width = maxWidth + "px";
      } else {
        this.canvas.current.width = this.canvas.current.offsetWidth;
      }
      if (this.canvas.current.offsetHeight > maxHeight) {
        this.canvas.current.height = maxHeight;
        this.canvas.current.style.height = maxHeight + "px";
      } else {
        this.canvas.current.height = this.canvas.current.offsetHeight;
      }
    }
  };

  componentDidMount() {
    this.renderID = window.requestAnimationFrame(this.gameLoop);
    this.resizeCanvas();
  }

  componentWillUnmount() {
    window.removeEventListener("beforeunload", this.save);
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
    let minDelta = 1000 / 60;
    while (delta > minDelta) {
      delta -= minDelta;
      this.update(minDelta);
    }
    this.lastFrame = tFrame - delta;
    this.renderID = window.requestAnimationFrame(this.gameLoop);
  };

  update = (delta) => {
    let relDelta = delta / 1000;
    let s = this.state;
    let updates = {};
    let [leftEdge, topEdge] = [
      -maxWidth / 2 - s.particleRadius,
      -maxHeight / 2 - s.particleRadius,
    ];
    let newMass = s.starMass;
    let newRadius = s.starRadius;
    let newPhotons = s.photons;
    let gConstant = 10000 * s.starMass;
    const drag = .0005;
    for (let p of s.field.particles) {
      let distSq = p.x * p.x + p.y * p.y;
      let dist = Math.sqrt(distSq);
      let gravX = ((-gConstant / distSq) * p.x) / dist;
      let gravY = ((-gConstant / distSq) * p.y) / dist;
      let vMag = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      let dragX = (-drag * p.vx * p.vx * p.vx) / vMag;
      let dragY = (-drag * p.vy * p.vy * p.vy) / vMag;
      p.vx += (gravX + dragX) * relDelta;
      p.vy += (gravY + dragY) * relDelta;
      p.x += p.vx * relDelta;
      p.y += p.vy * relDelta;
      if (
        (p.x > -leftEdge && p.vx > 0) ||
        (p.x < leftEdge && p.vx < 0) ||
        (p.y > -topEdge && p.vy > 0) ||
        (p.y < topEdge && p.vy < 0)
      ) {
        Object.assign(p, this.genParticle(true));
      }
      if (p.x * p.x + p.y * p.y < (s.particleRadius + s.starRadius) ** 2) {
        Object.assign(p, this.genParticle(true));
        newMass += s.particleMass;
        newRadius = (newRadius ** 3 + s.particleRadius ** 3) ** (1 / 3);
        newPhotons += s.particlePhotons;
      }
    }
    updates.field = s.field;
    updates.starMass = newMass;
    updates.starRadius = newRadius;
    updates.photons = newPhotons;
    this.setState(updates);
  };
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

export default App;
