<template>
  <div class="paper container" id="pixiDiv"></div>
</template>

<script>
import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";

let xShift = 1000;
let yShift = 1000;
let timeShiftForPrediction = 1500;
let timer = new Date();
let currTimeId;
let changelogToRun = [];

export default {
  name: "GameCanvas",
  props: {},
  wsCommands: {
    worldChanges(payload) {
      this.parseChangelog(payload);
    }
  },
  data: function() {
    return {
      app: new PIXI.Application({
        backgroundColor: "0xffffff",
        width: 880
      }),
      viewport: undefined,
      mech: undefined,
      mechBase: undefined,
      mechWeaponCannon: undefined,
      terra: undefined
    };
  },
  mounted: function() {
    this.$el.appendChild(this.app.view);
    this.viewportSetup();
    this.app.loader
      .add("/images/spritesheet.json")
      .load((loader, resources) => {
        let sheet = resources["/images/spritesheet.json"];
        this.mapSetup(resources, sheet);
        this.mechSetup(resources, sheet);

        this.app.stage.addChild(this.viewport);
        this.viewport.addChild(this.terra);
        this.viewport.addChild(this.mech);

        this.app.ticker.add(() => this.gameLoop());
      });
  },
  computed: {
    userId() {
      return this.$store.state.userId;
    }
  },
  methods: {
    gameLoop() {
      this.mech.x += this.mech.vx;
      this.mech.y += this.mech.vy;
      this.mech.rotation += this.mech.vr;
      this.mechWeaponCannon.rotation += this.mechWeaponCannon.vr;

      let now = new Date();
      let timeDelta = now.getTime() - timer.getTime();
      timer = now;
      if (currTimeId) {
        currTimeId += timeDelta;
        if (changelogToRun.length) {
          if (changelogToRun[0].timeId < currTimeId) {
            let timeId = changelogToRun[0].timeId;
            let change = changelogToRun.shift();
            if (change.x) {
              this.mech.x = change.x;
            }
            if (change.y) {
              this.mech.y = change.y;
            }
            if (change.rotation) {
              this.mech.rotation = change.rotation;
            }
            if (change.cannonRotation) {
              this.mechWeaponCannon.rotation = change.cannonRotation;
            }

            // prediction for smooth moving
            if (changelogToRun.length) {
              let nextChange = changelogToRun[0];
              let nextTimeIdDelta = nextChange.timeId - timeId;
              let futureGameTicks = nextTimeIdDelta / timeDelta;
              this.mech.vx = !nextChange.x
                ? 0
                : (nextChange.x - this.mech.x) / futureGameTicks;
              this.mech.vy = !nextChange.y
                ? 0
                : (nextChange.y - this.mech.y) / futureGameTicks;
              this.mech.vr = !nextChange.rotation
                ? 0
                : (nextChange.rotation - this.mech.rotation) / futureGameTicks;
              this.mechWeaponCannon.vr = !nextChange.cannonRotation
                ? 0
                : (nextChange.cannonRotation - this.mechWeaponCannon.rotation) /
                  futureGameTicks;
            }
          }
        } else {
          // stop prediction
          this.mech.vx = 0;
          this.mech.vy = 0;
          this.mech.vr = 0;
          this.mechWeaponCannon.vr = 0;
        }
      }
    },
    viewportSetup() {
      this.viewport = new Viewport({
        screenWidth: 880,
        screenHeight: 600,
        worldWidth: 3000,
        worldHeight: 2000,

        // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
        interaction: this.app.renderer.plugins.interaction
      });
      this.viewport
        .clampZoom({
          minWidth: 300,
          maxWidth: 3000
        })
        .bounce({
          time: 400
        })
        .moveCenter(xShift, yShift)
        .drag()
        .pinch()
        .wheel()
        .decelerate();
    },
    mechSetup(resources, sheet) {
      this.mechBase = new PIXI.Sprite(sheet.textures["mech_base_128.png"]);
      this.mechWeaponCannon = new PIXI.Sprite(sheet.textures["cannon_128.png"]);

      this.mechBase.anchor.set(0.5);

      // смещаем башню немного, потому что она не по центру меха
      this.mechWeaponCannon.y = 3;
      this.mechWeaponCannon.x = 20;
      this.mechWeaponCannon.anchor.set(0.18, 0.5);

      this.mech = new PIXI.Container();
      this.mech.scale.y *= -1;
      this.mech.pivot.set(0.5);
      this.mech.x = xShift;
      this.mech.y = yShift;
      this.mech.vx = 0;
      this.mech.vy = 0;
      this.mech.vr = 0;
      this.mech.throttle = 0;
      this.mech.rotation = 0;

      this.mechWeaponCannon.vr = 0;
      this.mechWeaponCannon.rotation = 0;

      this.mech.addChild(this.mechBase);
      this.mech.addChild(this.mechWeaponCannon);
    },
    mapSetup(resources, sheet) {
      this.terra = new PIXI.TilingSprite(
        sheet.textures["terra_256.png"],
        2800,
        2000
      );
      this.terra.anchor.set(0);
    },
    parseChangelog(changelog) {
      changelog.forEach(function(changeByTime) {
        let changesByObject = changeByTime.chObjs;
        changesByObject.forEach(function(changeByObj) {
          if (changeByObj.id !== this.userId) {
            return;
          }
          let change = { timeId: changeByTime.tId };
          if (changeByObj.x) {
            change.x = changeByObj.x + xShift;
            change.y = changeByObj.y + yShift;
          }
          if (changeByObj.a) {
            change.rotation = changeByObj.a;
          }
          if (changeByObj.ca) {
            change.cannonRotation = changeByObj.ca;
          }
          changelogToRun.push(change);
        }, this);
        if (!currTimeId) {
          // use time shift for more smooth prediction: we need changelogToRun always be not empty on run
          currTimeId = changeByTime.tId - timeShiftForPrediction;
        }
      }, this);
    }
  }
};
</script>

<style scoped></style>
