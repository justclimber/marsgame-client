<template>
  <div class="paper container" id="pixiDiv"></div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";

let xShift = 1000;
let yShift = 1000;
let timeShiftForPrediction = 1500;
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
    width: 700
  });
  viewport = new Viewport({
    screenWidth: 700,
    screenHeight: 600,
    worldWidth: 3000,
    worldHeight: 2000,
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
      .load((loader: PIXI.Loader, resources: Partial<Record<string, PIXI.LoaderResource>>) => {
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

  mechSetup(): PIXI.Container {
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

  newMapObj(id: number, x: number = 0, y: number = 0): void {
    let spriteName = `rock${getRandomInt(1, 3)}.png`;
    let obj = new PIXI.Sprite(sheet.textures[spriteName]);

    obj.x = x;
    obj.y = y;

    this.drawBoundsForObj(obj);
    this.drawCollisionCircleForObj(obj, 100);

    this.objects.set(id, obj);
    this.viewport.addChild(obj);
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

  destroyMissile(missile: GameSpriteObj) {
    this.explode(missile.x, missile.y);
    missile.destroy();
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
          this.mech.vr = !change.a ? 0 : (change.a - this.mech.rotation) / f;
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
    switch (change.t) {
      case "player":
        this.applyMapToObj(change, this.mech, mechChangelogMap);
        this.applyMapToObj(change, this.mechWeaponCannon, cannonChangelogMap);
        break;
      case "missile":
        if (change.did) {
          const obj = this.objects.get(change.did);
          if (obj) {
            obj.destroy();
          }
        }
        missile = this.missiles.get(change.id);
        if (!missile) {
          missile = this.newMissile(change.id, change.x, change.y, change.a);
        }
        if (change.d) {
          this.destroyMissile(missile);
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
