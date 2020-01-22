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
let sheet;

const mechChangelogMap = {
  x: "x",
  y: "y",
  a: "rotation"
};
const cannonChangelogMap = {
  ca: "rotation"
};
const missileChangelogMap = {
  x: "x",
  y: "y",
  a: "rotation"
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * Math.floor(max)) + min;
}

export default {
  name: "GameCanvas",
  props: {},
  wsCommands: {
    worldChanges(changelog) {
      if (!currTimeId) {
        // use time shift for more smooth prediction: we need changelogToRun always be not empty on run
        currTimeId = changelog[0].tId - timeShiftForPrediction;
      }
      changelogToRun = [...changelogToRun, ...changelog];
    },
    worldInit(changelog) {
      changelog[0].chObjs.forEach(function(obj) {
        this.newMapObj(obj.id, obj.x, obj.y);
      }, this);
    }
  },
  data: function() {
    return {
      app: new PIXI.Application({
        backgroundColor: "0xffffff",
        width: 880
      }),
      viewport: undefined,
      missiles: new Map(),
      objects: new Map(),
      mech: undefined,
      mechBase: undefined,
      mechWeaponCannon: undefined,
      terra: undefined,
      changelogCurrIndex: 0
    };
  },
  mounted: function() {
    this.$el.appendChild(this.app.view);
    this.viewportSetup();
    this.app.loader.add("/images/spritesheet.json").load((loader, resources) => {
      this.$store.commit("newRandomUser");
      this.wsConnect(this.$store.state.userId);

      sheet = resources["/images/spritesheet.json"];
      this.mapSetup();
      this.mechSetup();

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
    viewportSetup() {
      this.viewport = new Viewport({
        screenWidth: 880,
        screenHeight: 600,
        worldWidth: 3000,
        worldHeight: 2000,
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
        .zoom(1500)
        // .zoom(1)
        .moveCenter(xShift, yShift)
        .drag()
        .pinch()
        .wheel()
        .decelerate();
    },
    mechSetup() {
      this.mechBase = new PIXI.Sprite(sheet.textures["mech_base_128.png"]);
      this.mechWeaponCannon = new PIXI.Sprite(sheet.textures["cannon_128.png"]);

      this.mechBase.anchor.set(0.5);

      // смещаем башню немного, потому что она не по центру меха
      this.mechWeaponCannon.x = 10;

      this.mech = new PIXI.Container();
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
    newMapObj(id, x, y) {
      let spriteName = "rock" + getRandomInt(1, 3) + ".png";
      let obj = new PIXI.Sprite(sheet.textures[spriteName]);

      obj.x = x;
      obj.y = y;

      this.objects.set(id, obj);
      this.viewport.addChild(obj);
    },
    newMissile(id, x, y, rotation) {
      let missile = new PIXI.Sprite(sheet.textures["missile.png"]);

      missile.x = x;
      missile.y = y;

      missile.vx = 0;
      missile.vy = 0;
      missile.vr = 0;

      missile.rotation = rotation ? rotation : 0;
      this.missiles.set(id, missile);
      this.viewport.addChild(missile);
    },
    mapSetup() {
      this.terra = new PIXI.extras.TilingSprite(sheet.textures["terra_256.png"], 2800, 2000);
      this.terra.anchor.set(0);
    },
    gameLoop() {
      this.mech.x += this.mech.vx;
      this.mech.y += this.mech.vy;
      this.mech.rotation += this.mech.vr;
      this.mechWeaponCannon.rotation += this.mechWeaponCannon.vr;
      for (let m of this.missiles.values()) {
        m.x += m.vx;
        m.y += m.vy;
        m.rotation += m.vr;
      }

      let now = new Date();
      let timeDelta = now.getTime() - timer.getTime();
      timer = now;
      if (currTimeId) {
        this.runChangelog(timeDelta);
      }
    },
    runChangelog(timeDelta) {
      currTimeId += timeDelta;
      if (this.changelogCurrIndex >= changelogToRun.length) {
        this.clearPredictions();
        return;
      }

      if (changelogToRun[this.changelogCurrIndex].tId > currTimeId) {
        return;
      }

      changelogToRun[this.changelogCurrIndex].chObjs.forEach(this.runChange, this);

      this.changelogCurrIndex++;

      if (this.changelogCurrIndex < changelogToRun.length) {
        this.makePredictions(timeDelta);
      }
    },
    // smoothing movements of objects
    makePredictions(timeDelta) {
      let nextChange = changelogToRun[this.changelogCurrIndex];
      let nextTimeIdDelta = nextChange.tId - currTimeId;
      // f - proposed future game ticks
      let f = nextTimeIdDelta / timeDelta;

      changelogToRun[this.changelogCurrIndex].chObjs.forEach(function(change) {
        switch (change.t) {
          case "player":
            this.mech.vx = !change.x ? 0 : (change.x - this.mech.x) / f;
            this.mech.vy = !change.y ? 0 : (change.y - this.mech.y) / f;
            this.mech.vr = !change.a ? 0 : (change.a - this.mech.rotation) / f;
            this.mechWeaponCannon.vr = !change.ca ? 0 : (change.ca - this.mechWeaponCannon.rotation) / f;
            break;
          case "missile":
            if (this.missiles.has(change.id)) {
              let missile = this.missiles.get(change.id);
              missile.vx = !change.x ? 0 : (change.x - missile.x) / f;
              missile.vy = !change.y ? 0 : (change.y - missile.y) / f;
              missile.vr = !change.a ? 0 : (change.a - missile.rotation) / f;
            }
            break;
        }
      }, this);
    },
    clearPredictions() {
      this.mech.vx = 0;
      this.mech.vy = 0;
      this.mech.vr = 0;
      this.mechWeaponCannon.vr = 0;
      for (let m of this.missiles.values()) {
        m.vx = 0;
        m.vy = 0;
        m.vr = 0;
      }
    },
    applyMapToObj(change, obj, map) {
      for (let k in map) {
        if (change[k]) {
          obj[map[k]] = change[k];
        }
      }
    },
    runChange(change) {
      switch (change.t) {
        case "player":
          this.applyMapToObj(change, this.mech, mechChangelogMap);
          this.applyMapToObj(change, this.mechWeaponCannon, cannonChangelogMap);
          break;
        case "missile":
          if (!this.missiles.has(change.id)) {
            this.newMissile(change.id, change.x, change.y, change.a);
          } else if (change.d) {
            this.missiles.get(change.id).destroy();
            this.missiles.delete(change.id);
          } else {
            this.applyMapToObj(change, this.missiles.get(change.id), missileChangelogMap);
          }
          break;
      }
    }
  }
};
</script>

<style scoped></style>
