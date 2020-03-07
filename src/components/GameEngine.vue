<template>
  <div>
    <div ref="pixiContainer"></div>
    <HistoryTimeLine
      :current-pos="currTimeIdByCursor"
      :total-pos="lastTimeId"
      :time-ids="gameHistory.timeIds"
      @choose-time-id="chooseTimeId"
    />
    <div class="controls">
      <button @click="saveGame" class="big-icon">💾</button>
      <button @click="loadGame" class="big-icon">&#128193;</button>
      <button class="spacer1" @click="playerButton('prevMore')">&#171;</button>
      <button @click="playerButton('prev')">&#8249;</button>
      <button @click="playerButton('stop')">■</button>
      <button @click="playerButton('play')">▶</button>
      <button @click="playerButton('next')">&#8250;</button>
      <button @click="playerButton('nextMore')">&#187;</button>
      <span class="spacer2">Speed:</span>
      <button @click="playerSpeedChange(1)" :class="{active: playSpeedMultiplicator === 1}">x1</button>
      <button @click="playerSpeedChange(2)" :class="{active: playSpeedMultiplicator === 2}">x2</button>
      <button @click="playerSpeedChange(3)" :class="{active: playSpeedMultiplicator === 3}">x3</button>
    </div>
  </div>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator";
import HistoryTimeLine from "@/components/HistoryTimeLine.vue";

import * as PIXI from "pixi.js";
import GraphicsEngine from "@/lib/graphics";

import {flatbuffers} from "flatbuffers";
import {WalBuffers} from "@/flatbuffers/log_generated";
import {CommandsBuffer} from "@/flatbuffers/command_generated";
import * as Wal from "@/lib/wal";
import * as Init from "@/lib/init";

const xShift = 10000;
const yShift = 10000;
const timeShiftForPrediction = 1500;

let prevNow = new Date();
let currTimeId: number = 0;
let sheet: PIXI.Spritesheet;

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * Math.floor(max)) + min;
}

type GameSpriteObj = PIXI.Sprite | PIXI.AnimatedSprite | PIXI.Container;

type MapGameSpriteObj = Map<number, GameSpriteObj>;

enum GameState {
  paused = 0,
  play = 1,
}

PIXI.utils.skipHello();
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

@Component({
  components: {HistoryTimeLine},
})
export default class GameEngine extends Vue {
  $refs!: {pixiContainer: HTMLDivElement};
  app = new GraphicsEngine();
  objects: MapGameSpriteObj = new Map();
  mech?: PIXI.Container = undefined;
  mechBase?: PIXI.Sprite = undefined;
  mechWeaponCannon?: PIXI.Sprite = undefined;
  timerText?: PIXI.Text = undefined;
  historyCursor: number = 0;
  debug: boolean = false;
  walParser: Wal.Parser = new Wal.Parser();
  gameState: GameState = GameState.paused;
  currTimeIdByCursor: number = 0;
  lastTimeId: number = 0;
  playSpeedMultiplicator: number = 1;
  gameHistory: Wal.GameHistory = {timeIds: [], moments: new Map(), timeToStart: 0};
  wsBuffers = [
    {
      command: CommandsBuffer.Command.Wal,
      fn(this: GameEngine, buf: flatbuffers.ByteBuffer) {
        let gameHistoryChunk = this.walParser.parse(buf);
        // console.log(gameHistoryChunk);
        if (!currTimeId) {
          // use time shift for more smooth prediction
          currTimeId = gameHistoryChunk.timeToStart - timeShiftForPrediction;
          this.gameState = GameState.play;
        }
        this.gameHistory.moments = new Map([...this.gameHistory.moments, ...gameHistoryChunk.moments]);
        this.gameHistory.timeIds.push(...gameHistoryChunk.timeIds);
        this.lastTimeId = gameHistoryChunk.timeIds[gameHistoryChunk.timeIds.length - 1];
        // console.log(gameHistory);
      },
    },
    {
      command: CommandsBuffer.Command.Init,
      fn(this: GameEngine, buf: flatbuffers.ByteBuffer) {
        const initData = new Init.Parser().parse(buf);

        let timeLeft = initData.timer.value;
        let intervalId = setInterval(() => {
          this.timerText!.text = "Time left: " + timeLeft + " sec";
          if (timeLeft-- === 0) {
            clearInterval(intervalId);
          }
        }, 1000);
      },
    },
  ];
  mounted() {
    this.$store.commit("newRandomUser");
    this.wsConnect(this.$store.state.userId);

    this.app.bootstrap(this.$refs.pixiContainer, this.gameLoop, (sh: PIXI.Spritesheet) => {
      sheet = sh;
      this.app.viewport.addChild(this.mechSetup(xShift, yShift));
      this.timerText = this.app.timerSetup();
    });
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

  newMapObj(id: number, type: WalBuffers.ObjectType, x: number = 0, y: number = 0): GameSpriteObj {
    let obj: GameSpriteObj;
    let xelon: PIXI.AnimatedSprite;
    let missile: PIXI.AnimatedSprite;
    switch (type) {
      case WalBuffers.ObjectType.rock:
        obj = new PIXI.Sprite(sheet.textures[`rock${getRandomInt(1, 3)}.png`]);
        break;
      case WalBuffers.ObjectType.xelon:
        xelon = new PIXI.AnimatedSprite(sheet.animations["k"]);
        xelon.animationSpeed = 0.167;
        xelon.play();
        obj = xelon;
        break;
      case WalBuffers.ObjectType.enemy_mech:
        obj = new PIXI.Container();
        obj.pivot.set(0.5);
        obj.addChild(new PIXI.Sprite(sheet.textures[`enemy_base.png`]));
        obj.addChild(new PIXI.Sprite(sheet.textures[`enemy_cannon.png`]));
        break;
      case WalBuffers.ObjectType.missile:
        missile = new PIXI.AnimatedSprite(sheet.animations["m"]);
        missile.animationSpeed = 0.167;
        missile.play();
        obj = missile;
        break;
      default:
        throw new Error("Unsupported object type: " + type);
    }

    obj.x = x;
    obj.y = y;

    this.drawBoundsForObj(obj);
    this.drawCollisionCircleForObj(obj, 100);

    this.objects.set(id, obj);
    this.app.viewport.addChild(obj);

    return obj;
  }

  cleanMap(): void {
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
    this.app.viewport.addChild(explosion);
  }

  gameLoop(): void {
    let now = new Date();
    let timeDelta = now.getTime() - prevNow.getTime();
    prevNow = now;

    if (this.gameState == GameState.paused) {
      return;
    }
    currTimeId += timeDelta * this.playSpeedMultiplicator;

    if (this.historyCursor >= this.gameHistory.timeIds.length) {
      this.gameState = GameState.paused;
      return;
    }

    this.doObjectsMovements(timeDelta / 1000);

    if (this.gameHistory.timeIds[this.historyCursor] > currTimeId) {
      // wait for a while
      return;
    }

    this.gameHistoryPlayByCursor(this.historyCursor++);
  }

  doObjectsMovements(dt: number): void {
    for (let m of this.objects.values()) {
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.rotation += m.vr * dt;
    }

    if (!this.mech || !this.mechWeaponCannon) {
      return;
    }
    this.mech.x += this.mech.vx * dt;
    this.mech.y += this.mech.vy * dt;
    this.app.viewport.follow(this.mech, {
      acceleration: 0.8,
      speed: 300,
    });
    this.mech.rotation += this.mech.vr * dt;
    // this.mechWeaponCannon.rotation += this.mechWeaponCannon.vr;
  }

  gameHistoryPlayByCursor(cursor: number) {
    this.currTimeIdByCursor = this.gameHistory.timeIds[cursor];
    this.gameHistory.moments.get(this.currTimeIdByCursor)!.objects.forEach(this.playHistoryObject, this);
  }

  playHistoryObject(snapshot: Wal.ObjectSnapshotUnion): void {
    let object: GameSpriteObj | undefined;
    if (snapshot.obj.deleteOtherIds) {
      this.deleteOthers(snapshot);
    }

    if (snapshot.obj.objectType === WalBuffers.ObjectType.player) {
      if (!this.mech || !this.mechWeaponCannon) {
        return;
      }
      object = this.mech;
      this.mechWeaponCannon.rotation = (snapshot as Wal.MechSnapshot).cannonAngle;
      this.mechWeaponCannon.vr = (snapshot as Wal.MechSnapshot).cannonRotation;
    } else {
      object = this.objects.get(snapshot.obj.id);
      if (!object) {
        object = this.newMapObj(snapshot.obj.id, snapshot.obj.objectType, snapshot.obj.x, snapshot.obj.y);
      }
    }

    if (object) {
      object.x = snapshot.obj.x;
      object.y = snapshot.obj.y;
      object.rotation = snapshot.obj.angle;

      object.vx = snapshot.obj.velocityLen * Math.cos(snapshot.obj.angle);
      object.vy = snapshot.obj.velocityLen * Math.sin(snapshot.obj.angle);
      object.vr = snapshot.obj.velocityRotation;

      if (snapshot.obj.explode) {
        this.explode(object.x, object.y);
      }
      if (snapshot.obj.isDelete) {
        object.destroy();
        this.objects.delete(snapshot.obj.id);
        object = undefined;
      }
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
    localStorage.setItem("gameHistory", JSON.stringify(this.gameHistory));
    this.$store.commit("addConsoleInfo", "Game saved");
    console.log(this.gameHistory);
  }
  loadGame(): void {
    const raw = localStorage.getItem("gameHistory");
    this.gameState = GameState.paused;
    if (raw) {
      this.gameHistory = JSON.parse(raw, Map.fromJSON);
      currTimeId = 1;
      this.historyCursor = 0;
      this.currTimeIdByCursor = this.gameHistory.timeIds[0];
      this.lastTimeId = this.gameHistory.timeIds[this.gameHistory.timeIds.length - 1];
      this.cleanMap();
      prevNow = new Date();
      this.gameState = GameState.play;
    }
    this.$store.commit("addConsoleInfo", "Game loaded");
  }
  chooseTimeId(timeId: number): void {
    this.gameState = GameState.paused;
    const timeIdsCount = this.gameHistory.timeIds.length;
    for (let i = 0; i < timeIdsCount; i++) {
      if (this.gameHistory.timeIds[i] === timeId) {
        this.cleanMap();
        this.historyCursor = i;
        currTimeId = timeId;
        prevNow = new Date();
        this.gameHistoryPlayByCursor(this.historyCursor++);
        return;
      }
    }
    throw Error("Wrong timeId to choose: " + timeId);
  }
  pickSiblingTimeId(interval: number): void {
    if (this.historyCursor + interval <= this.gameHistory.timeIds.length && this.historyCursor + interval >= 0) {
      this.chooseTimeId(this.gameHistory.timeIds[this.historyCursor + interval]);
    }
  }
  playerButton(code: string): void {
    switch (code) {
      case "prevMore":
        this.pickSiblingTimeId(-5);
        break;
      case "prev":
        this.pickSiblingTimeId(-1);
        break;
      case "stop":
        this.gameState = GameState.paused;
        break;
      case "play":
        this.gameState = GameState.play;
        break;
      case "next":
        this.pickSiblingTimeId(1);
        break;
      case "nextMore":
        this.pickSiblingTimeId(5);
        break;
    }
  }

  playerSpeedChange(speed: number): void {
    this.playSpeedMultiplicator = speed;
  }
}

// little magic for serializing to localStorage and back
Map.prototype.toJSON = function() {
  return ["window.Map", Array.from(this.entries())];
};
Map.fromJSON = function(key: any, value: any) {
  return value instanceof Array && value[0] == "window.Map" ? new Map(value[1]) : value;
};
</script>

<style scoped lang="stylus">
.controls
  font-size 12px
  .big-icon
    font-size 10px
.spacer1
  margin-left 130px
.spacer2
  margin-left 75px
</style>
