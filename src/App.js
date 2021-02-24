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
  particlePhotons: {
    initialCost: 15,
    costMultiplier: 2.35,
    effect: 2,
    levelCap: 23,
    scalingCostMultiplier: 23.5,
  },
  particleCount: {
    initialCost: 30,
    costMultiplier: 50,
    effect: 1.5,
    levelCap: 5,
    scalingCostMultiplier: 500,
  },
  particleMass: {
    initialCost: 40,
    costMultiplier: 2,
    effect: 6,
    levelCap: 27,
    scalingCostMultiplier: 15,
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
    unlockText:
      "With a little stability, you'll have a stronger gravitational attraction.",
  },
  {
    value: 1e10,
    name: "Tuned Gravity Field",
    description: "Increase the power the of gravity field by 50%",
    unlockText:
      "Your temporary gravity field has become significantly stronger.",
  },
  {
    value: 1e15,
    name: "Permanent Gravity Field",
    description: "The temporary gravity field always applies",
    unlockText: "Your temporary gravity field seems quite misnamed now.",
  },
  {
    value: 1e20,
    name: "Ultra Gravity Field",
    description: "Increase the power the of gravity field by another 50%",
    unlockText: "Your gravity field is more attractive than ever.",
  },
  {
    value: 1e25,
    name: "Stellar Collapse",
    description: "Unlock the ability to collapse into a star",
    unlockText: "You made it. It's time to become a star.",
  },
];
const collapseTimes = {
  recolor: 2,
  shrink: 4,
  pause: 5,
  expand: 5.05,
  ring: 6,
  revel: 12,
};
const collapseLengths = {
  recolor: collapseTimes.recolor,
  shrink: collapseTimes.shrink - collapseTimes.recolor,
  pause: collapseTimes.pause - collapseTimes.shrink,
  expand: collapseTimes.expand - collapseTimes.pause,
  ring: collapseTimes.ring - collapseTimes.expand,
  revel: collapseTimes.revel - collapseTimes.ring,
};

// unlock text for each milestone
// implement level cap
// implement stellar upgrade
// TODO: velocity achievement for spedometer? or upgrade for acceleration/max velocity unlocks spedometer? remove spedometer?
// TODO: achievement for avoiding particles (means don't want to auto-grant upgrades?)
// only setState once pper gameLoop
// animate sun emitting photons
// show milestones completed on tab (or flash when completed on first run). show when upgrades available when not active (and collapse, maybe flash collapse)

// Lower priority
// TODO: Animate log/other things
// TODO: Design next layer: star clusters/nebulas/constellations
// setting to limit rendered particles
// dark starfield as background, with stars equal to number of stars created?

const logTexts = {
  opening: "The universe is dark.",
  firstPhoton:
    "Colliding with that particle emitted a photon. You're pretty sure that's not how physics works.",
  unlockUpgrades: "Looks like photons might be useful.",
  firstUpgrade: "More photons for more upgrades.",
  unlockMass:
    "More particles means faster growth. Your size isn't increasing much, but you're absorbing some mass with each collision.",
  unlockCollapse:
    "If you got big enough, you could collapse into a star. Stars are a constant source of photons.",
  firstCollapse:
    "You've become a star, and yet you realize, you are more than just this star. You are this universe, and you want to fill it with light.",
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
        unlockCollapse: false,
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
      collapsing: false,
      collapseFrame: 0,
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
    const defaultRadius =
      20 +
      (star.starRadiusFactor * Math.log(star.starMass / 10)) /
        Math.log(2000000);
    if (!star.collapsing || star.collapseFrame < collapseTimes.recolor) {
      return defaultRadius;
    }
    if (star.collapseFrame < collapseTimes.shrink) {
      return (
        defaultRadius *
        (1 -
          (0.75 * (star.collapseFrame - collapseTimes.recolor)) /
            collapseLengths.shrink)
      );
    } else if (star.collapseFrame < collapseTimes.pause) {
      return defaultRadius * 0.25;
    } else if (star.collapseFrame < collapseTimes.expand) {
      return (
        defaultRadius *
        (0.25 +
          (0.5 * (star.collapseFrame - collapseTimes.pause)) /
            collapseLengths.expand)
      );
    }
    return 0.75 * defaultRadius;
  };

  calcUpgradeCosts = (star) => {
    // TODO harsher scaling past 1e10 or something
    let costs = {};
    for (const [upgrade, props] of Object.entries(photonUpgradeDef)) {
      if (star.upgrades[upgrade] >= props.levelCap) {
        costs[upgrade] =
          props.initialCost *
          props.costMultiplier ** props.levelCap *
          props.scalingCostMultiplier **
            (star.upgrades[upgrade] - props.levelCap);
      } else {
        costs[upgrade] =
          props.initialCost * props.costMultiplier ** star.upgrades[upgrade];
      }
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
                  {s.tab === "milestones" && (
                    <div id="milestones">
                      {[
                        ...Array(
                          Math.min(
                            star.milestonesUnlocked + 1,
                            massMilestones.length
                          )
                        ).keys(),
                      ].map((_, msIndex) => {
                        return (
                          <div
                            className={
                              "milestone" +
                              (msIndex >= star.milestonesUnlocked
                                ? " disabled"
                                : "")
                            }
                          >
                            <p>
                              <span className="upgradeName">
                                {massMilestones[msIndex].name}
                              </span>
                              {" " +
                                itoa(
                                  massMilestones[msIndex].value,
                                  true,
                                  1,
                                  "g"
                                )}
                            </p>
                            <p className="upgradeDesc">
                              {massMilestones[msIndex].firstDescription &&
                              !s.collapseCount
                                ? massMilestones[msIndex].firstDescription
                                : massMilestones[msIndex].description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {s.tab === "collapse" && (
                    <div id="collapse">
                      <div
                        className={
                          "collapse button" +
                          (star.milestonesUnlocked < 5 ? " disabled" : "")
                        }
                        onClick={() => this.collapse(starIndex)}
                      >
                        <p>
                          <span className="upgradeName">Collapse into a star</span>
                        </p>
                        
                      </div>
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
      if (star.collapsing) {
        return {};
      }
      star.upgrades = { ...star.upgrades };
      if (cost > star.photons) {
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
      if (name === "particleMass") {
        star.particleRadius = (5 * star.particleMass) ** 0.3;
      }
      return updates;
    });
  };

  collapse = (starIndex) => {
    let stars = [...this.state.stars];
    let star = { ...stars[starIndex] };
    star.collapsing = true;
    star.collapseFrame = 0;
    stars[starIndex] = star;
    this.setState({
      stars: stars,
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

  getStarColor(mass, colorFrame, collapseFrame) {
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
    if (collapseFrame) {
      if (collapseFrame < collapseTimes.recolor) {
        intensity *= 1 - collapseFrame / collapseLengths.recolor;
      } else if (collapseFrame < collapseTimes.shrink) {
        intensity =
          (collapseFrame - collapseTimes.recolor) / collapseLengths.shrink;
      } else if (collapseFrame < collapseTimes.pause) {
        intensity = 1;
      } else if (collapseFrame < collapseTimes.expand) {
        intensity *=
          1 +
          0.2 *
            ((collapseFrame - collapseTimes.pause) / collapseLengths.expand);
      } else {
        intensity = 1.2;
      }
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

    ctx.fillStyle = this.getStarColor(
      star.starMass,
      field.colorFrame,
      star.collapseFrame
    );
    ctx.beginPath();
    if (star.collapsing && star.collapseFrame < collapseTimes.expand) {
      cx += getRandomInt(4) - 2;
      cy += getRandomInt(4) - 2;
    }
    ctx.arc(cx, cy, starRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "#000";
    let pCount = 0;
    let ringSize = 0,
      ringSizeSq = 0;
    if (
      star.collapsing &&
      star.collapseFrame >= collapseTimes.expand &&
      star.collapseFrame < collapseTimes.ring
    ) {
      ringSize = this.getCollapseRingSize(star.collapseFrame, starRadius);
      ringSizeSq = ringSize ** 2;
    }
    if (!star.collapsing || star.collapseFrame <= collapseTimes.ring) {
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
        if (ringSizeSq && particle.x ** 2 + particle.y ** 2 < ringSizeSq) {
          continue;
        }
        ctx.beginPath();
        ctx.arc(particle.x + cx, particle.y + cy, pRad, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    if (
      star.collapsing &&
      star.collapseFrame >= collapseTimes.expand &&
      star.collapseFrame < collapseTimes.ring
    ) {
      ctx.strokeStyle = "#ff4";
      ctx.beginPath();
      ctx.arc(
        cx,
        cy,
        this.getCollapseRingSize(star.collapseFrame, starRadius),
        0,
        2 * Math.PI
      );
      ctx.stroke();
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

  getCollapseRingSize = (collapseFrame, radius) => {
    const maxSize = Math.max(maxWidth, maxHeight) * 2;
    return (
      radius +
      ((collapseFrame - collapseTimes.expand) / collapseLengths.ring) *
        (maxSize - radius)
    );
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
      star.particleRadius =
        (0.25 * Math.log(star.particleMass)) / Math.log(8) + 3;
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
      let milestonesUnlocked = star.milestonesUnlocked;
      if (!star.collapsing && this.mouseClicked) {
        let distSq = this.mouseX * this.mouseX + this.mouseY * this.mouseY;
        let dist = distSq ** 0.5;
        let scale = 1;
        if (dist > accelerationCap) {
          scale = dist / accelerationCap;
        }

        if (
          (star.milestonesUnlocked > 0 && dist <= starRadius) ||
          star.milestonesUnlocked > 2
        ) {
          gConstant += star.mouseGravity;
          if (star.milestonesUnlocked > 1) {
            gConstant *= 1.5;
          }
          if (star.milestonesUnlocked > 3) {
            gConstant *= 1.5;
            drag *= 1.2;
          }
          drag *= star.mouseDrag;
        }
        if (dist > starRadius) {
          vx += ((mouseAcceleration * this.mouseX) / dist / scale) * relDelta;
          vy += ((mouseAcceleration * this.mouseY) / dist / scale) * relDelta;
        }
      } else {
        let vMag = (vx * vx + vy * vy) ** 0.5;
        if (star.collapsing || vMag < 10) {
          starDrag *= 5;
        }
        if (vMag < 5) {
          starDrag *= 10;
        }

        if (vMag < 3 || star.milestonesUnlocked > 2) {
          gConstant += star.mouseGravity;
          if (star.milestonesUnlocked > 1) {
            gConstant *= 1.5;
          }
          if (star.milestonesUnlocked > 3) {
            gConstant *= 1.5;
            drag *= 1.2;
          }
          drag *= star.mouseDrag;
        }
        if (vMag < 1) {
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
          let photon = {
            x: (starRadius * p.x) / dist,
            y: (starRadius * p.y) / dist,
            vx: (1200 * p.x) / dist,
            vy: (1200 * p.y) / dist,
          };

          this.genParticle(star, true, p);
          if (!updates.featureTriggers.firstPhoton) {
            updates.featureTriggers.firstPhoton = true;
            updates.logText.unshift(logTexts.firstPhoton);
          }
          if (field.photons.length < s.particleLimit) {
            field.photons.push(photon);
          }
          newPhotons += star.particlePhotons;
          if (!updates.featureTriggers.unlockUpgrades && newPhotons >= 10) {
            updates.featureTriggers.unlockUpgrades = true;
            updates.logText.unshift(logTexts.unlockUpgrades);
          }
          // Don't update mass while collapsing just in case...
          if (!star.collapsing ) {

            newMass += star.particleMass;

          }
        }
        while (
          s.featureTriggers.unlockMass &&
          milestonesUnlocked < massMilestones.length &&
          newMass >= massMilestones[milestonesUnlocked].value
        ) {
          if (
            !s.collapseCount &&
            massMilestones[milestonesUnlocked].unlockText
          ) {
            updates.logText.unshift(
              massMilestones[milestonesUnlocked].unlockText
            );
          }
          milestonesUnlocked++;
          if (
            milestonesUnlocked >= 5 &&
            !updates.featureTriggers.unlockCollapse
          ) {
            updates.featureTriggers.unlockCollapse = true;
          }
        }
      }
      if (!star.collapsing) {
        for (let i = field.particles.length; i < star.particleCount; i++) {
          field.particles.push(this.genParticle(star, false));
        }
      }
      if (star.collapsing) {
        if (star.collapseFrame >= collapseTimes.expand) {
          for (let i = field.photons.length; i < s.particleLimit; i++) {
            let angle = Math.random() * 2 * Math.PI;
            let x = starRadius * Math.cos(angle);
            let y = starRadius * Math.sin(angle);
            field.photons.push({
              x: x,
              y: y,
              vx: (1200 * x) / starRadius,
              vy: (1200 * y) / starRadius,
            });
          }
        }
        star.collapseFrame += relDelta;
        if (star.collapseFrame > collapseTimes.revel) {
          star.collapsing = false;
          updates.collapseCount++;
          updates.featureTriggers.firstCollapse = true;
          // TODO other collapse accounting like moving to completed stars and destroying field
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
        milestonesUnlocked: milestonesUnlocked,
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
