<template>
  <div id="pixiDiv"></div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";

const worldWide = 30000;
const xShift = 10000;
const yShift = 10000;
const timeShiftForPrediction = 500;

let timer = new Date();
let currTimeId: number;
let changelogToRun: ChangelogByTime[] = [];
let sheet: PIXI.Spritesheet;

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

type GameSpriteObj = PIXI.Sprite | PIXI.AnimatedSprite | PIXI.Container;

interface ChangeMap {
  x?: string;
  y?: string;
  a?: string;
  ca?: string;

  [propName: string]: string | undefined;
}

interface ChangelogByObject {
  t: string;
  id: number;
  x?: number;
  y?: number;
  a?: number;
  ca?: number;
  d?: boolean;
  did?: number;

  [propName: string]: string | number | boolean | undefined;
}

type MapGameSpriteObj = Map<number, GameSpriteObj>;

interface ChangelogByTime {
  tId: number;
  chObjs: ChangelogByObject[];
}

PIXI.utils.skipHello();

@Component
export default class GameCanvas extends Vue {
  app = new PIXI.Application({
    width: 600,
    height: 700,
    backgroundColor: 0xffffff
  });
  viewport = new Viewport({
    screenWidth: 600,
    screenHeight: 700,
    worldWidth: worldWide,
    worldHeight: worldWide,
    interaction: this.app.renderer.plugins.interaction
  });
  missiles: MapGameSpriteObj = new Map();
  objects: MapGameSpriteObj = new Map();
  mech?: PIXI.Container = undefined;
  mechBase?: PIXI.Sprite = undefined;
  mechWeaponCannon?: PIXI.Sprite = undefined;
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
    worldInit(this: GameCanvas, changelog: ChangelogByTime[]) {
      changelogToRun = [];
      currTimeId = 0;
      this.changelogCurrIndex = 0;
      this.clearPredictions();
      this.cleanMap();
      this.wsSendCommand({
        type: "programFlow",
        payload: "1"
      });
      changelog[0].chObjs.forEach(function(this: GameCanvas, obj: ChangelogByObject): void {
        if (obj.t == "player" && this.mech && obj.x && obj.y) {
          // мы должны пересоздать спрайт, чтобы он всегда был на верхнем слое
          this.mech.destroy();
          this.mechSetup(obj.x, obj.y);
        } else {
          this.newMapObj(obj.id, obj.t, obj.x, obj.y);
        }
      }, this);
      if (this.mech) {
        // добавляем пересозданный спрайт в последнюю очередь
        this.viewport.addChild(this.mech);
      }
    }
  };
  mounted() {
    this.$el.appendChild(this.app.view);
    this.viewportSetup();
    this.app.loader
      .add("/images/spritesheet.json")
      .load((loader: PIXI.Loader, resources: Partial<Record<string, PIXI.LoaderResource>>) => {
        this.$store.commit("newRandomUser");
        this.wsConnect(this.$store.state.userId);
        if (resources["/images/spritesheet.json"]!.spritesheet) {
          sheet = resources["/images/spritesheet.json"]!.spritesheet;
        } else {
          console.error("Can't load spritesheet");
          return;
        }
        const mech = this.mechSetup(xShift, yShift);

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
        maxWidth: worldWide
      })
      .zoom(2000)
      // .zoom(1)
      .moveCenter(xShift, yShift)
      .drag()
      .pinch()
      .wheel()
      .decelerate();
  }

  mechSetup(x: number, y: number): PIXI.Container {
    this.mechBase = new PIXI.Sprite(sheet.textures["mech_base.png"]);
    this.mechWeaponCannon = new PIXI.Sprite(sheet.textures["cannon.png"]);

    this.mechBase.anchor.set(0.5);

    this.mech = new PIXI.Container();
    this.mech.pivot.set(0.5);
    this.mech.x = x;
    this.mech.y = y;
    this.mech.vx = 0;
    this.mech.vy = 0;
    this.mech.vr = 0;
    this.mech.rotation = 0;

    this.mechWeaponCannon.vr = 0;
    this.mechWeaponCannon.rotation = 0;
    // смещаем башню немного, потому что она не по центру меха
    this.mechWeaponCannon.x = -10;

    this.mech.addChild(this.mechBase);
    this.mech.addChild(this.mechWeaponCannon);

    this.drawBoundsForObj(this.mech);
    this.drawCollisionCircleForObj(this.mech, 100);
    return this.mech;
  }

  newMapObj(id: number, type: string, x: number = 0, y: number = 0): void {
    let obj: GameSpriteObj;
    let xelon: PIXI.AnimatedSprite;
    switch (type) {
      case "rock":
        obj = new PIXI.Sprite(sheet.textures[`rock${getRandomInt(1, 3)}.png`]);
        break;
      case "xelon":
        xelon = new PIXI.AnimatedSprite(sheet.animations["k"]);
        xelon.animationSpeed = 0.167;
        xelon.play();
        obj = xelon;
        break;
      case "enemy_mech":
        obj = new PIXI.Container();
        obj.pivot.set(0.5);
        obj.addChild(new PIXI.Sprite(sheet.textures[`enemy_base.png`]));
        obj.addChild(new PIXI.Sprite(sheet.textures[`enemy_cannon.png`]));
        break;
      default:
        throw new Error("Unsupported object type: " + type);
    }

    obj.x = x;
    obj.y = y;

    this.drawBoundsForObj(obj);
    this.drawCollisionCircleForObj(obj, 100);

    this.objects.set(id, obj);
    this.viewport.addChild(obj);
  }

  cleanMap(): void {
    this.missiles.forEach((missile: GameSpriteObj) => missile.destroy());
    this.missiles = new Map();
    this.objects.forEach((objects: GameSpriteObj) => objects.destroy());
    this.objects = new Map();
  }

  drawBoundsForObj(obj: GameSpriteObj): void {
    if (!this.debug) {
      return;
    }
    let spriteBound = new PIXI.Graphics();
    spriteBound.lineStyle(4, 0xfeeb77, 1);
    spriteBound.drawRect(0 - obj.width / 2, 0 - obj.height / 2, obj.width, obj.height);
    obj.addChild(spriteBound);
  }

  drawCollisionCircleForObj(obj: GameSpriteObj, radius: number): void {
    if (!this.debug) {
      return;
    }
    let collisionCircle = new PIXI.Graphics();
    collisionCircle.lineStyle(4, 0x00eb77, 1);
    collisionCircle.drawCircle(0, 0, radius);
    obj.addChild(collisionCircle);
  }

  explode(x: number = 0, y: number = 0): void {
    const explosion = new PIXI.AnimatedSprite(sheet.animations["e"]);
    explosion.x = x;
    explosion.y = y;
    explosion.loop = false;
    explosion.onComplete = function() {
      this.destroy();
    };
    explosion.animationSpeed = 0.167;
    explosion.play();
    this.viewport.addChild(explosion);
  }

  destroyMissile(id: number, missile: GameSpriteObj) {
    this.explode(missile.x, missile.y);
    missile.destroy();
    this.missiles.delete(id);
  }

  newMissile(id: number, x: number = 0, y: number = 0, rotation: number = 0): GameSpriteObj {
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
    return missile;
  }

  mapSetup(): PIXI.TilingSprite {
    const terra = new PIXI.TilingSprite(sheet.textures["terra_256.png"], worldWide, worldWide);
    terra.anchor.set(0);
    return terra;
  }

  gameLoop(): void {
    if (!this.mech || !this.mechWeaponCannon) {
      return;
    }
    this.mech.x += this.mech.vx;
    this.mech.y += this.mech.vy;
    this.viewport.moveCenter(this.mech.x, this.mech.y);
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
    let missile: GameSpriteObj | undefined;
    let wasPlayerPrediction = false;

    changelogToRun[this.changelogCurrIndex].chObjs.forEach((change: ChangelogByObject) => {
      switch (change.t) {
        case "player":
          if (!this.mech || !this.mechWeaponCannon) {
            return;
          }
          this.mech.vx = !change.x ? 0 : (change.x - this.mech.x) / f;
          this.mech.vy = !change.y ? 0 : (change.y - this.mech.y) / f;
          if (change.a) {
            let da = change.a - this.mech.rotation;
            if (da > 1.5 * Math.PI) {
              da = da - 2 * Math.PI;
            } else if (da < -1.5 * Math.PI) {
              da = da + 2 * Math.PI;
            }
            this.mech.vr = da / f;
          } else {
            this.mech.vr = 0;
          }
          this.mechWeaponCannon.vr = !change.ca ? 0 : (change.ca - this.mechWeaponCannon.rotation) / f;
          wasPlayerPrediction = true;
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

    if (!wasPlayerPrediction) {
      this.clearMechPredictions();
    }
  }

  clearPredictions(): void {
    this.clearMechPredictions();
    for (let m of this.missiles.values()) {
      m.vx = 0;
      m.vy = 0;
      m.vr = 0;
    }
  }

  clearMechPredictions(): void {
    if (!this.mech || !this.mechWeaponCannon) {
      return;
    }
    this.mech.vx = 0;
    this.mech.vy = 0;
    this.mech.vr = 0;
    this.mechWeaponCannon.vr = 0;
  }

  applyMapToObj(change: ChangelogByObject, obj: GameSpriteObj | undefined, map: ChangeMap): void {
    if (!obj) {
      console.error("Attempt to apply change to a non-object");
      return;
    }
    let k: string;
    for (k in map) {
      const fieldName = map[k];
      if (change[k] && fieldName) {
        obj[fieldName] = change[k];
      }
    }
  }

  runChange(change: ChangelogByObject): void {
    let missile: GameSpriteObj | undefined;
    let enemyMech: GameSpriteObj | undefined;
    if (change.did) {
      const obj = this.objects.get(change.did);
      if (obj) {
        obj.destroy();
        this.objects.delete(change.did);
      }
    }
    switch (change.t) {
      case "player":
        this.applyMapToObj(change, this.mech, mechChangelogMap);
        this.applyMapToObj(change, this.mechWeaponCannon, cannonChangelogMap);
        break;
      case "missile":
        missile = this.missiles.get(change.id);
        if (!missile) {
          missile = this.newMissile(change.id, change.x, change.y, change.a);
        }
        if (change.d) {
          this.destroyMissile(change.id, missile);
        } else {
          this.applyMapToObj(change, missile, missileChangelogMap);
        }
        break;
      case "enemy_mech":
        enemyMech = this.objects.get(change.id);
        if (!enemyMech) {
          console.log("change on non existed obj:", change);
        }
        this.applyMapToObj(change, enemyMech, missileChangelogMap);
        break;
    }
  }
}
</script>

<style scoped></style>
