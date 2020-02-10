<template>
  <div class="console-root">
    <div class="console-messages">
      <div v-for="row in console.rows" :key="row.id" class="console-messages-row">
        <div class="time">{{ row.date.toLocaleTimeString("ru") }}</div>
        <div class="text" :class="row.type" v-html="row.text"></div>
      </div>
    </div>
    <div class="console-col console-input">
      <div>Input:</div>
      <div v-for="(inputVar, i) in console.input" :key="`input-${i}`">
        <div class="text" v-html="inputVar" @mouseenter="hoverVar" @mouseleave="hoverVarEnd"></div>
      </div>
    </div>
    <div class="console-col console-output">
      <div>Result:</div>
      <div v-for="(outputVar, i) in console.output" :key="`output-${i}`">
        <div class="text" v-html="outputVar" @mouseenter="hoverVar" @mouseleave="hoverVarEnd"></div>
      </div>
    </div>
    <div class="console-cost">
      <div class="cost-block">Energy: {{ console.energy }}</div>
      <div class="cost-block">Cost: {{ console.cost }}</div>
    </div>
    <div class="popup" v-show="showPopup" v-html="popupText" :style="popupStyle"></div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { mapState } from "vuex";

type ErrorCommand = {
  errorType: number;
  message: string;
};

type CodeInputOutput = {
  Input: string[];
  Output: string[];
  Cost: number;
  Energy: number;
};

@Component({
  computed: mapState(["console"])
})
export default class Console extends Vue {
  showPopup: boolean = false;
  popupText: string = "some popup stub text";
  popupStyle: { top: string; left: string } = { top: "100px", left: "200px" };
  wsCommands = {
    codeError(this: Console, errorPayload: ErrorCommand) {
      let msg;
      switch (errorPayload.errorType) {
        case 0:
          msg = "Lexing";
          break;
        case 1:
          msg = "Parsing";
          break;
        case 2:
          msg = "Runtime";
          break;
      }
      msg = msg + " error: " + errorPayload.message.replace(/\n/g, "<br/>");
      this.$store.commit("addConsoleError", msg);
    },
    codeInputOutput(this: Console, payload: CodeInputOutput) {
      this.$store.commit("setConsoleInputOutput", payload);
    }
  };

  hoverVar(event: any) {
    if (event.target.innerText.length < 30) {
      return;
    }
    this.popupText = event.target.innerText;
    this.showPopup = true;
    this.popupStyle.left = event.clientX + "px";
    this.popupStyle.top = event.clientY + "px";
  }

  hoverVarEnd() {
    this.showPopup = false;
  }
}
</script>

<style scoped lang="stylus">
.console-root
  display grid
  grid-template-areas "console-messages console-input console-output"\
                      "console-messages console-cost console-cost"
  grid-template-columns 3fr 1fr 1fr
  grid-template-rows 1fr 15px
  grid-gap 10px
  border 3px solid #98662e
  background-color #251006
  color #c08a70
  font-family monospace
  font-size 10pt
  padding 10px
  margin 0
  max-height 300px
  overflow hidden
  .time
    width 75px

.error
  color #cb575d

.console-messages
  grid-area console-messages
.console-input
  grid-area console-input
.console-output
  grid-area console-output

.console-cost
  grid-area console-cost
  display flex
  flex-direction row
  .cost-block
    padding-right 10px

.console-messages-row
  display flex
  flex-direction row
  .time
    width 80px

.console-col
  border-left 2px solid #c08a70
  padding-left 4px
  overflow auto
  .row
    .text
      text-overflow ellipsis
      overflow hidden
      white-space nowrap

.popup
  position absolute
  min-width 400px
  border 2px solid black
  padding 5px
  background-color white
  z-index 9999
</style>
