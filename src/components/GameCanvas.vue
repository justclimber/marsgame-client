<template>
  <div class="paper container" id="pixiDiv"></div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";
import Sprite = PIXI.Sprite;
import Container = PIXI.Container;
import AnimatedSprite = PIXI.AnimatedSprite;
import Spritesheet = PIXI.Spritesheet;
import TilingSprite = PIXI.TilingSprite;
import LoaderResource = PIXI.LoaderResource;
import Loader = PIXI.Loader;

let xShift = 1000;
let yShift = 1000;
let timeShiftForPrediction = 1500;
let timer = new Date();
let currTimeId: number;
let changelogToRun: ChangelogByTime[] = [];
let sheet: Spritesheet;

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

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * Math.floor(max)) + min;
}

interface ChangelogByObject {
  t: string;
  id: string;
  x?: number;
  y?: number;
  a?: number;
  d?: boolean;
}

interface ChangelogByTime {
  tId: number;
  chObjs: ChangelogByObject[];
}

PIXI.utils.skipHello();

@Component
export default class GameCanvas extends Vue {
  app = new PIXI.Application({
    width: 880
  });
  viewport = new Viewport({
    screenWidth: 880,
    screenHeight: 600,
    worldWidth: 3000,
    worldHeight: 2000,
    interaction: this.app.renderer.plugins.interaction
  });
  missiles: Map<string, AnimatedSprite> = new Map();
  objects: Map<string, Sprite> = new Map();
  mech: Container | undefined = undefined;
  mechBase: Sprite | undefined = undefined;
  mechWeaponCannon: Sprite | undefined = undefined;
  changelogCurrIndex: number = 0;
  debug: boolean = false;
  wsCommands = {
    worldChanges(changelog: ChangelogByTime[]) {
      if (!currTimeId) {
        // use time shift for more smooth prediction: we need changelogToRun always be not empty on run
        currTimeId = changelog[0].tId - timeShiftForPrediction;
      }
      changelogToRun = [...changelogToRun, ...changelog];
    },
    worldInit(changelog: ChangelogByTime[]) {
      changelog[0].chObjs.forEach(function(this: GameCanvas, obj: ChangelogByObject): void {
        this.newMapObj(obj.id, obj.x, obj.y);
      }, this);
    }
  };
  mounted() {
    this.$el.appendChild(this.app.view);
    this.viewportSetup();
    this.app.loader
      .add("/images/spritesheet.json")
      .load((loader: Loader, resources: Partial<Record<string, LoaderResource>>) => {
        this.$store.commit("newRandomUser");
        this.wsConnect(this.$store.state.userId);
        if (resources["/images/spritesheet.json"]!.spritesheet) {
          sheet = resources["/images/spritesheet.json"]!.spritesheet;
        } else {
          console.error("Can't load spritesheet");
          return;
        }
        const mech = this.mechSetup();

        this.app.stage.addChild(this.viewport);
        this.viewport.addChild(this.mapSetup());
        this.viewport.addChild(mech);
        this.app.ticker.add(() => this.gameLoop());
      });
  }
  get userId(): number {
    return this.$store.state.userId;
  }
  viewportSetup(): void {
    this.viewport
      .clampZoom({
        minWidth: 300,
        maxWidth: 3000
      })
      .bounce({ time: 400, underflow: "center" })
      .zoom(1500)
      // .zoom(1)
      .moveCenter(xShift, yShift)
      .drag()
      .pinch()
      .wheel()
      .decelerate();
  }

  mechSetup(): Container {
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
    this.mech.rotation = 0;

    this.mechWeaponCannon.vr = 0;
    this.mechWeaponCannon.rotation = 0;

    this.mech.addChild(this.mechBase);
    this.mech.addChild(this.mechWeaponCannon);

    this.drawBoundsForObj(this.mech);
    this.drawCollisionCircleForObj(this.mech, 100);
    return this.mech;
  }

  newMapObj(id: string, x: number = 0, y: number = 0): void {
    let spriteName = "rock" + getRandomInt(1, 3) + ".png";
    let obj = new PIXI.Sprite(sheet.textures[spriteName]);

    obj.x = x;
    obj.y = y;

    this.drawBoundsForObj(obj);
    this.drawCollisionCircleForObj(obj, 100);

    this.objects.set(id, obj);
    this.viewport.addChild(obj);
  }

  drawBoundsForObj(obj: any): void {
    if (!this.debug) {
      return;
    }
    let spriteBound = new PIXI.Graphics();
    spriteBound.lineStyle(4, 0xfeeb77, 1);
    spriteBound.drawRect(0 - obj.width / 2, 0 - obj.height / 2, obj.width, obj.height);
    obj.addChild(spriteBound);
  }

  drawCollisionCircleForObj(obj: any, radius: number): void {
    if (!this.debug) {
      return;
    }
    let collisionCircle = new PIXI.Graphics();
    collisionCircle.lineStyle(4, 0x00eb77, 1);
    collisionCircle.drawCircle(0, 0, radius);
    obj.addChild(collisionCircle);
  }

  newMissile(id: string, x: number = 0, y: number = 0, rotation: number = 0): void {
    const missile = new PIXI.AnimatedSprite(sheet.animations["m"]);

    missile.x = x;
    missile.y = y;
    missile.rotation = rotation;

    missile.vx = 0;
    missile.vy = 0;
    missile.vr = 0;

    missile.animationSpeed = 0.167;
    missile.play();

    this.drawBoundsForObj(missile);
    this.drawCollisionCircleForObj(missile, 20);

    this.missiles.set(id, missile);
    this.viewport.addChild(missile);
  }

  mapSetup(): TilingSprite {
    const terra = new PIXI.TilingSprite(sheet.textures["terra_256.png"], 2800, 2000);
    terra.anchor.set(0);
    return terra;
  }

  gameLoop(): void {
    if (!this.mech || !this.mechWeaponCannon) {
      return;
    }
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
  }
  runChangelog(timeDelta: number): void {
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
  }
  // smoothing movements of objects
  makePredictions(timeDelta: number): void {
    let nextChange = changelogToRun[this.changelogCurrIndex];
    let nextTimeIdDelta = nextChange.tId - currTimeId;
    // f - proposed future game ticks
    let f = nextTimeIdDelta / timeDelta;
    let missile: AnimatedSprite | undefined;

    changelogToRun[this.changelogCurrIndex].chObjs.forEach((change: any) => {
      switch (change.t) {
        case "player":
          if (!this.mech || !this.mechWeaponCannon) {
            return;
          }
          this.mech.vx = !change.x ? 0 : (change.x - this.mech.x) / f;
          this.mech.vy = !change.y ? 0 : (change.y - this.mech.y) / f;
          this.mech.vr = !change.a ? 0 : (change.a - this.mech.rotation) / f;
          this.mechWeaponCannon.vr = !change.ca ? 0 : (change.ca - this.mechWeaponCannon.rotation) / f;
          break;
        case "missile":
          missile = this.missiles.get(change.id);
          if (missile) {
            missile.vx = !change.x ? 0 : (change.x - missile.x) / f;
            missile.vy = !change.y ? 0 : (change.y - missile.y) / f;
            missile.vr = !change.a ? 0 : (change.a - missile.rotation) / f;
          }
          break;
      }
    });
  }
  clearPredictions(): void {
    if (!this.mech || !this.mechWeaponCannon) {
      return;
    }
    this.mech.vx = 0;
    this.mech.vy = 0;
    this.mech.vr = 0;
    this.mechWeaponCannon.vr = 0;
    for (let m of this.missiles.values()) {
      m.vx = 0;
      m.vy = 0;
      m.vr = 0;
    }
  }
  applyMapToObj(change: any, obj: any, map: any): void {
    for (let k in map) {
      if (change[k]) {
        obj[map[k]] = change[k];
      }
    }
  }
  runChange(change: ChangelogByObject): void {
    let missile: AnimatedSprite | undefined;
    switch (change.t) {
      case "player":
        this.applyMapToObj(change, this.mech, mechChangelogMap);
        this.applyMapToObj(change, this.mechWeaponCannon, cannonChangelogMap);
        break;
      case "missile":
        missile = this.missiles.get(change.id);
        if (!missile) {
          this.newMissile(change.id, change.x, change.y, change.a);
        } else if (change.d) {
          missile.destroy();
          this.missiles.delete(change.id);
        } else {
          this.applyMapToObj(change, missile, missileChangelogMap);
        }
        break;
    }
  }
}
</script>

<style scoped></style>
