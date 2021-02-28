import "./App.css";
import React from "react";
import { hsluvToHex } from "hsluv";

const debug = false;
const maxWidth = 2000;
const maxHeight = 1500;
const centerX = maxWidth / 2;
const centerY = maxHeight / 2;
const gridSpacing = 200;
const velocityCap = 400;
const accelerationCap = 300;
const gravity = 200000;
const mouseAcceleration = 300;
const collapseMass = 1e25;
const yellowCollapseMass = 1e31;
const whiteCollapseMass = 1e36;
const blueCollapseMass = 1e40;
const starDragConstant = 1;
const photonUpgradeDef = {
  particlePhotons: {
    initialCost: 15,
    costMultiplier: 2.35,
    effect: 2,
    levelCap: 23,
    scalingLevel: 23,
    scalingCostExponent: 1.25,
    improvedScalingCostExponent: 1.2,
  },
  particleCount: {
    initialCost: 30,
    costMultiplier: 50,
    effect: 1.5,
    levelCap: 6,
    scalingLevel: 6,
    scalingCostExponent: 2.8,
    improvedScalingCostExponent: 2.6,
  },
  particleMass: {
    initialCost: 40,
    costMultiplier: 2,
    effect: 6,
    levelCap: 27,
    scalingLevel: 27,
    scalingCostExponent: 1.35,
    improvedScalingCostExponent: 1.3,
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
    value: collapseMass,
    name: "Stellar Collapse",
    description: "Unlock the ability to collapse into a star",
    unlockText: "You made it. It's time to become a star.",
  },
];
const interstellarUpgradeDef = [
  {
    id: "bonusParticlePhotons",
    name: "Bonus Particle Photon Upgrades",
    description: "Provides a free Particle Photon upgrade to each protostar",
    initialCost: 15,
    costMultiplier: 30,
    scalingLevel: 10,
    scalingCostMultiplier: 200,
  },
  {
    id: "permanentMilestones",
    name: "Permanent Protostar Mass Milestones",
    description:
      "Permanently unlock a protostar mass milestone for each level of this upgrade",
    initialCost: 150,
    costMultiplier: 50,
    levelCap: 4,
  },
  {
    id: "bonusParticleMass",
    name: "Bonus Particle Mass Upgrades",
    description: "Provides a free Particle Mass upgrade to each protostar",
    initialCost: 1e11,
    costMultiplier: 20,
    scalingLevel: 10,
    scalingCostMultiplier: 200,
  },
];
const stellarMassMilestones = [
  {
    value: collapseMass,
    name: "Continued Growth",
    description:
      "Protostar photon upgrades no longer have a level cap, but they get much more expensive after the previous cap",
  },
  {
    value: 1e6 * collapseMass,
    name: "Second Protostar",
    description: "You can now develop two protostars simultaneously",
  },
  {
    value: 5e7 * collapseMass,
    name: "Unlock Bonus Particle Mass",
    description:
      "Unlock an interstellar upgrade to give bonus levels to particle mass",
  },
  {
    value: 1e13 * collapseMass, // todo balance this
    name: "Improve Protostar Upgrade Scaling",
    description:
      "Slightly reduces the rate at which protostar upgrades get more expensive",
  },
];
const stellarMilestones = [
  {
    value: 1,
    name: "Buy Max",
    description: "Buying photon upgrades now buys as many as possible",
  },
  {
    value: 2,
    name: "Auto Protostar Creation",
    description:
      "New protostars are automatically created when you collapse one",
  },
  {
    value: 3,
    name: "Autobuyers",
    description: "You can enable autobuyers for protostar photon upgrades",
  },
  {
    value: 5,
    name: "Faster Collapse",
    description: "Speed up the star collapse animation",
  },

  {
    value: 12,
    name: "Auto-Collapse",
    description: "You can set protostars to auto-collapse",
  },
  {
    value: 40,
    name: "Particles Spawn inside Field",
    description:
      "Particles now spawn inside the field instead of outside the edge",
  },
  {
    value: 120,
    name: "Buying Particle Mass Upgrade Simulates Particle Collision",
    description:
      "Whenever you buy a Particle Mass upgrade, the protostar grows as if a particle collided",
  },
  {
    value: 180,
    name: "Faster Auto-Collapse",
    description: "Auto-collapse animations take half the time",
  },
  {
    value: 250,
    name: "Instant Auto-Collapse",
    description:
      "When a protostar auto-collapses, it no longer has any animation",
  },
];

const slowCollapseTimes = {
  recolor: 2,
  shrink: 4,
  pause: 5,
  expand: 5.05,
  ring: 6,
  revel: 7,
  background: 9,
};

const fastCollapseTimes = {
  recolor: 0.5,
  shrink: 1,
  pause: 1.5,
  expand: 1.55,
  ring: 2,
  revel: 2.5,
  background: 2.5,
};

const fastestCollapseTimes = {
  recolor: 0.25,
  shrink: 0.5,
  pause: 0.75,
  expand: 0.8,
  ring: 1,
  revel: 1.25,
  background: 1.25,
};

const slowCollapseLengths = {
  recolor: slowCollapseTimes.recolor,
  shrink: slowCollapseTimes.shrink - slowCollapseTimes.recolor,
  pause: slowCollapseTimes.pause - slowCollapseTimes.shrink,
  expand: slowCollapseTimes.expand - slowCollapseTimes.pause,
  ring: slowCollapseTimes.ring - slowCollapseTimes.expand,
  revel: slowCollapseTimes.revel - slowCollapseTimes.ring,
  background: slowCollapseTimes.background - slowCollapseTimes.revel,
};
const fastCollapseLengths = {
  recolor: fastCollapseTimes.recolor,
  shrink: fastCollapseTimes.shrink - fastCollapseTimes.recolor,
  pause: fastCollapseTimes.pause - fastCollapseTimes.shrink,
  expand: fastCollapseTimes.expand - fastCollapseTimes.pause,
  ring: fastCollapseTimes.ring - fastCollapseTimes.expand,
  revel: fastCollapseTimes.revel - fastCollapseTimes.ring,
  background: fastCollapseTimes.background - fastCollapseTimes.revel,
};
const fastestCollapseLengths = {
  recolor: fastestCollapseTimes.recolor,
  shrink: fastestCollapseTimes.shrink - fastestCollapseTimes.recolor,
  pause: fastestCollapseTimes.pause - fastestCollapseTimes.shrink,
  expand: fastestCollapseTimes.expand - fastestCollapseTimes.pause,
  ring: fastestCollapseTimes.ring - fastestCollapseTimes.expand,
  revel: fastestCollapseTimes.revel - fastestCollapseTimes.ring,
  background: fastestCollapseTimes.background - fastestCollapseTimes.revel,
};
// todo remove
//const slowCollapseTimes = fastCollapseTimes;
//const slowCollapseLengths = fastCollapseLengths;

// only setState once per gameLoop and take state as argument
// show milestones completed on tab (or flash when completed on first run). show when upgrades available when not active (and collapse, maybe flash collapse)
// math descriptions
// stats page (or show # of stars on stellar milestones) - instead of create protostar button
// hotkeys
// move interstellar photons and maybe other things to top header
// test in chrome

// Lower priority
// TODO: Animate log/other things
// setting to limit rendered particles
// better itoa including truncing or rounding up
// TODO: velocity achievement for spedometer? or upgrade for acceleration/max velocity unlocks spedometer? remove spedometer?
// TODO: achievement for avoiding particles (means don't want to auto-grant upgrades?)
// refactor photon upgrades
// turn completedStars into something indexed by size and counts

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
    this.backgroundCanvas = React.createRef();
    this.offscreenCanvas = document.createElement("canvas");
    this.offscreenCanvas.width = maxWidth;
    this.offscreenCanvas.height = maxHeight;
    this.drewBackground = false;
    this.confirmingReset = false;
    this.width = 0;
    const storedState = localStorage.getItem("universeIsDarkSave");
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
    if (debug) {
      window.app = this;
    }
  }

  reset = () => {
    this.confirmingReset = false;
    let state = this.getInitState();
    this.setState(state, this.resizeCanvas);
    this.fields = [];
    for (let star of state.stars) {
      this.fields.push(this.getInitField(star));
    }
    let canvas = this.offscreenCanvas;
    if (canvas) {
      let [w, h] = [canvas.width, canvas.height];
      let [cx, cy] = [w / 2, h / 2];
      const ctx = canvas.getContext("2d", { alpha: false });
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      for (const compStar of state.interstellar.completedStars) {
        ctx.fillStyle = compStar.color;
        ctx.beginPath();
        ctx.arc(
          compStar.x + cx,
          compStar.y + cy,
          compStar.radius,
          0,
          2 * Math.PI
        );
        ctx.fill();
      }
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
      stars: [],
      logText: [logTexts.opening],
      headerTab: "protostar",
      interstellarTab: "info",
      tab: "upgrades",
      particleLimit: 1000,
      won: false,
      gameLength: 0,
      adjustingParticles: false,
      interstellar: {
        completedStars: [],
        completedConstellations: [],
        completedGalaxies: [],
        photons: 0,
        upgrades: {
          bonusParticlePhotons: 0,
          permanentMilestones: 0,
          bonusParticleMass: 0,
        },
        milestonesUnlocked: 0,
        stellarMilestonesUnlocked: 0,
        collapseCount: 0,
        interstellarMass: 0,
        interstellarPhotonIncome: 0,
      },
      featureTriggers: {
        firstPhoton: false,
        unlockUpgrades: false,
        firstUpgrade: false,
        unlockMass: false,
        unlockCollapse: false,
        firstCollapse: false,
      },
      autocollapsersEnabled: [false, false],
      autobuyersEnabled: [
        {
          particlePhotons: false,
          particleCount: false,
          particleMass: false,
        },
        {
          particlePhotons: false,
          particleCount: false,
          particleMass: false,
        },
      ],
    };
    state.stars.push(this.getInitStar(state));
    return state;
  };

  getInitStar = (state) => {
    let interstellar = state.interstellar;
    let star = {
      photons: 0,
      starMass: 10,
      starRadiusFactor: 20,
      particleMass:
        2 *
        photonUpgradeDef.particleMass.effect **
          interstellar.upgrades.bonusParticleMass,
      particleRadius: 3,
      particleCount: 50,
      particlePhotons:
        1 *
        photonUpgradeDef.particlePhotons.effect **
          interstellar.upgrades.bonusParticlePhotons,
      backgroundX: 0,
      backgroundY: 0,
      vx: 0,
      vy: 0,
      collapseVX: 0,
      collapseVY: 0,
      completedX: 0,
      completedY: 0,
      gridX: 0,
      gridY: 0,
      velocity: 0,
      mouseGravity: 1000000,
      mouseDrag: 0.1,
      collapseTimes: slowCollapseTimes,
      collapseLengths: slowCollapseLengths,
      upgrades: {
        particlePhotons: 0,
        particleCount: 0,
        particleMass: 0,
        particleRadius: 0,
        starRadiusFactor: 0,
        permanentMouseGravity: 0,
        gravity: 0,
      },
      milestonesUnlocked: interstellar.upgrades.permanentMilestones,
      collapsing: false,
      collapseFrame: 0,
      lifetime: 0,
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

  getStarRadius = (star, collapseTimes, collapseLengths) => {
    let logFactor = 2000000
    if (this.width < 500) {
      logFactor *= 2000;
    } 
    if (this.width < 300) {
      logFactor *= 2000;
    } 
    const defaultRadius =
      20 +
      (star.starRadiusFactor * Math.log(star.starMass / 10)) /
        Math.log(logFactor);
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
    } else if (star.collapseFrame < collapseTimes.revel) {
      return 0.75 * defaultRadius;
    } else {
      let startRadius = 0.75 * defaultRadius;
      let finalRadius = this.getCollapsedRadius(star);
      return (
        startRadius +
        ((finalRadius - startRadius) *
          (star.collapseFrame - collapseTimes.revel)) /
          collapseLengths.background
      );
    }
  };

  calcUpgradeCosts = (star, state) => {
    let costs = {};
    for (const [upgrade, props] of Object.entries(photonUpgradeDef)) {
      let cost;
      let scalingCostExponent = props.scalingCostExponent;
      if (state.interstellar.milestonesUnlocked >= 4) {
        scalingCostExponent = props.improvedScalingCostExponent;
      }
      if (star.upgrades[upgrade] >= props.scalingLevel) {
        cost =
          props.initialCost *
          props.costMultiplier ** props.scalingLevel *
          props.costMultiplier **
            ((star.upgrades[upgrade] - props.scalingLevel) **
              scalingCostExponent);
      } else {
        cost =
          props.initialCost * props.costMultiplier ** star.upgrades[upgrade];
      }
      costs[upgrade] = {
        cost: cost,
        capped:
          star.upgrades[upgrade] >= props.levelCap &&
          state.interstellar.milestonesUnlocked < 1,
      };
    }
    return costs;
  };

  calcInterstellarUpgradeCosts = (state) => {
    let costs = {};
    let upgrades = state.interstellar.upgrades;
    for (const props of interstellarUpgradeDef) {
      let cost;
      if (upgrades[props.id] >= props.scalingLevel) {
        cost =
          props.initialCost *
          props.costMultiplier ** props.scalingLevel *
          props.scalingCostMultiplier **
            (upgrades[props.id] - props.scalingLevel);
      } else {
        cost = props.initialCost * props.costMultiplier ** upgrades[props.id];
      }
      costs[props.id] = {
        cost: cost,
        capped: upgrades[props.id] >= props.levelCap,
      };
    }
    return costs;
  };

  render() {
    let s = this.state;
    let starIndex = 0;
    let star = s.stars[starIndex];
    let field = this.fields[starIndex];
    let ft = s.featureTriggers;

    let upgradeCosts, interstellarUpgradeCosts;
    if (s.headerTab === "protostar") {
      upgradeCosts = this.calcUpgradeCosts(star, s);
    } else if (s.headerTab === "protostar2") {
      starIndex = 1;
      star = s.stars[starIndex];
      field = this.fields[starIndex];
      upgradeCosts = this.calcUpgradeCosts(star, s);
    } else {
      if (s.headerTab === "protostar") {
        console.log("Accidentally on protostar tab");
        s.headerTab = "interstellar";
      }
      interstellarUpgradeCosts = this.calcInterstellarUpgradeCosts(s);
      //console.log('costs',interstellarUpgradeCosts);
    }
    let showProtostar =
      s.headerTab === "protostar" || s.headerTab === "protostar2";
    const canvas = this.canvas.current;

    if (canvas !== null && showProtostar) {
      this.drawCanvas(
        canvas,
        this.offscreenCanvas,
        star,
        field,
        s.interstellar,
        s.autocollapsersEnabled[starIndex]
      );
    }
    const bgCanvas = this.backgroundCanvas.current;
    if (bgCanvas !== null && s.headerTab === "interstellar") {
      let [w, h] = [bgCanvas.width, bgCanvas.height];
      let [cx, cy] = [w / 2, h / 2];
      var bgContext = bgCanvas.getContext("2d", { alpha: false });

      bgContext.drawImage(
        this.offscreenCanvas,
        centerX - cx,
        centerY - cy,
        w,
        h,
        0,
        0,
        w,
        h
      );
    }

    let winProgress =
      (100 * Math.log(s.interstellar.interstellarPhotonIncome)) /
      Math.log(1e25);
    if (winProgress > 100) {
      winProgress = 100;
    }
    let secondProtostar = s.interstellar.milestonesUnlocked >= 2;
    let autobuyersEnabled = s.interstellar.stellarMilestonesUnlocked >= 3;

    return (
      <div id="verticalFlex">
        <div className="header">
          <div className="headerTabs">
            {ft.firstCollapse && (
              <>
                <div
                  className={
                    "button " +
                    (s.stars.length === 0 ? "disabled " : "") +
                    (s.headerTab === "protostar" ? "selected " : "")
                  }
                  onClick={() => {
                    if (s.stars.length === 0) {
                      return;
                    }
                    this.setState(
                      { headerTab: "protostar" },
                      this.resizeCanvas
                    );
                  }}
                >
                  Protostar{secondProtostar && " #1"}
                </div>
                {secondProtostar && (
                  <div
                    className={
                      "button " +
                      (s.stars.length === 0 ? "disabled " : "") +
                      (s.headerTab === "protostar2" ? "selected " : "")
                    }
                    onClick={() => {
                      if (s.stars.length === 0) {
                        return;
                      }
                      this.setState(
                        { headerTab: "protostar2" },
                        this.resizeCanvas
                      );
                    }}
                  >
                    Protostar #2
                  </div>
                )}
                <div
                  className={
                    "button " +
                    (s.headerTab === "interstellar" ? "selected " : "")
                  }
                  onClick={() =>
                    this.setState(
                      { headerTab: "interstellar" },
                      this.resizeCanvas
                    )
                  }
                >
                  Interstellar
                </div>
              </>
            )}
          </div>

          <div className="headerButtons">
            {this.state.adjustingParticles ? (
              <>
                Particle Render Limit: {this.state.particleLimit}
                <input
                  type="range"
                  min="50"
                  max="1000"
                  value={this.state.particleLimit}
                  onChange={(e) => {
                    this.setState({ particleLimit: e.target.value });
                    e.preventDefault();
                  }}
                />
                <div
                  className="button"
                  onClick={() => this.setState({ adjustingParticles: false })}
                >
                  OK
                </div>
              </>
            ) : (
              <div
                className="button"
                onClick={() => this.setState({ adjustingParticles: true })}
              >
                Settings
              </div>
            )}
            <div className="button" onClick={this.togglePause}>
              {s.paused ? "Resume" : "Pause"}
            </div>
            {debug && (
              <>
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
                  onClick={() => this.preCollapseStar(starIndex)}
                >
                  Pre-Collapse
                </div>
              </>
            )}
            {this.confirmingReset ? (
              <>
                <div className="button" onClick={this.reset}>
                  Confirm Reset
                </div>
                <div
                  className="button"
                  onClick={() => {
                    this.confirmingReset = false;
                  }}
                >
                  Cancel Reset
                </div>
              </>
            ) : (
              <div
                className="button"
                onClick={() => {
                  this.confirmingReset = true;
                }}
              >
                Reset
              </div>
            )}
          </div>
        </div>

        <div id="flex">
          <div className="panel" id="leftPanel">
            {showProtostar && (
              <>
                <div className="panelHeader">
                  {ft.firstPhoton && (
                    <span className="headerElement">
                      <span className="headerValue">
                        {itoa(star.photons, true)}
                      </span>{" "}
                      photon{star.photons > 1 ? "s" : ""}
                    </span>
                  )}
                  {ft.unlockMass && (
                    <span className="headerElement headerValue">
                      {itoa(star.starMass, true, 1, "g")}
                    </span>
                  )}
                </div>
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
                    </div>
                    <div className="tabPane">
                      {s.tab === "upgrades" && (
                        <>
                          <div id="upgrades">
                            <div className="wrapper">
                              <div
                                style={{
                                  flexBasis: autobuyersEnabled ? "80%" : "100%",
                                }}
                                className={
                                  "upgrade button" +
                                  (upgradeCosts.particlePhotons.capped ||
                                  star.photons <
                                    upgradeCosts.particlePhotons.cost
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
                                  <span className="upgradeName">
                                    Particle Photons
                                  </span>{" "}
                                  {upgradeCosts.particlePhotons.capped
                                    ? "Max Level"
                                    : itoa(
                                        upgradeCosts.particlePhotons.cost,
                                        true
                                      ) + " photons"}
                                </p>
                                <p className="upgradeDesc">
                                  Increase the number of photons generated by
                                  particle collisions by{" "}
                                  {Math.round(
                                    (photonUpgradeDef.particlePhotons.effect -
                                      1) *
                                      100
                                  )}
                                  %
                                </p>
                              </div>
                              {autobuyersEnabled && (
                                <div
                                  className={
                                    "autobuyer button " +
                                    (s.autobuyersEnabled[starIndex]
                                      .particlePhotons
                                      ? "enabled"
                                      : "")
                                  }
                                  onClick={() =>
                                    this.toggleAutobuyer(
                                      starIndex,
                                      "particlePhotons"
                                    )
                                  }
                                >
                                  <p>Autobuy</p>
                                </div>
                              )}
                            </div>
                            {ft.firstUpgrade && (
                              <div className="wrapper">
                                <div
                                  style={{
                                    flexBasis: autobuyersEnabled
                                      ? "80%"
                                      : "100%",
                                  }}
                                  className={
                                    "upgrade button" +
                                    (upgradeCosts.particleCount.capped ||
                                    star.photons <
                                      upgradeCosts.particleCount.cost
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
                                    <span className="upgradeName">
                                      Particle Count
                                    </span>{" "}
                                    {upgradeCosts.particleCount.capped
                                      ? "Max Level"
                                      : itoa(
                                          upgradeCosts.particleCount.cost,
                                          true
                                        ) + " photons"}
                                  </p>
                                  <p className="upgradeDesc">
                                    Increase the number of particles in the
                                    field by{" "}
                                    {Math.round(
                                      (photonUpgradeDef.particleCount.effect -
                                        1) *
                                        100
                                    )}
                                    %
                                  </p>
                                </div>
                                {autobuyersEnabled && (
                                  <div
                                    className={
                                      "autobuyer button " +
                                      (s.autobuyersEnabled[starIndex]
                                        .particleCount
                                        ? "enabled"
                                        : "")
                                    }
                                    onClick={() =>
                                      this.toggleAutobuyer(
                                        starIndex,
                                        "particleCount"
                                      )
                                    }
                                  >
                                    <p>Autobuy</p>
                                  </div>
                                )}
                              </div>
                            )}
                            {ft.unlockMass && (
                              <div className="wrapper">
                                <div
                                  style={{
                                    flexBasis: autobuyersEnabled
                                      ? "80%"
                                      : "100%",
                                  }}
                                  className={
                                    "upgrade button" +
                                    (upgradeCosts.particleMass.capped ||
                                    star.photons <
                                      upgradeCosts.particleMass.cost
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
                                    <span className="upgradeName">
                                      Particle Mass
                                    </span>{" "}
                                    {upgradeCosts.particleMass.capped
                                      ? "Max Level"
                                      : itoa(
                                          upgradeCosts.particleMass.cost,
                                          true
                                        ) + " photons"}
                                  </p>
                                  <p className="upgradeDesc">
                                    Increase the mass of particles in the field
                                    by{" "}
                                    {Math.round(
                                      (photonUpgradeDef.particleMass.effect -
                                        1) *
                                        100
                                    )}
                                    %
                                  </p>
                                </div>
                                {autobuyersEnabled && (
                                  <div
                                    className={
                                      "autobuyer button " +
                                      (s.autobuyersEnabled[starIndex]
                                        .particleMass
                                        ? "enabled"
                                        : "")
                                    }
                                    onClick={() =>
                                      this.toggleAutobuyer(
                                        starIndex,
                                        "particleMass"
                                      )
                                    }
                                  >
                                    <p>Autobuy</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          {ft.unlockCollapse && (
                            <div id="collapse">
                              <div
                                className={
                                  "collapse button" +
                                  (star.milestonesUnlocked < 5 ||
                                  star.collapsing
                                    ? " disabled"
                                    : "")
                                }
                                onClick={() => this.collapse(starIndex)}
                              >
                                <p>
                                  <span className="upgradeName">
                                    Collapse into a star
                                  </span>
                                </p>
                              </div>
                            </div>
                          )}
                          {s.interstellar.stellarMilestonesUnlocked >= 5 && (
                            <div id="autocollapse">
                              <div className="autocollapseWrapper">
                                <div
                                  className={
                                    "button autocollapser " +
                                    (s.autocollapsersEnabled[starIndex]
                                      ? "enabled"
                                      : "")
                                  }
                                  onClick={() =>
                                    this.toggleAutocollapser(starIndex)
                                  }
                                >
                                  Auto-collapse
                                </div>
                              </div>
                            </div>
                          )}
                        </>
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
                                key={msIndex}
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
                                  !ft.firstCollapse
                                    ? massMilestones[msIndex].firstDescription
                                    : massMilestones[msIndex].description}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {!ft.firstCollapse && (
                  <div id="log">
                    {s.logText.map((value, index) => (
                      <p key={s.logText.length - index}>{value}</p>
                    ))}
                  </div>
                )}
              </>
            )}
            {s.headerTab === "interstellar" && (
              <>
                <div className="panelHeader">
                  <div className="headerElement">
                    <span className="headerValue">
                      {itoa(s.interstellar.photons, true)}
                    </span>{" "}
                    interstellar photon{s.interstellar.photons > 1 ? "s" : ""}{" "}
                    (+
                    {itoa(s.interstellar.interstellarPhotonIncome, true)}/s)
                  </div>{" "}
                  <div className="headerElement headerValue">
                    {itoa(s.interstellar.interstellarMass, true, 1, "g")}
                  </div>
                  {s.interstellar.collapseCount > 1 && (
                    <div className="headerElement">
                      {" "}
                      <span className="headerValue">
                        {itoa(s.interstellar.collapseCount, true)}
                      </span>{" "}
                      stars
                    </div>
                  )}
                </div>

                <div>
                  <div className="tabs">
                    <div
                      className={
                        "tab " +
                        (s.interstellarTab === "info" ? "selected" : "")
                      }
                      onClick={() => this.setState({ interstellarTab: "info" })}
                    >
                      Info
                    </div>
                    <div
                      className={
                        "tab " +
                        (s.interstellarTab === "upgrades" ? "selected" : "")
                      }
                      onClick={() =>
                        this.setState({ interstellarTab: "upgrades" })
                      }
                    >
                      Upgrades
                    </div>
                    <div
                      className={
                        "tab " +
                        (s.interstellarTab === "milestones" ? "selected" : "")
                      }
                      onClick={() =>
                        this.setState({ interstellarTab: "milestones" })
                      }
                    >
                      Mass Milestones
                    </div>
                    <div
                      className={
                        "tab " +
                        (s.interstellarTab === "stellarMilestones"
                          ? "selected"
                          : "")
                      }
                      onClick={() =>
                        this.setState({ interstellarTab: "stellarMilestones" })
                      }
                    >
                      Stellar Milestones
                    </div>
                    {s.won && (
                      <div
                        className={
                          "tab " +
                          (s.interstellarTab === "victory" ? "selected" : "")
                        }
                        onClick={() =>
                          this.setState({ interstellarTab: "victory" })
                        }
                      >
                        Victory
                      </div>
                    )}
                  </div>
                  <div className="tabPane">
                    {s.interstellarTab === "info" && (
                      <>
                        <p>
                          You've become a star, and yet you realize, you are
                          more than just this star. You are this universe, and
                          you want to fill it with light. By creating new
                          protostars, you can continue creating new stars.
                        </p>
                        <p>
                          Each star you create generates interstellar photons
                          based on its mass and the number of stars you've
                          created. These interstellar photons can be used to buy
                          powerful upgrades and also provide a small income to
                          new protostars. Additionally, reaching stellar mass
                          milestones and stellar count milestones will provide
                          further boosts.
                        </p>
                        <p>
                          If you were generating 1e25 interstellar photons per
                          second, that would be enough to light up the universe.
                        </p>
                        <p>Good luck!</p>
                        {s.interstellar.stellarMilestonesUnlocked < 2 && (
                          <div
                            className={
                              "collapse button" +
                              (s.stars.length > 0 ? " disabled" : "")
                            }
                            onClick={() => this.createProtostar()}
                          >
                            <p>
                              <span className="upgradeName">
                                Create New Protostar
                              </span>
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    {s.interstellarTab === "upgrades" && (
                      <div id="upgrades">
                        {interstellarUpgradeDef.map((upgradeDef) => {
                          if (
                            upgradeDef.id === "bonusParticleMass" &&
                            s.interstellar.milestonesUnlocked < 3
                          ) {
                            return (
                              <React.Fragment
                                key={upgradeDef.id}
                              ></React.Fragment>
                            );
                          }
                          return (
                            <div
                              className={
                                "interstellar upgrade button" +
                                (interstellarUpgradeCosts[upgradeDef.id]
                                  .capped ||
                                s.interstellar.photons <
                                  interstellarUpgradeCosts[upgradeDef.id].cost
                                  ? " disabled"
                                  : "")
                              }
                              key={upgradeDef.id}
                              onClick={() =>
                                this.buyInterstellarUpgrade(
                                  upgradeDef.id,
                                  interstellarUpgradeCosts[upgradeDef.id]
                                )
                              }
                            >
                              <p>
                                <span className="upgradeName">
                                  {upgradeDef.name}
                                </span>{" "}
                                {interstellarUpgradeCosts[upgradeDef.id].capped
                                  ? "Max Level"
                                  : itoa(
                                      interstellarUpgradeCosts[upgradeDef.id]
                                        .cost,
                                      true
                                    ) + " interstellar photons"}
                              </p>
                              <p className="upgradeDesc">
                                {upgradeDef.description}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {s.interstellarTab === "milestones" && (
                      <div id="milestones">
                        {[
                          ...Array(
                            Math.min(
                              s.interstellar.milestonesUnlocked + 1,
                              stellarMassMilestones.length
                            )
                          ).keys(),
                        ].map((_, msIndex) => {
                          let milestone = stellarMassMilestones[msIndex];
                          return (
                            <div
                              className={
                                "milestone" +
                                (msIndex >= s.interstellar.milestonesUnlocked
                                  ? " disabled"
                                  : "")
                              }
                              key={msIndex}
                            >
                              <p>
                                <span className="upgradeName">
                                  {milestone.name}
                                </span>
                                {" " + itoa(milestone.value, true, 1, "g")}
                              </p>
                              <p className="upgradeDesc">
                                {milestone.description}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {s.interstellarTab === "stellarMilestones" && (
                      <div id="milestones">
                        {[
                          ...Array(
                            Math.min(
                              s.interstellar.stellarMilestonesUnlocked + 1,
                              stellarMilestones.length
                            )
                          ).keys(),
                        ].map((_, msIndex) => {
                          let milestone = stellarMilestones[msIndex];
                          return (
                            <div
                              className={
                                "milestone" +
                                (msIndex >=
                                s.interstellar.stellarMilestonesUnlocked
                                  ? " disabled"
                                  : "")
                              }
                              key={msIndex}
                            >
                              <p>
                                <span className="upgradeName">
                                  {milestone.name}
                                </span>
                                {" " +
                                  itoa(
                                    Math.min(
                                      milestone.value,
                                      s.interstellar.collapseCount
                                    ),
                                    true
                                  ) +
                                  "/" +
                                  itoa(milestone.value, true) +
                                  " star" +
                                  (milestone.value > 1 ? "s" : "")}
                              </p>
                              <p className="upgradeDesc">
                                {milestone.description}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {s.interstellarTab === "victory" && (
                      <>
                        <h2>The universe is bright.</h2>
                        <p>
                          Congratulations! You won in{" "}
                          {itoa(s.gameLength / 60, true, 1)} minutes. Thanks for
                          playing!
                        </p>
                        <p>
                          You can keep playing, but the star field is capped at
                          20k stars, and progress gets very slow.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          <div ref={this.mainPanel} className="panel" id="mainPanel">
            {showProtostar && (
              <canvas
                className="starfield"
                ref={this.canvas}
                onMouseMove={this.mouseMove}
                onMouseDown={this.mouseMove}
                onMouseUp={this.mouseMove}
                onMouseLeave={this.mouseMove}
                onTouchStart={this.touchMove}
                onTouchMove={this.touchMove}
                onTouchEnd={this.touchMove}
                onTouchCancel={this.touchMove}
              ></canvas>
            )}
            {s.headerTab === "interstellar" && (
              <canvas ref={this.backgroundCanvas}></canvas>
            )}
          </div>
        </div>
        {ft.firstCollapse && (
          <div className="progress">
            <div
              style={{
                width: winProgress + "%",
                postition: "absolute",
                top: 0,
                left: 0,
                height: "21px",
                backgroundColor: "#151",
              }}
            ></div>
            <div style={{ position: "absolute", top: 0, left: 0 }}>
              {winProgress.toFixed(2)}% to Lighting up the Universe (1e25
              interstellar photons/s)
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
      if (star.collapsing || cost.capped) {
        return {};
      }
      star.upgrades = { ...star.upgrades };
      if (cost.cost > star.photons) {
        return {};
      }
      let updates = { stars: stars };
      this.buyUpgradeInner(name, updates, starIndex, state);
      return updates;
    });
  };

  buyUpgradeInner = (name, updates, starIndex, state) => {
    let star = updates.stars[starIndex];
    let cost = this.calcUpgradeCosts(star, state)[name];
    while (cost.cost <= star.photons) {
      star.photons -= cost.cost;
      star.upgrades[name] += 1;
      star[name] = Math.floor(star[name] * photonUpgradeDef[name].effect);
      updates.stars[starIndex] = star;
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
        star.particleRadius = this.getParticleRadius(star);
        if (state.interstellar.stellarMilestonesUnlocked >= 7) {
          star.starMass += star.particleMass;
        }
      }
      if (state.interstellar.stellarMilestonesUnlocked < 1) {
        return updates;
      }
      cost = this.calcUpgradeCosts(star, state)[name];
    }
  };

  buyInterstellarUpgrade = (id, cost) => {
    this.setState((state) => {
      let interstellar = { ...state.interstellar };
      if (cost.capped) {
        return {};
      }
      interstellar.upgrades = { ...interstellar.upgrades };
      if (cost.cost > interstellar.photons) {
        return {};
      }
      interstellar.photons -= cost.cost;
      interstellar.upgrades[id] += 1;
      let stars = [
        ...state.stars.map((origStar) => {
          let star = { ...origStar };
          if (id === "bonusParticlePhotons") {
            star.particlePhotons *= photonUpgradeDef.particlePhotons.effect;
          } else if (id === "permanentMilestones") {
            star.milestonesUnlocked = Math.max(
              interstellar.upgrades[id],
              star.milestonesUnlocked
            );
          } else if (id === "bonusParticleMass") {
            star.particleMass *= photonUpgradeDef.particleMass.effect;
          }
          return star;
        }),
      ];

      return { interstellar: interstellar, stars: stars };
    });
  };

  collapse = (starIndex) => {
    this.setState((state) => {
      let stars = [...state.stars];
      let star = { ...stars[starIndex] };
      if (star.collapsing || star.milestonesUnlocked < 5) {
        return;
      }
      this.prepCollapse(
        star,
        state.interstellar,
        state.autocollapsersEnabled[starIndex]
      );
      stars[starIndex] = star;
      return {
        stars: stars,
      };
    });
  };

  toggleAutobuyer = (starIndex, autobuyer) => {
    this.setState((state) => {
      let autobuyersEnabled = [...state.autobuyersEnabled];
      let starAutobuyers = { ...autobuyersEnabled[starIndex] };
      starAutobuyers[autobuyer] = !starAutobuyers[autobuyer];
      autobuyersEnabled[starIndex] = starAutobuyers;
      return { autobuyersEnabled: autobuyersEnabled };
    });
  };

  toggleAutocollapser = (starIndex) => {
    this.setState((state) => {
      let autocollapsers = [...state.autocollapsersEnabled];
      autocollapsers[starIndex] = !autocollapsers[starIndex];
      return { autocollapsersEnabled: autocollapsers };
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

  preCollapseStar = (starIndex) => {
    let stars = [...this.state.stars];
    let star = { ...stars[starIndex] };
    star.starMass = 1e25;
    star.photons = 5e9;
    stars[starIndex] = star;
    this.setState({
      stars: stars,
    });
  };

  genParticle = (star, offScreen, existing, starRadiusSq, interstellar) => {
    if (interstellar && interstellar.stellarMilestonesUnlocked >= 6) {
      offScreen = false;
    }
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
      let distSq = existing.x * existing.x + existing.y * existing.y;
      if (distSq < 10000 || distSq < starRadiusSq) {
        return this.genParticle(
          star,
          offScreen,
          existing,
          starRadiusSq,
          interstellar
        );
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

  touchMove = (e) => {
    if (!this.canvas.current) {
      return;
    }
    if (e.type === "touchcancel" || e.type === "touchend") {
      this.mouseClicked = false;
      return;
    }
    if (e.touches.length > 0) {
      var rect = this.canvas.current.getBoundingClientRect();
      this.mouseClicked = true;
      this.mouseX = e.touches[0].clientX - rect.left - this.canvas.current.width / 2;
      this.mouseY = e.touches[0].clientY - rect.top - this.canvas.current.height / 2;
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

  getStarColor(
    mass,
    colorFrame,
    collapseFrame,
    collapseTimes,
    collapseLengths
  ) {
    let baseL = 5;
    let targetH, targetS, targetL;
    if (mass <= collapseMass) {
      let ratio = Math.log(mass) / Math.log(collapseMass);
      targetH = 29.6 + ratio * (9.9 - 29.6);
      targetS = 87.1;
      targetL = 19.6;
      baseL = baseL * (1 + 0.2 * ratio);
    } else if (mass <= yellowCollapseMass) {
      let ratio =
        Math.log(mass / collapseMass) /
        Math.log(yellowCollapseMass / collapseMass);
      targetH = 9.9 + ratio * (64.6 - 9.9);
      targetS = 87.1 + ratio * (90.1 - 87.1);
      targetL = 19.6 + ratio * (75.7 - 19.6);
      baseL = baseL * (1.2 + 0.2 * ratio);
    } else if (mass <= whiteCollapseMass) {
      let ratio =
        Math.log(mass / yellowCollapseMass) /
        Math.log(whiteCollapseMass / yellowCollapseMass);
      targetH = 64.6 + ratio * (64.6 - 64.6);
      targetS = 90.1 + ratio * (0 - 90.1);
      targetL = 75.7 + ratio * (95.6 - 75.7);
      baseL = baseL * (1.4 + 0.2 * ratio);
    } else if (mass <= blueCollapseMass) {
      let ratio =
        Math.log(mass / whiteCollapseMass) /
        Math.log(blueCollapseMass / whiteCollapseMass);
      targetH = 228.6;
      targetS = 0 + ratio * (72.8 - 0);
      targetL = 95.6 + ratio * (72.8 - 95.6);
      baseL = baseL * (1.6 + 0.2 * ratio);
    } else {
      targetH = 228.6;
      targetS = 72.8;
      targetL = 72.8;
      baseL = 1.8;
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
      } else {
        intensity = 1;
      }
    }
    //let s = baseS + (targetS - baseS) * intensity;
    let s = targetS;
    let l = baseL + (targetL - baseL) * intensity;
    //if (Math.random() < 0.07) {
    //console.log("hsl", targetH, baseS, targetS, baseL, targetL);
    //}
    //console.log('hsl', targetH, s, l, hsluvToHex([targetH, s, l]))
    return hsluvToHex([targetH, s, l]);
  }

  drawCanvas = (
    canvas,
    offscreenCanvas,
    star,
    field,
    interstellar,
    autocollapserEnabled
  ) => {
    let pRad = star.particleRadius;
    let collapseTimes = star.collapseTimes;
    let collapseLengths = star.collapseLengths;
    let starRadius = this.getStarRadius(star, collapseTimes, collapseLengths);

    let [w, h] = [canvas.width, canvas.height];
    let [cx, cy] = [w / 2, h / 2];
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(
      offscreenCanvas,
      centerX - cx - star.backgroundX,
      centerY - cy - star.backgroundY,
      w,
      h,
      0,
      0,
      w,
      h
    );
    if (
      autocollapserEnabled &&
      interstellar.stellarMilestonesUnlocked >= 9 &&
      star.lifetime < 0.5
    ) {
      return;
    }

    ctx.beginPath();
    ctx.strokeStyle = "#222";
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
      star.collapseFrame,
      collapseTimes,
      collapseLengths
    );
    ctx.beginPath();
    let renderedX = 0,
      renderedY = 0;
    if (star.collapsing && star.collapseFrame < collapseTimes.expand) {
      renderedX = getRandomInt(4) - 2;
      renderedY = getRandomInt(4) - 2;
    } else if (star.collapsing && star.collapseFrame > collapseTimes.revel) {
      let backgroundX = star.backgroundX;
      let backgroundY = star.backgroundY;
      if (interstellar.collapseCount === 0) {
        backgroundX = 0;
        backgroundY = 0;
      }
      renderedX =
        ((backgroundX + star.completedX) *
          (star.collapseFrame - collapseTimes.revel)) /
        collapseLengths.background;
      console.log("cx", cx);
      renderedY =
        ((backgroundY + star.completedY) *
          (star.collapseFrame - collapseTimes.revel)) /
        collapseLengths.background;
    }
    ctx.arc(cx + renderedX, cy + renderedY, starRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "#23170e";
    let pCount = 0;
    let ringSize = 0,
      ringSizeSq = 0;
    if (
      star.collapsing &&
      star.collapseFrame >= collapseTimes.expand &&
      star.collapseFrame < collapseTimes.ring
    ) {
      ringSize = this.getCollapseRingSize(
        star.collapseFrame,
        starRadius,
        collapseTimes,
        collapseLengths
      );
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
        this.getCollapseRingSize(
          star.collapseFrame,
          starRadius,
          collapseTimes,
          collapseLengths
        ),
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
        photon.x + cx + photon.vx / 60,
        photon.y + cy + photon.vy / 60
      );
      ctx.stroke();
    }
  };

  save = () => {
    localStorage.setItem("universeIsDarkSave", JSON.stringify(this.state));
  };

  resizeCanvas = () => {
    if (
      this.canvas.current !== null &&
      (this.state.headerTab === "protostar" ||
        this.state.headerTab === "protostar2")
    ) {
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
      this.width = this.canvas.current.width;
    }

    if (
      this.backgroundCanvas.current !== null &&
      this.state.headerTab === "interstellar"
    ) {
      this.backgroundCanvas.current.style.width = "100%";
      this.backgroundCanvas.current.style.height = "100%";
      if (this.backgroundCanvas.current.offsetWidth > maxWidth) {
        this.backgroundCanvas.current.width = maxWidth;
        this.backgroundCanvas.current.style.width = maxWidth + "px";
      } else {
        this.backgroundCanvas.current.width = this.backgroundCanvas.current.offsetWidth;
      }
      if (this.backgroundCanvas.current.offsetHeight > maxHeight) {
        this.backgroundCanvas.current.height = maxHeight;
        this.backgroundCanvas.current.style.height = maxHeight + "px";
      } else {
        this.backgroundCanvas.current.height = this.backgroundCanvas.current.offsetHeight;
      }
      this.width = this.backgroundCanvas.current.width;
    }
    if (this.state.paused) {
      this.forceUpdate();
    }
  };

  componentDidMount() {
    window.addEventListener("beforeunload", this.save);
    window.addEventListener("resize", this.resizeCanvas);
    this.resizeCanvas();
    let canvas = this.offscreenCanvas;
    if (canvas) {
      let [w, h] = [canvas.width, canvas.height];
      let [cx, cy] = [w / 2, h / 2];
      const ctx = canvas.getContext("2d", { alpha: false });
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      for (const compStar of this.state.interstellar.completedStars) {
        ctx.fillStyle = compStar.color;
        ctx.beginPath();
        ctx.arc(
          compStar.x + cx,
          compStar.y + cy,
          compStar.radius,
          0,
          2 * Math.PI
        );
        ctx.fill();
      }
    }
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
      if (debug) {
        console.log("delta too large: " + delta);
      }
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
    if (debug && loopCount > 1) {
      console.log("loops", loopCount);
    }
    this.lastFrame = tFrame - delta;
    this.renderID = window.requestAnimationFrame(this.gameLoop);
  };

  togglePause = () => {
    this.setState({ paused: !this.state.paused });
  };

  getCollapseRingSize = (
    collapseFrame,
    radius,
    collapseTimes,
    collapseLengths
  ) => {
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
      stars: [...s.stars],
      featureTriggers: { ...s.featureTriggers },
      logText: s.logText,
      interstellar: {
        ...s.interstellar,
        completedStars: [...s.interstellar.completedStars],
        completedConstellations: [...s.interstellar.completedConstellations],
        completedGalaxies: [...s.interstellar.completedGalaxies],
      },
      won: s.won,
      gameLength: s.gameLength + (s.won ? 0 : relDelta),
    };
    while (
      updates.interstellar.milestonesUnlocked < stellarMassMilestones.length &&
      s.interstellar.interstellarMass >=
        stellarMassMilestones[updates.interstellar.milestonesUnlocked].value
    ) {
      updates.interstellar.milestonesUnlocked++;
      if (
        updates.interstellar.milestonesUnlocked === 2 &&
        updates.interstellar.stellarMilestonesUnlocked >= 2
      ) {
        let star = this.getInitStar(updates);
        this.fields.push(this.getInitField(star));
        updates.stars.push(star);
      }
    }

    updates.interstellar.photons +=
      s.interstellar.interstellarPhotonIncome * relDelta;
    const dragConstant = 0.0005;
    let visibleStarIndex = -1;
    if (s.headerTab === "protostar") {
      visibleStarIndex = 0;
    } else if (s.headerTab === "protostar2") {
      visibleStarIndex = 1;
    }
    let forceResize = false;
    for (let [index, star] of updates.stars.entries()) {
      star.lifetime += relDelta;
      let collapseTimes = star.collapseTimes;
      let collapseLengths = star.collapseLengths;
      star.particleRadius = this.getParticleRadius(star);
      let field = this.fields[index];
      let starRadius = this.getStarRadius(star, collapseTimes, collapseLengths);
      let starRadiusSq = starRadius ** 2;
      let [leftEdge, topEdge] = [
        -maxWidth / 2 - star.particleRadius,
        -maxHeight / 2 - star.particleRadius,
      ];
      let [rightEdge, bottomEdge] = [-leftEdge, -topEdge];
      field.colorFrame = (field.colorFrame + relDelta) % 10;
      let gConstant = (gravity * Math.log(star.starMass)) / Math.log(20);
      let newMass = star.starMass;
      let newPhotons =
        star.photons + s.interstellar.interstellarPhotonIncome ** 0.5;
      let vx = star.vx;
      let vy = star.vy;
      let velocity = star.velocity;
      let drag = dragConstant;
      let starDrag = starDragConstant;
      let milestonesUnlocked = star.milestonesUnlocked;
      if (!star.collapsing && this.mouseClicked && visibleStarIndex === index) {
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
          this.genParticle(star, true, p, starRadiusSq, s.interstellar);
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

          this.genParticle(star, true, p, starRadiusSq, s.interstellar);
          if (!updates.featureTriggers.firstPhoton) {
            updates.featureTriggers.firstPhoton = true;
            updates.logText.unshift(logTexts.firstPhoton);
          }
          if (
            field.photons.length < s.particleLimit &&
            (!star.collapsing || star.collapseFrame < collapseTimes.revel)
          ) {
            field.photons.push(photon);
          }
          newPhotons += star.particlePhotons;
          if (!updates.featureTriggers.unlockUpgrades && newPhotons >= 10) {
            updates.featureTriggers.unlockUpgrades = true;
            updates.logText.unshift(logTexts.unlockUpgrades);
          }
          // Don't update mass while collapsing just in case...
          if (!star.collapsing) {
            newMass += star.particleMass;
          }
        }
        while (
          s.featureTriggers.unlockMass &&
          milestonesUnlocked < massMilestones.length &&
          newMass >= massMilestones[milestonesUnlocked].value
        ) {
          if (
            !updates.featureTriggers.firstCollapse &&
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
          field.particles.push(
            this.genParticle(
              star,
              true,
              undefined,
              starRadiusSq,
              s.interstellar
            )
          );
        }
        if (star.milestonesUnlocked >= 5) {
          if (s.autocollapsersEnabled[index]) {
            this.prepCollapse(star, updates.interstellar, true);
            if (s.interstellar.stellarMilestonesUnlocked >= 9) {
              star.collapseFrame = collapseTimes.background;
            }
          }
        }
      }
      let collapsed = false;
      if (star.collapsing) {
        if (
          star.collapseFrame >= collapseTimes.expand &&
          star.collapseFrame < collapseTimes.revel
        ) {
          let limit = s.particleLimit / 10;
          if (star.collapseFrame >= collapseTimes.revel) {
            limit -=
              (limit * (star.collapseFrame - collapseTimes.revel)) /
              collapseLengths.background;
          }
          for (let i = field.photons.length; i < limit; i++) {
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
        if (star.collapseFrame > collapseTimes.background) {
          collapsed = true;
          forceResize =
            forceResize || this.finishCollapse(updates.stars, index, updates);
        }
      }
      star = {
        ...star,
        gridX: (star.gridX - vx * relDelta) % gridSpacing,
        gridY: (star.gridY - vy * relDelta) % gridSpacing,
        backgroundX: star.backgroundX - vx * relDelta * 0.03,
        backgroundY: star.backgroundY - vy * relDelta * 0.03,
        vx: vx,
        vy: vy,
        velocity: velocity,
      };

      if (!collapsed) {
        updates.stars[index] = {
          ...star,
          starMass: newMass,
          photons: newPhotons,
          milestonesUnlocked: milestonesUnlocked,
        };
      }
      if (!star.collapsing) {
        if (s.autobuyersEnabled[index].particlePhotons) {
          this.buyUpgradeInner("particlePhotons", updates, index, updates);
        }
        if (s.autobuyersEnabled[index].particleCount) {
          this.buyUpgradeInner("particleCount", updates, index, updates);
        }
        if (s.autobuyersEnabled[index].particleMass) {
          this.buyUpgradeInner("particleMass", updates, index, updates);
        }
      }
    }
    let callback = forceResize ? this.resizeCanvas : () => {};
    this.setState(updates, callback);
  };

  prepCollapse = (star, interstellar, autocollapserEnabled) => {
    star.collapsing = true;
    star.collapseFrame = 0;
    let minR = 0;
    if (interstellar.collapseCount < 20) {
      minR = 20;
    }
    let startR = Math.min(this.width / 4, 300);
    let scaleR = Math.min(this.width / 3, 400);
    let maxR = startR + interstellar.collapseCount;
    if (maxR > scaleR) {
      maxR = scaleR * (maxR / scaleR) ** 0.4;
    }
    let r = minR + getRandomInt(maxR + interstellar.collapseCount);
    let theta = Math.random() * 2 * Math.PI;
    star.completedX = r * Math.cos(theta);
    star.completedY = r * Math.sin(theta);
    if (interstellar.stellarMilestonesUnlocked >= 8 && autocollapserEnabled) {
      star.collapseTimes = fastestCollapseTimes;
      star.collapseLengths = fastestCollapseLengths;
    } else if (interstellar.stellarMilestonesUnlocked >= 4) {
      star.collapseTimes = fastCollapseTimes;
      star.collapseLengths = fastCollapseLengths;
    }
  };

  getParticleRadius = (star) => {
    let logFactor = 125
    if (this.width < 500) {
      logFactor *= 5;
    } 
    if (this.width < 300) {
      logFactor *= 5;
    } 
    return (0.25 * Math.log(star.particleMass)) / Math.log(logFactor) + 4;
  };

  createProtostar = () => {
    if (this.state.stars.length) {
      return;
    }
    this.setState((state) => {
      let stars = [...state.stars];
      let star = this.getInitStar(state);
      stars.push(star);
      this.fields.push(this.getInitField(star));
      return { stars: stars, headerTab: "protostar", tab: "upgrades" };
    }, this.resizeCanvas);
  };

  getCollapsedRadius = (star) => {
    return 1.2 + Math.log(star.starMass / collapseMass) / Math.log(1000000);
  };

  finishCollapse = (stars, starIndex, updates) => {
    let star = stars[starIndex];
    if (!updates.featureTriggers.firstCollapse) {
      updates.featureTriggers.firstCollapse = true;
      //updates.logText.unshift(logTexts.firstCollapse);
    }
    updates.interstellar.collapseCount++;

    let completedStar = {
      color: this.getStarColor(star.starMass, 5, 0, {}, {}),
      x: star.completedX,
      y: star.completedY,
      radius: this.getCollapsedRadius(star),
    };
    let canvas = this.offscreenCanvas;
    let [w, h] = [canvas.width, canvas.height];
    let [cx, cy] = [w / 2, h / 2];
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.fillStyle = completedStar.color;
    ctx.beginPath();
    ctx.arc(
      completedStar.x + cx,
      completedStar.y + cy,
      completedStar.radius,
      0,
      2 * Math.PI
    );
    ctx.fill();
    let forceResize = false;
    if (updates.interstellar.completedStars.length < 20000) {
      updates.interstellar.completedStars.push(completedStar);
    }
    updates.interstellar.interstellarMass += star.starMass;
    updates.interstellar.interstellarPhotonIncome =
      10 *
      (updates.interstellar.interstellarMass / 1e25) *
      updates.interstellar.collapseCount;
    if (!updates.won && updates.interstellar.interstellarPhotonIncome >= 1e25) {
      updates.headerTab = "interstellar";
      updates.interstellarTab = "victory";
      updates.won = true;
      forceResize = true;
    }

    while (
      updates.interstellar.stellarMilestonesUnlocked <
        stellarMilestones.length &&
      updates.interstellar.collapseCount >=
        stellarMilestones[updates.interstellar.stellarMilestonesUnlocked].value
    ) {
      updates.interstellar.stellarMilestonesUnlocked++;
      if (
        updates.interstellar.milestonesUnlocked >= 2 &&
        updates.stars.length === 1
      ) {
        let newStar = this.getInitStar(updates);
        this.fields.push(this.getInitField(newStar));
        updates.stars.push(star);
      }
    }
    if (updates.interstellar.stellarMilestonesUnlocked < 2) {
      updates.headerTab = "interstellar";
      star.collapsed = true;
      this.fields.splice(starIndex, 1);
      stars.splice(starIndex, 1);
      forceResize = true;
    } else {
      updates.tab = "upgrades";
      stars[starIndex] = this.getInitStar(updates);
      this.fields[starIndex] = this.getInitField(stars[starIndex]);
    }
    return forceResize;
  };
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function itoa(num, noFrac, noFracFixed, unitSuffix = "") {
  if (num === undefined) {
    return "undefined";
  }
  if (num > 1e15) {
    let oom = Math.floor(Math.log(num) / Math.log(10));
    if (num / 10 ** oom >= 9.99) {
      return "1.00e" + (oom + 1) + unitSuffix;
    }
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
if (debug) {
  window.itoa = itoa;
}
export default App;
