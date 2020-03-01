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
@Component
export default class HistoryTimeLine extends Vue {
  @Prop(Number) readonly currentPos: number | undefined;
  @Prop(Number) readonly totalPos: number | undefined;
  @Prop(Array) readonly timeIds: number[] | undefined;
  $refs!: {
    timeline: HTMLDivElement;
    chooserPopup: HTMLDivElement;
  };
  chooserPopup: ChooserPopup = {
    show: false,
    left: 904,
    top: 573,
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
    this.chooserPopup.show = true;
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
  width 595px
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
</style>
