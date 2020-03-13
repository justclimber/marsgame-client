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
import GraphicsEngine from "@/lib/graphics";
import flatbuffers from "flatbuffers";
import {WalBuffers} from "@/flatbuffers/log_generated";
import {CommandsBuffer} from "@/flatbuffers/command_generated";
import * as Wal from "@/lib/wal";
import * as Init from "@/lib/init";
import EntityManager from "@/lib/entity/entityManager";
import Entity from "@/lib/entity/entity";
import {Components} from "@/lib/component/components";
import WithCannon from "@/lib/component/withCannon";
import Movable from "@/lib/component/movable";
import Renderable from "@/lib/component/renderable";
import Textable from "@/lib/component/textable";

const timeShiftForPrediction = 1500;

let prevNow = new Date();
let currTimeId: number = 0;

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * Math.floor(max)) + min;
}

enum GameState {
  paused = 0,
  play = 1,
}

@Component({
  components: {HistoryTimeLine},
})
export default class GameEngine extends Vue {
  $refs!: {pixiContainer: HTMLDivElement};
  graphics = new GraphicsEngine();
  em: EntityManager = new EntityManager();
  historyCursor: number = 0;
  walParser: Wal.Parser = new Wal.Parser();
  gameState: GameState = GameState.paused;
  currTimeIdByCursor: number = 0;
  lastTimeId: number = 0;
  timerTextId: number = 0;
  playSpeedMultiplicator: number = 1;
  gameHistory: Wal.GameHistory = {timeIds: [], moments: new Map(), timeToStart: 0};
  wsBuffers = [
    {
      command: CommandsBuffer.Command.Wal,
      fn(this: GameEngine, buf: flatbuffers.flatbuffers.ByteBuffer) {
        let gameHistoryChunk = this.walParser.parse(buf);
        if (!currTimeId) {
          // use time shift for more smooth prediction
          currTimeId = gameHistoryChunk.timeToStart - timeShiftForPrediction;
          this.gameState = GameState.play;
        }
        this.gameHistory.moments = new Map([...this.gameHistory.moments, ...gameHistoryChunk.moments]);
        this.gameHistory.timeIds.push(...gameHistoryChunk.timeIds);
        this.lastTimeId = gameHistoryChunk.timeIds[gameHistoryChunk.timeIds.length - 1];
      },
    },
    {
      command: CommandsBuffer.Command.Init,
      fn(this: GameEngine, buf: flatbuffers.flatbuffers.ByteBuffer) {
        const initData = new Init.Parser().parse(buf);
        this.graphics.mapSetup(initData.worldMap);
        let timeLeft = initData.timer.value;
        let intervalId = setInterval(() => {
          (this.em.entities.get(this.timerTextId)!.components.get(Components.Textable) as Textable).setText(
            "Time left: " + timeLeft + " sec",
          );
          if (timeLeft-- === 0) {
            clearInterval(intervalId);
          }
        }, 1000);
      },
    },
  ];

  mounted() {
    this.bootstrap();
  }

  async bootstrap(): Promise<any> {
    this.$store.commit("newRandomUser");
    const userId = this.$store.state.userId;
    this.wsConnect(userId);

    await this.graphics.bootstrap(this.$refs.pixiContainer, this.gameLoop, this.em);

    this.graphics.playerSetup(userId, 0, 0);
    this.timerTextId = this.graphics.timerSetup();
  }

  createObj(id: number, type: WalBuffers.ObjectType, x: number = 0, y: number = 0): Entity {
    let entity: Entity | undefined = undefined;
    switch (type) {
      case WalBuffers.ObjectType.rock:
        entity = this.em.createRock(id, x, y, this.graphics.resources.getTexture(`rock${getRandomInt(1, 3)}`));
        break;
      case WalBuffers.ObjectType.spore:
        entity = this.em.createSpore(id, x, y, this.graphics.resources.getTexture("spore"));
        break;
      case WalBuffers.ObjectType.xelon:
        entity = this.em.createXelon(id, x, y, this.graphics.resources.getTexture("xelon"));
        break;
      case WalBuffers.ObjectType.enemy_mech:
        entity = this.em.createMech(id, x, y, [
          this.graphics.resources.getTexture("enemyBase"),
          this.graphics.resources.getTexture("enemyCannon"),
        ]);
        break;
      case WalBuffers.ObjectType.missile:
        entity = this.em.createMissile(id, x, y, this.graphics.resources.getTexture("missile"));
        break;
      default:
        throw new Error("Unsupported object type: " + type);
    }

    this.graphics.addEntity(entity);

    return entity;
  }

  gameLoop(timeDelta: number): void {
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
    let player: Entity | undefined = undefined;
    for (let entity of this.em.entities.values()) {
      const movable = entity.components.get(Components.Movable) as Movable;
      if (!movable) {
        continue;
      }
      movable.x += movable.velocityX * dt;
      movable.y += movable.velocityY * dt;
      movable.angle += movable.velocityRotation * dt;
      if (entity.id == this.$store.state.userId) {
        player = entity;
      }
    }
  }

  gameHistoryPlayByCursor(cursor: number) {
    this.currTimeIdByCursor = this.gameHistory.timeIds[cursor];
    this.gameHistory.moments.get(this.currTimeIdByCursor)!.objects.forEach(this.playHistoryObject, this);
  }

  playHistoryObject(snapshot: Wal.ObjectSnapshotUnion): void {
    let object: Entity | undefined;
    if (snapshot.obj.deleteOtherIds) {
      this.deleteOthers(snapshot);
    }
    object = this.em.entities.get(snapshot.obj.id);
    if (!object) {
      object = this.createObj(snapshot.obj.id, snapshot.obj.objectType, snapshot.obj.x, snapshot.obj.y);
    }
    const movable = object.components.get(Components.Movable) as Movable;
    const renderable = object.components.get(Components.Renderable) as Renderable;

    if (snapshot.obj.objectType === WalBuffers.ObjectType.player) {
      const withCannon = object.components.get(Components.WithCannon) as WithCannon;
      withCannon.angle = (snapshot as Wal.MechSnapshot).cannonAngle;
      withCannon.velocityRotation = (snapshot as Wal.MechSnapshot).cannonRotation;
    }

    if (movable) {
      movable.x = snapshot.obj.x;
      movable.y = snapshot.obj.y;
      movable.angle = snapshot.obj.angle;

      movable.velocityX = snapshot.obj.velocityLen * Math.cos(snapshot.obj.angle);
      movable.velocityY = snapshot.obj.velocityLen * Math.sin(snapshot.obj.angle);
      movable.velocityRotation = snapshot.obj.velocityRotation;

      if (snapshot.obj.explode) {
        this.graphics.makeExplosion(movable.x, movable.y);
      }
    }

    if (snapshot.obj.isDelete) {
      renderable.sprite!.destroy();
      this.em.entities.delete(snapshot.obj.id);
    }
  }

  deleteOthers(snapshot: Wal.ObjectSnapshotUnion): void {
    snapshot.obj.deleteOtherIds.forEach((did: number) => {
      const obj = this.em.entities.get(did);
      if (obj) {
        (obj.components.get(Components.Renderable) as Renderable).sprite!.destroy();
        this.em.entities.delete(did);
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
      this.em.reset();
      this.graphics.playerSetup(this.$store.state.userId, 0, 0);
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
        this.em.reset();
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
