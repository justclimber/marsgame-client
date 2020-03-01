<template>
  <div class="timeline-container">
    <div
      class="timeline"
      @mousemove="hoverTimeLine"
      @mouseenter="hoverTimeLineEnter"
      @mouseleave="hoverTimeLineLeave"
      ref="timeline"
    >
      <div class="current" :style="currentBarStyle()"></div>
      <div class="position-info">{{ currentPos }} / {{ totalPos }}</div>
    </div>
    <div
      class="position-chooser-popup"
      :style="positionChooserPopupStyle()"
      v-show="chooserPopup.show"
      @mouseenter="hoverPositionChooserPopupEnter"
      @mouseleave="hoverPositionChooserPopupLeave"
    >
      <div class="time-id" v-for="(timeId, i) in chooserPopup.timeIdsSlice" :key="`timeId-${i}`">
        <div class="time-text">{{ timeId }}</div>
        <div class="time-bar" @click="chooseTimeId(timeId)">&nbsp;</div>
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
  $refs!: {timeline: HTMLDivElement};
  chooserPopup: ChooserPopup = {
    show: false,
    left: 1000,
    top: 677,
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
  hoverTimeLine(event: any): void {
    this.chooserPopup.left = event.clientX - 90;
    if (!this.timeIds) {
      return;
    }
    const timeIdsCount = this.timeIds.length;
    const percentage = event.offsetX / this.$refs.timeline.offsetWidth;
    let posToStart = Math.round(timeIdsCount * percentage) - 10;
    if (posToStart < 0) {
      posToStart = 0;
    }
    this.chooserPopup.timeIdsSlice = this.timeIds.slice(posToStart, posToStart + 10);
  }
  chooseTimeId(timeId: number): void {
    this.$emit("choose-time-id", timeId);
  }

  hoverTimeLineEnter(): void {
    this.chooserPopup.show = true;
  }
  hoverTimeLineLeave(): void {
    this.chooserPopup.show = false;
  }
  hoverPositionChooserPopupEnter(): void {
    this.chooserPopup.show = true;
  }
  hoverPositionChooserPopupLeave(): void {
    this.chooserPopup.show = false;
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
  width 175px
  height 47px
  border 2px solid panels-border-color
  background main-bg
  z-index 5
  display flex
  flex-direction row
  .time-id
    height 25px
    width 3px
    margin-right 13px
    .time-text
      font-size 9px
      transform rotate(-45deg)
      padding-top 20px
    .time-bar
      width 5px
      background active-element-color
      height 15px
      cursor pointer
</style>
