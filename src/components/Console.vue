<template>
  <div>
    <div id="console" class="row">
      <div class="col-6">
        <div class="row margin-none" v-for="row in console.rows" :key="row.id">
          <div class="time">{{ row.date.toLocaleTimeString("ru") }}</div>
          <div class="text" :class="row.type" v-html="row.text"></div>
        </div>
      </div>
      <div class="col-3 console-col">
        <div class="row margin-none">Input:</div>
        <div class="row margin-none" v-for="(inputVar, i) in console.input" :key="`input-${i}`">
          <div class="text" v-html="inputVar" @mouseenter="hoverVar" @mouseleave="hoverVarEnd"></div>
        </div>
      </div>
      <div class="col-3 console-col">
        <div class="row margin-none">Result:</div>
        <div class="row margin-none" v-for="(outputVar, i) in console.output" :key="`output-${i}`">
          <div class="text" v-html="outputVar"></div>
        </div>
      </div>
    </div>
    <div id="popup" v-show="showPopup" v-html="popupText" :style="popupStyle"></div>
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
  input: string[];
  output: string[];
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

<style scoped>
#console {
  border: 3px solid #98662e;
  width: 900px;
  height: 300px;
  background-color: #251006;
  color: #c08a70;
  font-family: monospace;
  font-size: 10pt;
  padding: 10px;
}
#console .time {
  width: 75px;
}

.error {
  color: #cb575d;
}
.console-col {
  border-left: 2px solid #c08a70;
  padding-left: 4px;
}
.console-col .row .text {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

#popup {
  position: absolute;
  min-width: 400px;
  border: 2px solid black;
  padding: 5px;
  background-color: white;
  z-index: 9999;
}
</style>
