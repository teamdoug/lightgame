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
    } else {
      this.state = this.getInitState();
    }
    this.fields = [];
    for (let star of this.state.stars) {
      this.fields.push(this.getInitField(star));
    }
    window.addEventListener("beforeunload", this.save);
    window.addEventListener("resize", this.resizeCanvas);
  }

  getInitState = () => {
    let state = {
      paused: false,
      stars: [this.getInitStar()],
    };
    return state;
  };

  getInitStar = () => {
    let star = {
      photons: 0,
      starMass: 10,
      starRadius: 20,
      particleMass: 0.2,
      particleRadius: 5,
      particleCount: 1000,
      particlePhotons: 1,
    };
    return star;
  };

  getInitField = (star) => {
    return {
      particles: [...Array(star.particleCount).keys()].map(() =>
        this.genParticle(star, false)
      ),
    };
  };

  render() {
    let s = this.state;
    let star = s.stars[0];
    let field = this.fields[0];
    const canvas = this.canvas.current;
    if (canvas !== null) {
      this.drawCanvas(canvas, star, field);
    }

    return (
      <div id="verticalFlex">
        <h2 className="header">
          {star.photons} photons
          <button onClick={this.togglePause}>
            {s.paused ? "Resume" : "Pause"}
          </button>
        </h2>

        <div id="flex">
          <div className="panel" id="leftPanel">
            Mass: {star.starMass}
          </div>
          <div ref={this.mainPanel} className="panel" id="mainPanel">
            <canvas ref={this.canvas}></canvas>
          </div>
        </div>
        <div className="progress">X</div>
      </div>
    );
  }

  genParticle = (star, offScreen, existing) => {
    let pRad = star.particleRadius;
    if (existing === undefined) {
      existing = {};
    }
    if (offScreen) {
      let offVertical = getRandomInt(2) === 0;
      let topLeft = getRandomInt(2) === 0;
      if (offVertical) {
        existing.x = getRandomInt(maxWidth) - maxWidth / 2;
        existing.vx = this.getRandomVelocity(false) * (existing.x > 0 ? -1 : 1);
        existing.vy = -this.getRandomVelocity(false);
        existing.y = maxWidth / 2 - pRad;
        if (topLeft) {
          existing.y = -existing.y;
          existing.vy = -existing.vy;
        }
      } else {
        existing.y = getRandomInt(maxHeight) - maxHeight / 2;
        existing.x = maxHeight / 2 - pRad;
        existing.vy = this.getRandomVelocity(false) * (existing.y > 0 ? -1 : 1);
        existing.vx = -this.getRandomVelocity(false);
        if (topLeft) {
          existing.x = -existing.x;
          existing.vx = -existing.vx;
        }
      }
    } else {
      existing.x = getRandomInt(maxWidth) - maxWidth / 2;
      existing.y = getRandomInt(maxHeight) - maxHeight / 2;
      existing.vx = this.getRandomVelocity(true);
      existing.vy = this.getRandomVelocity(true);
    }
    return existing;
  };

  getRandomVelocity = (allowNegative) => {
    let vel = getRandomInt(80) + 20;
    if (allowNegative && Math.random() < 0.5) {
      vel = -vel;
    }
    return vel;
  };

  drawCanvas = (canvas, star, field) => {
    let s = this.state;
    let pRad = s.particleRadius;
    let [w, h] = [canvas.width, canvas.height];
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();
    ctx.strokeStyle = "#ee3";
    ctx.arc(w / 2, h / 2, star.starRadius, 0, 2 * Math.PI);
    ctx.stroke();
    for (const particle of field.particles) {
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
      this.forceUpdate();
    }
  };

  componentDidMount() {
    this.resizeCanvas();
    this.renderID = window.requestAnimationFrame(this.gameLoop);
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
      if (this.state.paused) {
        continue;
      }
      this.update(minDelta);
    }
    this.lastFrame = tFrame - delta;
    this.renderID = window.requestAnimationFrame(this.gameLoop);
  };

  togglePause = () => {
    this.setState({ paused: !this.state.paused });
  };

  update = (delta) => {
    let relDelta = delta / 1000;
    let s = this.state;
    let updates = { stars: [] };
    for (let [index, star] of this.state.stars.entries()) {
      let [leftEdge, topEdge] = [
        -maxWidth / 2 - star.particleRadius,
        -maxHeight / 2 - star.particleRadius,
      ];
      let gConstant = 10000 * star.starMass;
      const drag = 0.0005;
      let newMass = star.starMass;
      let newRadius = star.starRadius;
      let newPhotons = star.photons;
      for (const p of this.fields[index].particles) {
        const distSq = p.x * p.x + p.y * p.y;
        const dist = Math.sqrt(distSq);
        const gravX = ((-gConstant / distSq) * p.x) / dist;
        const gravY = ((-gConstant / distSq) * p.y) / dist;
        const vMag = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const dragX = (-drag * p.vx * p.vx * p.vx) / vMag;
        const dragY = (-drag * p.vy * p.vy * p.vy) / vMag;
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
          this.genParticle(star, true, p);
        }
        if (
          p.x * p.x + p.y * p.y <
          (star.particleRadius + star.starRadius) ** 2
        ) {
          this.genParticle(star, true, p);
          newMass += star.particleMass;
          newRadius = (newRadius ** 3 + star.particleRadius ** 3) ** (1 / 3);
          newPhotons += star.particlePhotons;
        }
      }
      updates.stars.push({
        ...star,
        starMass: newMass,
        starRadius: newRadius,
        photons: newPhotons,
      });
    }
    this.setState(updates);
    this.forceUpdate();
  };
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

export default App;
