<template>
  <div class="timeline-container">
    <div class="timeline">
      <div class="current" :style="currentBarStyle()"></div>
      <div class="position-info">{{ currentPos }} / {{ totalPos }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import {Component, Prop, Vue} from "vue-property-decorator";

@Component
export default class HistoryTimeLine extends Vue {
  @Prop(Number) readonly currentPos: number | undefined;
  @Prop(Number) readonly totalPos: number | undefined;

  get currentBarStyle() {
    return () => {
      return {
        width: (this.currentPos && this.totalPos ? 100 - this.currentPos / this.totalPos : 0) + "%",
      };
    };
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
</style>
