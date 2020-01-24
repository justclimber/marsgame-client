<template>
  <div id="console">
    <div class="row margin-none" v-for="row in console.rows" :key="row.id">
      <div class="time">{{ row.date.toLocaleTimeString("ru") }}</div>
      <div class="text" :class="row.type" v-html="row.text"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { mapState } from "vuex";

@Component({
  computed: mapState(["console"])
})
export default class Console extends Vue {
  wsCommands = {
    codeError(this: any, errorPayload: any) {
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
    }
  };
}
</script>

<style scoped>
#console {
  border: 3px solid #98662e;
  width: 650px;
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
</style>
