import "./App.css";
import React from "react";

const maxWidth = 2000;
const maxHeight = 1500;
const gridSpacing = 200;
const velocityCap = 400;
const accelerationCap = 300;
const gravity = 200000;
const mouseAcceleration = 300;
const collapseMass = 1e20;
const yellowCollapseMass = 1e25;
//const blueCollapseMass = 1e30;
const starDrag = 1;

// TODO: Add upgrades, starting with particleDensity + 50%
// TODO: Reveal mass at 12 mass? Show progress bar? Maybe progress bar later... Or an interim progress bar?
// TODO: mousegravity behind an upgrade. upgrade again for permanent. upgrades for power?
// TODO: velocity achievement for spedometer? or upgrade for acceleration/max velocity unlocks spedometer? remove spedometer?

// Lower priority
// TODO: Animate log/other things
// TODO: Design next layer: star clusters/nebulas
// TODO: Options to control star drag?

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
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseClicked = false;
    window.addEventListener("beforeunload", this.save);
    window.addEventListener("resize", this.resizeCanvas);
    window.app = this;
  }

  getInitState = () => {
    let state = {
      paused: false,
      stars: [this.getInitStar()],
      logText: ["The universe is dark."],
      featureTriggers: {
        firstPhoton: false,
        tenthPhoton: false,
      },
      upgrades: {
        startingGravity: 0,
        mouseGravity: 0,
        permanentMouseGravity: 0,
        startingMass: 0,
        startingPhotons: 0,
        startingParticleCount: 0,
        startingRadiusFactor: 0,
        startingParticleRadius: 0,
        startingParticleMass: 0,
        startingPhotonCount: 0,
      },
    };
    return state;
  };

  getInitStar = () => {
    let star = {
      photons: 0,
      starMass: 10,
      starRadiusFactor: 20,
      particleMass: 0.1,
      particleRadius: 3,
      particleCount: 50,
      particlePhotons: 1,
      vx: 50,
      vy: 0,
      gridX: 0,
      gridY: 0,
      velocity: 50,
      mouseGravity: 1000000,
      mouseDrag: 0.1,
      upgrades: {
        photonCount: 0,
        particleCount: 0,
        particleMass: 0,
        particleRadius: 0,
        starRadiusFactor: 0,
        permanentMouseGravity: 0,
        gravity: 0,
      },
    };
    return star;
  };

  getInitField = (star) => {
    return {
      colorFrame: 0,
      photons: [],
      particles: [...Array(star.particleCount).keys()].map(() =>
        this.genParticle(star, false)
      ),
    };
  };

  getStarRadius = (star) => {
    return (
      20 +
      (star.starRadiusFactor * Math.log(star.starMass / 10)) / Math.log(2000000)
    );
  };

  render() {
    let s = this.state;
    let star = s.stars[0];
    let field = this.fields[0];
    const canvas = this.canvas.current;
    if (canvas !== null) {
      this.drawCanvas(canvas, star, field);
    }
    let starProgress =
      (100 * Math.log(star.starMass - 9)) / Math.log(collapseMass);
    if (starProgress > 100) {
      starProgress = 100;
    }

    return (
      <div id="verticalFlex">
        <h2 className="header">
          {s.featureTriggers.firstPhoton && (
            <>{itoa(star.photons, true)} photons</>
          )}
          <div className="button" onClick={this.togglePause}>
            {s.paused ? "Resume" : "Pause"}
          </div>
          <div
            className="button"
            onClick={() => this.modifyStar(0, "photons", 100)}
          >
            Photons
          </div>
        </h2>

        <div id="flex">
          <div className="panel" id="leftPanel">
            <p>Mass: {itoa(star.starMass)}</p>
            <p>Velocity: {star.velocity.toFixed(2)}</p>
            <p>
              <div
                className="button"
                onClick={() => this.modifyStar(0, "starMass", 100)}
              >
                Big Mass
              </div>{" "}
            </p>
            <p>
              <div
                className="button"
                onClick={() => this.modifyStar(0, "starRadiusFactor", 1.1)}
              >
                Big Radius
              </div>{" "}
            </p>
            <div id="log">
              {s.logText.map((value, index) => (
                <p key={s.logText.length-index}>{value}</p>
              ))}
            </div>
          </div>
          <div ref={this.mainPanel} className="panel" id="mainPanel">
            <canvas
              ref={this.canvas}
              onMouseMove={this.mouseMove}
              onMouseDown={this.mouseMove}
              onMouseUp={this.mouseMove}
              onMouseLeave={this.mouseMove}
            ></canvas>
          </div>
        </div>
        <div className="progress">
          <div
            style={{
              width: starProgress + "%",
              postition: "absolute",
              top: 0,
              left: 0,
              height: "21px",
              backgroundColor: "#151",
            }}
          ></div>
          <div style={{ position: "absolute", top: 0, left: 0 }}>
            {starProgress.toFixed(2)}% to Stellar Mass ({itoa(collapseMass)})
          </div>
        </div>
      </div>
    );
  }

  modifyStar = (index, prop, increase) => {
    let star = this.state.stars[index];
    star[prop] = star[prop] * increase + 1;
    this.setState({
      stars: this.state.stars.splice(index, 1, star),
    });
  };

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
      if (existing.x * existing.x + existing.y * existing.y < 10000) {
        return this.genParticle(star, offScreen, existing);
      }
    }
    return existing;
  };

  mouseMove = (e) => {
    if (!this.canvas.current) {
      return;
    }
    if (e.type === "mouseleave") {
      this.mouseClicked = false;
      return;
    }
    if ((e.buttons & 1) === 1 || true) {
      var rect = this.canvas.current.getBoundingClientRect();
      this.mouseClicked = true;
      this.mouseX = e.clientX - rect.left - this.canvas.current.width / 2;
      this.mouseY = e.clientY - rect.top - this.canvas.current.height / 2;
    } else {
      this.mouseClicked = false;
    }
  };

  getRandomVelocity = (allowNegative) => {
    let vel = getRandomInt(80) + 20;
    if (allowNegative && Math.random() < 0.5) {
      vel = -vel;
    }
    return vel;
  };

  getStarColor(mass, colorFrame) {
    let red, green, blue;
    if (mass <= collapseMass) {
      let ratio = Math.log(mass) / Math.log(collapseMass);
      red = ratio * 87 + 10;
      green = ratio * 5;
      blue = ratio * 5;
    } else if (mass <= yellowCollapseMass) {
      let ratio = Math.log(mass / collapseMass) / Math.log(yellowCollapseMass);
      red = ratio * 66 + 97;
      green = ratio * 129 + 5;
      blue = ratio * 15 + 5;
    } else {
      red = 232;
      green = 199;
      blue = 35;
    }
    let intensity = colorFrame / 5;
    if (colorFrame >= 5) {
      intensity = (10 - colorFrame) / 5;
    }
    red = intensity * (red - 10) + 10;
    blue = intensity * blue;
    green = intensity * green;
    return "rgb(" + red + "," + green + "," + blue + ")";
  }

  drawCanvas = (canvas, star, field) => {
    let pRad = star.particleRadius;
    let starRadius = this.getStarRadius(star);

    let [w, h] = [canvas.width, canvas.height];
    let [cx, cy] = [w / 2, h / 2];
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.fillStyle = "#575757";
    ctx.fillRect(0, 0, w, h);
    ctx.beginPath();
    ctx.strokeStyle = "#333";
    let gridX = star.gridX;
    while (gridX < canvas.width) {
      if (gridX >= 0) {
        ctx.beginPath();
        ctx.moveTo(gridX, 0);
        ctx.lineTo(gridX, canvas.height);
        ctx.stroke();
      }
      gridX += gridSpacing;
    }
    let gridY = star.gridY;
    while (gridY < canvas.height) {
      if (gridY >= 0) {
        ctx.beginPath();
        ctx.moveTo(0, gridY);
        ctx.lineTo(canvas.width, gridY);
        ctx.stroke();
      }
      gridY += gridSpacing;
    }

    ctx.fillStyle = this.getStarColor(star.starMass, field.colorFrame);
    ctx.beginPath();
    ctx.arc(cx, cy, starRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "#000";
    for (const particle of field.particles) {
      if (
        particle.x < -cx - pRad ||
        particle.x > cx + pRad ||
        particle.y < -cy - pRad ||
        particle.y > cy + pRad
      ) {
        continue;
      }
      ctx.beginPath();
      ctx.arc(particle.x + cx, particle.y + cy, pRad, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.strokeStyle = "#ff4";
    for (const photon of field.photons) {
      if (photon.x < -cx || photon.x > cx || photon.y < -cy || photon.y > cy) {
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(photon.x + cx, photon.y + cy);
      ctx.lineTo(
        photon.x + cx + photon.vx / 50,
        photon.y + cy + photon.vy / 50
      );
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
    let debugFrame = false;
    if (tFrame % 1000 < minDelta) {
      debugFrame = true;
    }
    let loopCount = 0;
    while (delta > minDelta) {
      delta -= minDelta;
      if (this.state.paused) {
        continue;
      }
      loopCount += 1;
      this.update(minDelta, debugFrame);
      debugFrame = false;
    }
    if (loopCount > 1) {
      console.log("loops", loopCount);
    }
    this.lastFrame = tFrame - delta;
    this.renderID = window.requestAnimationFrame(this.gameLoop);
  };

  togglePause = () => {
    this.setState({ paused: !this.state.paused });
  };

  update = (delta, debugFrame) => {
    let s = this.state;
    let relDelta = delta / 1000;
    let updates = {
      stars: [],
      featureTriggers: { ...s.featureTriggers },
      logText: s.logText,
    };
    const dragConstant = 0.0005;
    for (let [index, star] of this.state.stars.entries()) {
      let starRadius = this.getStarRadius(star);
      let [leftEdge, topEdge] = [
        -maxWidth / 2 - star.particleRadius,
        -maxHeight / 2 - star.particleRadius,
      ];
      let [rightEdge, bottomEdge] = [-leftEdge, -topEdge];
      this.fields[index].colorFrame =
        (this.fields[index].colorFrame + relDelta) % 10;
      let gConstant = (gravity * Math.log(star.starMass)) / Math.log(20);
      let newMass = star.starMass;
      let newPhotons = star.photons;
      let vx = star.vx;
      let vy = star.vy;
      let velocity = star.velocity;
      let drag = dragConstant;
      if (this.mouseClicked) {
        let distSq = this.mouseX * this.mouseX + this.mouseY * this.mouseY;
        let dist = distSq ** 0.5;
        let scale = 1;
        if (dist > accelerationCap) {
          scale = dist / accelerationCap;
        }

        if (dist <= starRadius) {
          gConstant += star.mouseGravity;
          drag *= star.mouseDrag;
        } else {
          vx += ((mouseAcceleration * this.mouseX) / dist / scale) * relDelta;
          vy += ((mouseAcceleration * this.mouseY) / dist / scale) * relDelta;
        }
      } else {
        let vMag = (vx * vx + vy * vy) ** 0.5;
        if (vMag < 0.005) {
          vx = vy = 0;
        } else {
          let xSign = vx < 0 ? 1 : -1;
          let ySign = vy < 0 ? 1 : -1;
          vx += xSign * ((starDrag * vx * vx) / vMag) * relDelta;
          vy += ySign * ((starDrag * vy * vy) / vMag) * relDelta;
        }
      }
      if (debugFrame) {
        console.log("gConstant", gConstant);
      }
      velocity = (vx * vx + vy * vy) ** 0.5;
      if (velocity > velocityCap) {
        vx *= velocityCap / velocity;
        vy *= velocityCap / velocity;
        velocity = velocityCap;
      }

      let newDrawPhotons = [];
      for (let p of this.fields[index].photons) {
        p.x += p.vx * relDelta;
        p.y += p.vy * relDelta;
        if (
          p.x < leftEdge ||
          p.x > rightEdge ||
          p.y < topEdge ||
          p.y > bottomEdge
        ) {
          continue;
        }
        newDrawPhotons.push(p);
      }
      this.fields[index].photons = newDrawPhotons;

      for (let p of this.fields[index].particles) {
        let distSq = p.x * p.x + p.y * p.y;
        let dist = distSq ** 0.5;
        let vMag = (p.vx * p.vx + p.vy * p.vy) ** 0.5;
        p.vx +=
          (((-gConstant / distSq) * p.x) / dist +
            (-drag * p.vx * p.vx * p.vx) / vMag) *
          relDelta;
        p.vy +=
          (((-gConstant / distSq) * p.y) / dist +
            (-drag * p.vy * p.vy * p.vy) / vMag) *
          relDelta;
        p.x += (p.vx - vx) * relDelta;
        p.y += (p.vy - vy) * relDelta;
        if (
          (p.x > rightEdge && p.vx - vx > 0) ||
          (p.x < leftEdge && p.vx - vx < 0) ||
          (p.y > bottomEdge && p.vy - vy > 0) ||
          (p.y < topEdge && p.vy - vy < 0)
        ) {
          this.genParticle(star, true, p);
        }
        if (p.x * p.x + p.y * p.y < (star.particleRadius + starRadius) ** 2) {
          distSq = p.x * p.x + p.y * p.y;
          dist = distSq ** 0.5;
          this.fields[index].photons.push({
            x: (starRadius * p.x) / dist,
            y: (starRadius * p.y) / dist,
            vx: (1200 * p.x) / dist,
            vy: (1200 * p.y) / dist,
          });
          this.genParticle(star, true, p);
          if (!updates.featureTriggers.firstPhoton) {
            updates.featureTriggers.firstPhoton = true;
            updates.logText.unshift(
              "Colliding with particles emits photons. Maybe with enough light...")
          }
          newMass += star.particleMass;
          newPhotons += star.particlePhotons;
          if(!updates.featureTriggers.tenthPhoton && newPhotons >= 10) {
            updates.featureTriggers.tenthPhoton = true;
            updates.logText.unshift(
            "Yes, it looks like you can use the photons to increase the particle density.")
          }

        }
      }

      updates.stars.push({
        ...star,
        starMass: newMass,
        photons: newPhotons,
        gridX: (star.gridX - vx * relDelta) % gridSpacing,
        gridY: (star.gridY - vy * relDelta) % gridSpacing,
        vx: vx,
        vy: vy,
        velocity: velocity,
      });
    }
    this.setState(updates);
  };
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function itoa(num, noFrac) {
  if (num > 1e15) {
    let oom = Math.floor(Math.log(num) / Math.log(10));
    return (num / 10 ** oom).toFixed(2) + "e" + oom;
  }
  let suffix = "";
  let base = 1;
  if (num > 1e12) {
    suffix = "T";
    base = 1e12;
  } else if (num >= 1e9) {
    suffix = "G";
    base = 1e9;
  } else if (num >= 1e6) {
    suffix = "M";
    base = 1e6;
  } else if (num >= 1e3) {
    suffix = "k";
    base = 1e3;
  } else if (noFrac) {
    return num;
  }
  return (num / base).toFixed(3) + suffix;
}
window.itoa = itoa;

export default App;
