<template>
  <div class="paper container">
    <label for="sourceCode">Type your code here:</label>
    <textarea id="sourceCode" v-model="sourceCode"></textarea>
    <div v-show="showError" class="row text-danger margin-none">
      <div>Errors:</div>
      <div v-html="errorText"></div>
    </div>
    <div class="row form-group margin-bottom-none">
      <div class="col-6 col">
        <label for="autoSaveCheckbox" class="paper-radio">
          <input type="checkbox" id="autoSaveCheckbox" v-model="autoSave" />
          <span>Auto save code on startup</span>
        </label>
      </div>
      <div class="col-6 col">
        <label for="autoStartCheckbox" class="paper-radio" :class="{ disabled: !autoSave }">
          <input type="checkbox" id="autoStartCheckbox" v-model="autoStart" :disabled="!autoSave" />
          <span>Auto start code on startup</span>
        </label>
      </div>
    </div>
    <button @click="saveCode">Save the code</button>
    <button @click="runProgram">Run the code</button>
    <button @click="stopProgram">Stop the code</button>
  </div>
</template>

<script>
export default {
  name: "CodeEditor",
  props: {},
  wsCommands: {
    register(payload) {
      console.log("REGISTER!!!", payload);
    },
    error(payload) {
      this.parseError(payload);
    }
  },
  data: function() {
    return {
      sourceCode: `mThr = 1.
mrThr = 0.2
crThr = 0.2
`,
      showError: false,
      errorText: "",
      autoSave: false,
      autoStart: false
    };
  },
  methods: {
    saveCode() {
      this.showError = false;
      this.wsSendCommand({
        type: "saveCode",
        payload: this.sourceCode
      });
    },
    runProgram() {
      this.showError = false;
      this.programFlow("1");
    },

    stopProgram() {
      this.programFlow("0");
    },

    programFlow(flowCmd) {
      this.wsSendCommand({
        type: "programFlow",
        payload: flowCmd
      });
    },
    parseError(payload) {
      this.showError = true;
      this.errorText = payload.message.replace(/\n/g, "<br/>");
    }
  },
  mounted: function() {
    if (localStorage.sourceCode) {
      this.sourceCode = localStorage.sourceCode;
    }
    if (localStorage.autoSave === "true") {
      this.autoSave = localStorage.autoSave;
    }
    if (localStorage.autoStart === "true") {
      this.autoStart = localStorage.autoStart;
    }
    if (this.autoSave) {
      setTimeout(this.saveCode, 500);
    }
    if (this.autoStart) {
      setTimeout(this.runProgram, 1000);
    }
  },
  watch: {
    sourceCode(newSourceCode) {
      localStorage.sourceCode = newSourceCode;
    },
    autoSave(newAutoSave) {
      localStorage.autoSave = newAutoSave;
    },
    autoStart(newAutoStart) {
      localStorage.autoStart = newAutoStart;
    }
  }
};
</script>

<style scoped>
#sourceCode {
  width: 650px;
  height: 300px;
}
</style>
