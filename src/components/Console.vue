<template>
  <div id="console">
    <div class="row margin-none" v-for="row in console.rows" :key="row.id">
      <div class="time">{{ row.date.toLocaleTimeString("ru") }}</div>
      <div class="text" :class="row.type" v-html="row.text"></div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";

export default Vue.extend({
  name: "Console",
  wsCommands: {
    codeError(errorPayload) {
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
  },
  computed: mapState(["console"])
});
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
