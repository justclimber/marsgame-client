<template>
  <div>
    <div ref="pixiContainer"></div>
    <div class="controls">
      <button @click="saveGame">Save game</button>
      <button @click="loadGame">Load game</button>
      <button class="spacer" @click="playerButton('prevMore')">&#171;</button>
      <button @click="playerButton('prev')">&#8249;</button>
      <button @click="playerButton('stop')">■</button>
      <button @click="playerButton('play')">▶</button>
      <button @click="playerButton('next')">&#8250;</button>
      <button @click="playerButton('nextMore')">&#187;</button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";
import { WalBuffers } from "@/flatbuffers/log_generated";
import * as Wal from "@/lib/wal/wall";

const worldWide = 30000;
const xShift = 10000;
const yShift = 10000;
const timeShiftForPrediction = 1500;

let timer = new Date();
let currTimeId: number;
let changelogToRun: ChangelogByTime[] = [];
let gameHistory: Wal.GameHistory = { timeIds: [], moments: new Map(), timeToStart: 0 };
let sheet: PIXI.Spritesheet;

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * Math.floor(max)) + min;
}

type GameSpriteObj = PIXI.Sprite | PIXI.AnimatedSprite | PIXI.Container;

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

enum GameState {
  paused = 0,
  play = 1
}

PIXI.utils.skipHello();

@Component
export default class GameCanvas extends Vue {
  $refs!: { pixiContainer: HTMLDivElement };
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
  historyCursor: number = 0;
  debug: boolean = false;
  walParser: Wal.Wall = new Wal.Wall();
  gameState: GameState = GameState.paused;
  wsCommands = {
    worldChangesWal(this: GameCanvas, wal: WalBuffers.Log) {
      let gameHistoryChunk = this.walParser.parseWal(wal);
      // console.log(gameHistoryChunk);
      if (!currTimeId) {
        // use time shift for more smooth prediction: we need changelogToRun always be not empty on run
        currTimeId = gameHistoryChunk.timeToStart - timeShiftForPrediction;
        this.gameState = GameState.play;
      }
      gameHistory.moments = new Map([...gameHistory.moments, ...gameHistoryChunk.moments]);
      // Object.assign(gameHistory.moments, gameHistoryChunk.moments);
      gameHistory.timeIds.push(...gameHistoryChunk.timeIds);
      console.log(gameHistory);
    },
    worldInit(this: GameCanvas, changelog: ChangelogByTime[]) {
      changelogToRun = [];
      currTimeId = 0;
      this.historyCursor = 0;
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
    this.$refs.pixiContainer.appendChild(this.app.view);
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
    if (!this.mech || !this.mechWeaponCannon || this.gameState == GameState.paused) {
      return;
    }
    let now = new Date();
    let timeDelta = now.getTime() - timer.getTime();
    timer = now;
    const dt = timeDelta / 1000;

    this.mech.x += this.mech.vx * dt;
    this.mech.y += this.mech.vy * dt;
    this.viewport.moveCenter(this.mech.x, this.mech.y);
    this.mech.rotation += this.mech.vr * dt;
    // this.mechWeaponCannon.rotation += this.mechWeaponCannon.vr;
    for (let m of this.missiles.values()) {
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.rotation += m.vr * dt;
    }

    this.gameHistoryPlay(timeDelta);
  }

  gameHistoryPlay(timeDelta: number) {
    currTimeId += timeDelta;
    if (this.historyCursor >= gameHistory.timeIds.length) {
      this.clearPredictions();
      return;
    }

    if (gameHistory.timeIds[this.historyCursor] > currTimeId) {
      // wait for future
      return;
    }
    const timeId = gameHistory.timeIds[this.historyCursor++];

    gameHistory.moments.get(timeId)!.objects.forEach(this.playHistoryObject, this);
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

  playHistoryObject(snapshot: Wal.ObjectSnapshotUnion): void {
    let object: GameSpriteObj | undefined;
    if (snapshot.obj.deleteOtherIds) {
      this.deleteOthers(snapshot);
    }
    switch (snapshot.obj.objectType) {
      case WalBuffers.ObjectType.player:
        if (!this.mech || !this.mechWeaponCannon) {
          break;
        }
        object = this.mech;
        this.mechWeaponCannon.rotation = (snapshot as Wal.MechSnapshot).cannonAngle;
        this.mechWeaponCannon.vr = (snapshot as Wal.MechSnapshot).cannonRotation;
        break;
      case WalBuffers.ObjectType.missile:
        object = this.missiles.get(snapshot.obj.id);
        if (!object) {
          object = this.newMissile(snapshot.obj.id, snapshot.obj.x, snapshot.obj.y, snapshot.obj.angle);
        }
        if (snapshot.obj.isDelete) {
          this.destroyMissile(snapshot.obj.id, object);
          object = undefined;
        }
        break;
      case WalBuffers.ObjectType.enemy_mech:
        object = this.objects.get(snapshot.obj.id);
        if (!object) {
          console.log("object on non existed obj:", snapshot);
          break;
        }
        break;
    }
    if (object) {
      object.x = snapshot.obj.x;
      object.y = snapshot.obj.y;
      object.rotation = snapshot.obj.angle;

      object.vx = snapshot.obj.velocityLen * Math.cos(snapshot.obj.angle);
      object.vy = snapshot.obj.velocityLen * Math.sin(snapshot.obj.angle);
      object.vr = snapshot.obj.velocityRotation;
    }
  }

  deleteOthers(snapshot: Wal.ObjectSnapshotUnion): void {
    snapshot.obj.deleteOtherIds.forEach((did: number) => {
      const obj = this.objects.get(did);
      if (obj) {
        obj.destroy();
        this.objects.delete(did);
      }
    }, this);
  }
  saveGame(): void {
    localStorage.setItem("gameHistory", JSON.stringify(gameHistory));
    this.$store.commit("addConsoleInfo", "Game saved");
    console.log(gameHistory);
  }
  loadGame(): void {
    const raw = localStorage.getItem("gameHistory");
    if (raw) {
      gameHistory = JSON.parse(raw, Map.fromJSON);
      console.log(gameHistory);
      currTimeId = 1;
      this.historyCursor = 0;
    }
    this.$store.commit("addConsoleInfo", "Game loaded");
  }
  playerButton(code: string): void {
    switch (code) {
      case "prevMore":
        //sdf
        break;
      case "prev":
        //sdf
        break;
      case "stop":
        this.gameState = GameState.paused;
        break;
      case "play":
        this.gameState = GameState.play;
        break;
      case "next":
        //sdf
        break;
      case "nextMore":
        //sdf
        break;
    }
  }
}

Map.prototype.toJSON = function() {
  return ["window.Map", Array.from(this.entries())];
};
Map.fromJSON = function(key: any, value: any) {
  return value instanceof Array && value[0] == "window.Map" ? new Map(value[1]) : value;
};
</script>

<style scoped lang="stylus">
.spacer
  margin-left 120px
</style>
