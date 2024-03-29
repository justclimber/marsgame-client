<template>
  <div class="timeline-container">
    <div
      class="timeline"
      @mousemove="hoverTimeLine"
      @mouseenter="showChooserPopup"
      @mouseleave="hideChooserPopup"
      @click="chooseFromTimeline"
      ref="timeline"
    >
      <div class="current" :style="currentBarStyle()"></div>
      <div class="position-info">{{ roundToSecond(currentPos) }} / {{ roundToSecond(totalPos) }} sec</div>
    </div>
    <div
      class="position-chooser-popup"
      :style="positionChooserPopupStyle()"
      v-show="chooserPopup.show"
      @mouseenter="showChooserPopup"
      @mouseleave="hideChooserPopup"
      ref="chooserPopup"
    >
      <div class="time-id" v-for="(timeId, i) in timeIds" :key="`timeId-${i}`">
        <div class="time-text">{{ roundToSecond(timeId) }}</div>
        <div class="time-bar" @click="chooseTimeId(timeId)" :class="{active: timeId === currentPos}">&nbsp;</div>
      </div>
    </div>
    <div class="controls">
      <button @click="$emit('save-game')" class="big-icon">💾</button>
      <button @click="$emit('load-game')" class="big-icon">&#128193;</button>
      <button class="spacer1" @click="playerButton('prevMore')">&#171;</button>
      <button @click="playerButton('prev')">&#8249;</button>
      <button @click="playerButton('stop')">■</button>
      <button @click="playerButton('play')">▶</button>
      <button @click="playerButton('next')">&#8250;</button>
      <button @click="playerButton('nextMore')">&#187;</button>
      <span class="spacer2">Speed:</span>
      <button @click="$emit('play-speed', 1)" :class="{active: playSpeedMultiplicator === 1}">x1</button>
      <button @click="$emit('play-speed', 2)" :class="{active: playSpeedMultiplicator === 2}">x2</button>
      <button @click="$emit('play-speed', 3)" :class="{active: playSpeedMultiplicator === 3}">x3</button>
    </div>
  </div>
</template>

<script lang="ts">
import {Component, Prop, Vue} from "vue-property-decorator";

interface ChooserPopup {
  show: boolean;
  left: number;
  top: number;
  timeIdsSlice: number[];
}
enum GameState {
  paused = 0,
  play = 1,
}
@Component
export default class HistoryTimeLine extends Vue {
  @Prop(Number) readonly cursor: number | undefined;
  @Prop(Number) readonly playSpeedMultiplicator: number | undefined;
  @Prop(Number) readonly currentPos: number | undefined;
  @Prop(Number) readonly totalPos: number | undefined;
  @Prop(Array) readonly timeIds: number[] | undefined;
  $refs!: {
    timeline: HTMLDivElement;
    chooserPopup: HTMLDivElement;
  };
  chooserPopup: ChooserPopup = {
    show: false,
    left: 900,
    top: 579,
    timeIdsSlice: [],
  };
  get currentBarStyle() {
    return () => {
      return {
        width: (this.currentPos && this.totalPos ? (this.currentPos / this.totalPos) * 100 : 0) + "%",
      };
    };
  }
  get positionChooserPopupStyle() {
    return () => {
      return {
        left: this.chooserPopup.left + "px",
        top: this.chooserPopup.top + "px",
      };
    };
  }
  roundToSecond(value?: number): string {
    return value ? (value / 1000).toFixed(1) : "0";
  }
  hoverTimeLine(event: any): void {
    if (!this.timeIds) {
      return;
    }
    const percentage = event.offsetX / this.$refs.timeline.offsetWidth;
    this.$refs.chooserPopup.scrollLeft = this.$refs.chooserPopup.scrollWidth * percentage - 150;
  }
  chooseTimeId(timeId: number): void {
    this.$emit("choose-time-id", timeId);
  }
  chooseFromTimeline(event: any) {
    if (!this.timeIds) {
      return;
    }
    const percentage = event.offsetX / this.$refs.timeline.offsetWidth;
    const timeIdPos = Math.floor(this.timeIds.length * percentage);
    this.$emit("choose-time-id", this.timeIds[timeIdPos]);
  }
  hideChooserPopup(): void {
    this.chooserPopup.show = false;
  }
  showChooserPopup(): void {
    this.chooserPopup.left = this.$refs.timeline.offsetLeft;
    this.chooserPopup.show = true;
  }
  pickSiblingTimeId(interval: number): void {
    if (
      this.cursor &&
      this.timeIds &&
      this.cursor + interval - 1 <= this.timeIds.length &&
      this.cursor + interval - 1 >= 0
    ) {
      this.chooseTimeId(this.timeIds[this.cursor + interval - 1]);
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
        this.$emit("play-state", GameState.paused);
        break;
      case "play":
        this.$emit("play-state", GameState.play);
        break;
      case "next":
        this.pickSiblingTimeId(1);
        break;
      case "nextMore":
        this.pickSiblingTimeId(5);
        break;
    }
  }
}
</script>

<style scoped lang="stylus">
@import "../assets/style/variables.styl"
.timeline
  width 100%
  height 20px
  border 1px solid panels-border-color
  margin-bottom 2px
  cursor pointer
  .current
    width 30%
    height 70%
    background active-element-bg-color
    margin 3px
  .position-info
    text-align center
    color active-element-color
    margin-top -18px
    font-size main-font-size
.position-chooser-popup
  position absolute
  width 600px
  height 45px
  border 2px solid panels-border-color
  background main-bg
  z-index 5
  display flex
  flex-direction row
  padding 1px 1px 2px 5px
  overflow hidden
  .time-id
    height 25px
    width 3px
    margin-right 14px
    .time-text
      font-size 10px
      transform rotate(-45deg)
      padding-top 17px
      margin-left -7px
    .time-bar
      width 5px
      background panels-border-color
      height 15px
      cursor pointer
      &.active
        background active-element-color
.controls
  font-size 12px
  .big-icon
    font-size 10px
.spacer1
  margin-left 130px
.spacer2
  margin-left 75px
</style>
