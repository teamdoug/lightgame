import "./App.css";
import React from "react";

const maxWidth = 2000;
const maxHeight = 1500;
const gridSpacing = 200;
const velocityCap = 400;
const accelerationCap = 300;
const gravity = 200000;
const mouseAcceleration = 300;
const collapseMass = 1e25;
const yellowCollapseMass = 1e33;
//const blueCollapseMass = 1e30;
const starDragConstant = 1;
const photonUpgradeDef = {
  particleCount: {
    initialCost: 30,
    costMultiplier: 50,
    effect: 1.5,
  },
  particlePhotons: {
    initialCost: 20,
    costMultiplier: 2.3,
    effect: 2,
  },
  particleMass: {
    initialCost: 40,
    costMultiplier: 2,
    effect: 7,
  },
};
const massMilestones = [
  {
    value: 10000,
    name: "Temporary Gravity Field",
    firstDescription:
      "When the mouse is inside you or you aren't moving, you attract particles more strongly",
    description:
      "When the mouse is inside the protostar or it isn't moving, it attracts particles more strongly",
  },
  {
    value: 1e10,
    name: "Tuned Gravity Field",
    description: "Particles are more strongly attracted",
  },
  {
    value: 1e15,
    name: "Permanent Gravity Field",
    description: "The temporary gravity field now always applies",
  },
  {
    value: 1e25,
    name: "Stellar Collapse",
    description: "Unlock the ability to collapse into a star",
  },
];

// TODO: Add upgrades, starting with particleCount + 50%
// TODO: Reveal mass at 12 mass? Show progress bar? Maybe progress bar later... Or an interim progress bar?
// TODO: mousegravity behind an upgrade. upgrade again for permanent. upgrades for power?
// TODO: velocity achievement for spedometer? or upgrade for acceleration/max velocity unlocks spedometer? remove spedometer?
// TODO: achievement for avoiding particles (means don't want to auto-grant upgrades?)
// Mouse gravity partially multiplicative (as an upgrade?)
// only setState once pper gameLoop
// animate sun emitting photons
// setting to limit rendered particles

// Lower priority
// TODO: Animate log/other things
// TODO: Design next layer: star clusters/nebulas
// TODO: Options to control star drag?

const logTexts = {
  opening: "The universe is dark.",
  firstPhoton:
    "Colliding with that particle emitted a photon. You're pretty sure that's not how physics works.",
  unlockUpgrades: "Looks like photons might be useful.",
  firstUpgrade: "More photons for more upgrades.",
  unlockMass:
    "More particles means faster growth. Your size isn't increasing much, but you're absorbing some mass with each collision.",
  unlockProgress:
    "If you got big enough, you could collapse into a star. Stars generate a lot of photons.",
};

class App extends React.Component {
  constructor(props) {
    super(props);
    this.lastFrame = window.performance.now();
    this.lastSave = window.performance.now();
    this.mainPanel = React.createRef();
    this.canvas = React.createRef();
    const storedState = localStorage.getItem("save");
    if (storedState) {
      this.state = JSON.parse(storedState);
    } else {
      this.state = this.getInitState();
    }
    this.fields = [];
    for (let star of this.state.stars) {
      this.fields.push(this.getInitField(star));
    }
    this.resetLocalVars();
    window.addEventListener("beforeunload", this.save);
    window.addEventListener("resize", this.resizeCanvas);
    window.app = this;
  }

  reset = () => {
    let state = this.getInitState();
    this.setState(state);
    this.fields = [];
    for (let star of state.stars) {
      this.fields.push(this.getInitField(star));
    }
  };

  resetLocalVars = () => {
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseClicked = false;
  };

  getInitState = () => {
    let state = {
      paused: false,
      stars: [this.getInitStar()],
      logText: [logTexts.opening],
      tab: "upgrades",
      particleLimit: 1000,
      featureTriggers: {
        firstPhoton: false,
        unlockUpgrades: false,
        firstUpgrade: false,
        unlockMass: false,
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
        startingParticlePhotons: 0,
      },
    };
    return state;
  };

  getInitStar = () => {
    let star = {
      photons: 0,
      starMass: 10,
      starRadiusFactor: 20,
      particleMass: 1,
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
        particlePhotons: 0,
        particleCount: 0,
        particleMass: 0,
        particleRadius: 0,
        starRadiusFactor: 0,
        permanentMouseGravity: 0,
        gravity: 0,
      },
      milestonesUnlocked: 0,
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

  calcUpgradeCosts = (star) => {
    // TODO harsher scaling past 1e10 or something
    let costs = {};
    for (const [upgrade, props] of Object.entries(photonUpgradeDef)) {
      costs[upgrade] =
        props.initialCost * props.costMultiplier ** star.upgrades[upgrade];
    }
    return costs;
  };

  render() {
    let s = this.state;
    let starIndex = 0;
    let star = s.stars[starIndex];
    let field = this.fields[starIndex];
    let ft = s.featureTriggers;
    const canvas = this.canvas.current;
    if (canvas !== null) {
      this.drawCanvas(canvas, star, field);
    }
    let starProgress =
      (100 * Math.log(star.starMass - 9)) / Math.log(collapseMass);
    if (starProgress > 100) {
      starProgress = 100;
    }
    let upgradeCosts = this.calcUpgradeCosts(star);

    return (
      <div id="verticalFlex">
        <div className="header">
          {ft.firstPhoton && (
            <span className="headerElement">
              <span className="headerValue">{itoa(star.photons, true)}</span>{" "}
              photons
            </span>
          )}
          {ft.unlockMass && (
            <span className="headerElement headerValue">
              {itoa(star.starMass, true, 1, "g")}
            </span>
          )}
          <div className="button" onClick={this.togglePause}>
            {s.paused ? "Resume" : "Pause"}
          </div>

          <div
            className="button"
            onClick={() => this.modifyStar(starIndex, "photons", 100)}
          >
            Photons
          </div>
          <div
            className="button"
            onClick={() => this.modifyStar(starIndex, "starMass", 100)}
          >
            Mass
          </div>
          <div
            className="button"
            onClick={() => this.modifyStar(starIndex, "starRadiusFactor", 1.1)}
          >
            Radius
          </div>
          <div className="button" onClick={this.reset}>
            Reset
          </div>
        </div>

        <div id="flex">
          <div className="panel" id="leftPanel">
            {/*<p>Velocity: {star.velocity.toFixed(2)}</p>*/}
            {ft.unlockUpgrades && (
              <div>
                <div className="tabs">
                  <div
                    className={
                      "tab " + (s.tab === "upgrades" ? "selected" : "")
                    }
                    onClick={() => this.setState({ tab: "upgrades" })}
                  >
                    Upgrades
                  </div>
                  {ft.unlockMass && (
                    <div
                      className={
                        "tab " + (s.tab === "milestones" ? "selected" : "")
                      }
                      onClick={() => this.setState({ tab: "milestones" })}
                    >
                      Mass Milestones
                    </div>
                  )}
                  {ft.unlockCollapse && (
                    <div
                      className={
                        "tab " + (s.tab === "collapse" ? "selected" : "")
                      }
                      onClick={() => this.setState({ tab: "collapse" })}
                    >
                      Collapse
                    </div>
                  )}
                </div>
                <div className="tabPane">
                  {s.tab === "upgrades" && (
                    <div id="upgrades">
                      <div
                        className={
                          "upgrade button" +
                          (star.photons < upgradeCosts.particlePhotons
                            ? " disabled"
                            : "")
                        }
                        onClick={() =>
                          this.buyUpgrade(
                            starIndex,
                            "particlePhotons",
                            upgradeCosts.particlePhotons
                          )
                        }
                      >
                        <p>
                          <span className="upgradeName">Particle Photons</span>
                          {" " + itoa(upgradeCosts.particlePhotons, true)}{" "}
                          photons
                        </p>
                        <p className="upgradeDesc">
                          Increase the number of photons generated by particle
                          collisions by{" "}
                          {Math.round(
                            (photonUpgradeDef.particlePhotons.effect - 1) * 100
                          )}
                          %
                        </p>
                      </div>
                      {ft.firstUpgrade && (
                        <div
                          className={
                            "upgrade button" +
                            (star.photons < upgradeCosts.particleCount
                              ? " disabled"
                              : "")
                          }
                          onClick={() =>
                            this.buyUpgrade(
                              starIndex,
                              "particleCount",
                              upgradeCosts.particleCount
                            )
                          }
                        >
                          <p>
                            <span className="upgradeName">Particle Count</span>
                            {" " + itoa(upgradeCosts.particleCount, true)}{" "}
                            photons
                          </p>
                          <p className="upgradeDesc">
                            Increase the number of particles in the field by{" "}
                            {Math.round(
                              (photonUpgradeDef.particleCount.effect - 1) * 100
                            )}
                            %
                          </p>
                        </div>
                      )}
                      {ft.unlockMass && (
                        <div
                          className={
                            "upgrade button" +
                            (star.photons < upgradeCosts.particleMass
                              ? " disabled"
                              : "")
                          }
                          onClick={() =>
                            this.buyUpgrade(
                              starIndex,
                              "particleMass",
                              upgradeCosts.particleMass
                            )
                          }
                        >
                          <p>
                            <span className="upgradeName">Particle Mass</span>
                            {" " + itoa(upgradeCosts.particleMass, true)}{" "}
                            photons
                          </p>
                          <p className="upgradeDesc">
                            Increase the mass of particles in the field by{" "}
                            {Math.round(
                              (photonUpgradeDef.particleMass.effect - 1) * 100
                            )}
                            %
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div id="log">
              {s.logText.map((value, index) => (
                <p key={s.logText.length - index}>{value}</p>
              ))}
            </div>
          </div>
          <div ref={this.mainPanel} className="panel" id="mainPanel">
            <canvas
              className="starfield"
              ref={this.canvas}
              onMouseMove={this.mouseMove}
              onMouseDown={this.mouseMove}
              onMouseUp={this.mouseMove}
              onMouseLeave={this.mouseMove}
            ></canvas>
          </div>
        </div>
        {ft.unlockProgress && (
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
              {starProgress.toFixed(2)}% to Stellar Mass ({itoa(collapseMass)}g)
            </div>
          </div>
        )}
      </div>
    );
  }

  buyUpgrade = (starIndex, name, cost) => {
    this.setState((state) => {
      let stars = [...state.stars];
      let star = { ...state.stars[starIndex] };
      star.upgrades = { ...star.upgrades };
      if (cost > star.photons) {
        console.log("not buying");
        return {};
      }
      star.photons -= cost;
      star.upgrades[name] += 1;
      star[name] = Math.floor(star[name] * photonUpgradeDef[name].effect);
      stars[starIndex] = star;
      let updates = { stars: stars };
      if (!state.featureTriggers.firstUpgrade) {
        updates.featureTriggers = { ...state.featureTriggers };
        updates.featureTriggers.firstUpgrade = true;
        updates.logText = [...state.logText];
        updates.logText.unshift(logTexts.firstUpgrade);
      } else if (
        name === "particleCount" &&
        !state.featureTriggers.unlockMass
      ) {
        updates.featureTriggers = { ...state.featureTriggers };
        updates.featureTriggers.unlockMass = true;
        updates.logText = [...state.logText];
        updates.logText.unshift(logTexts.unlockMass);
      }
      return updates;
    });
  };

  modifyStar = (starIndex, prop, increase) => {
    let stars = [...this.state.stars];
    let star = { ...stars[starIndex] };
    star[prop] = star[prop] * increase + 1;
    stars[starIndex] = star;
    this.setState({
      stars: stars,
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
    ctx.fillStyle = "#484848";
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
    let pCount = 0;
    for (const particle of field.particles) {
      pCount++;
      if (pCount > this.state.particleLimit) {
        break;
      }
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
      let field = this.fields[index];
      let starRadius = this.getStarRadius(star);
      let [leftEdge, topEdge] = [
        -maxWidth / 2 - star.particleRadius,
        -maxHeight / 2 - star.particleRadius,
      ];
      let [rightEdge, bottomEdge] = [-leftEdge, -topEdge];
      field.colorFrame = (field.colorFrame + relDelta) % 10;
      let gConstant = (gravity * Math.log(star.starMass)) / Math.log(20);
      let newMass = star.starMass;
      let newPhotons = star.photons;
      let vx = star.vx;
      let vy = star.vy;
      let velocity = star.velocity;
      let drag = dragConstant;
      let starDrag = starDragConstant;
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
        if (vMag < 10) {
          starDrag *= 5;
        }
        if (vMag < 5) {
          starDrag *= 10;
        }
        if (vMag < 1) {
          vx = vy = 0;
          gConstant += star.mouseGravity;
          drag *= star.mouseDrag;
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
      for (let p of field.photons) {
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
      field.photons = newDrawPhotons;

      for (let p of field.particles) {
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
          if (field.photons.length < s.particleLimit) {
            field.photons.push({
              x: (starRadius * p.x) / dist,
              y: (starRadius * p.y) / dist,
              vx: (1200 * p.x) / dist,
              vy: (1200 * p.y) / dist,
            });
          }
          this.genParticle(star, true, p);
          if (!updates.featureTriggers.firstPhoton) {
            updates.featureTriggers.firstPhoton = true;
            updates.logText.unshift(logTexts.firstPhoton);
          }
          newMass += star.particleMass;
          newPhotons += star.particlePhotons;
          if (!updates.featureTriggers.unlockUpgrades && newPhotons >= 10) {
            updates.featureTriggers.unlockUpgrades = true;
            updates.logText.unshift(logTexts.unlockUpgrades);
          }
        }
      }
      for (let i = field.particles.length; i < star.particleCount; i++) {
        field.particles.push(this.genParticle(star, false));
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

function itoa(num, noFrac, noFracFixed, unitSuffix = "") {
  if (num > 1e15) {
    let oom = Math.floor(Math.log(num) / Math.log(10));
    return (num / 10 ** oom).toFixed(2) + "e" + oom + unitSuffix;
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
    if (noFracFixed) {
      return num.toFixed(noFracFixed) + unitSuffix;
    }
    return num.toFixed(0) + unitSuffix;
  }
  return (num / base).toFixed(3) + suffix + unitSuffix;
}
window.itoa = itoa;

export default App;
