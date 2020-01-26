<template>
  <div class="paper container">
    <div class="row margin-bottom-none">
      <div class="col-12 col padding-bottom-none">
        <label for="sourceCode">Type your code here:</label>
        <codemirror ref="codemirror" id="sourceCode" v-model="sourceCode" :options="codemirrorOptions" />
        <div class="row form-group margin-none">
          <div class="col-6 col padding-bottom-none">
            <label for="autoSaveCheckbox" class="paper-radio">
              <input type="checkbox" id="autoSaveCheckbox" v-model="autoSave" />
              <span>Auto save</span>
            </label>
          </div>
          <div class="col-6 col padding-bottom-none">
            <label for="autoStartCheckbox" class="paper-radio" :class="{ disabled: !autoSave }">
              <input type="checkbox" id="autoStartCheckbox" v-model="autoStart" :disabled="!autoSave" />
              <span>Auto start</span>
            </label>
          </div>
        </div>
      </div>
      <div class="col-6 col padding-left-large legend" v-show="showLegend">
        <div class="row">
          <div>Input vars:</div>
          <ul>
            <li>mech.x (float) - x position</li>
            <li>mech.y (float) - y position</li>
            <li>mech.angle (float) - angle in radians</li>
          </ul>
        </div>
        <div class="row">
          <div>Output vars used:</div>
          <ul>
            <li>mThr - mech throttle => movement (-1.0 .. 1.0)</li>
            <li>mrThr - mech rotation throttle => rotation (-1.0 .. 1.0)</li>
            <li>сrThr - cannon rotation throttle => rotation (-1.0 .. 1.0)</li>
          </ul>
        </div>
      </div>
    </div>
    <div class="row">
      <Console />
    </div>
  </div>
</template>

<script>
import Vue from "vue";
import Console from "@/components/Console.vue";
import { codemirror } from "vue-codemirror";
import "codemirror/addon/display/panel";
import "@/lib/codemirror/buttons";
import "codemirror/lib/codemirror.css";
import "codemirror/mode/go/go";

export default Vue.extend({
  components: { codemirror, Console },
  name: "CodeEditor",
  props: {},
  data: function() {
    return {
      sourceCode: `mThr = 1.
mrThr = 0.2
crThr = 0.2
`,
      autoSave: false,
      autoStart: false,
      showLegend: false,
      codemirrorOptions: {
        lineNumbers: true,
        tabSize: 3,
        indentUnit: 3,
        indentWithTabs: false,
        mode: "text/x-go",
        buttons: [
          {
            hotkey: "Ctrl-S",
            label: "Save",
            callback: this.saveCode
          },
          {
            hotkey: "Ctrl-R",
            label: "Run",
            callback: this.runProgram
          },
          {
            hotkey: "Ctrl-D",
            label: "Stop",
            callback: this.stopProgram
          }
        ]
      }
    };
  },
  methods: {
    saveCode() {
      this.wsSendCommand({
        type: "saveCode",
        payload: this.sourceCode
      });
    },
    runProgram() {
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
    }
  },
  mounted: function() {
    if (localStorage.sourceCode) {
      this.sourceCode = localStorage.sourceCode;
    }
    if (localStorage.autoSave === "true") {
      this.autoSave = localStorage.autoSave;
      setTimeout(this.saveCode, 500);
    }
    if (localStorage.autoStart === "true") {
      this.autoStart = localStorage.autoStart;
      setTimeout(this.runProgram, 1000);
    }

    let cdm = this.$refs.codemirror.codemirror;
    cdm.addKeyMap({
      Tab: function(cm) {
        if (cm.somethingSelected()) {
          let sel = cdm.getSelection("\n");
          // Indent only if there are multiple lines selected, or if the selection spans a full line
          if (sel.length > 0 && (sel.indexOf("\n") > -1 || sel.length === cm.getLine(cm.getCursor().line).length)) {
            cm.indentSelection("add");
            return;
          }
        }

        if (cm.options.indentWithTabs) cm.execCommand("insertTab");
        else cm.execCommand("insertSoftTab");
      },
      "Shift-Tab": function(cm) {
        cm.indentSelection("subtract");
      }
    });
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
});
</script>

<style>
#sourceCode {
  width: 690px;
  height: 343px;
  border: 1px solid #c1c0bd;
  box-shadow: -1px 5px 35px -9px rgba(0, 0, 0, 0.2);
  font-size: 12pt;
}

.legend {
  font-size: 13pt;
}

.CodeMirror-buttonsPanel {
  margin: 5px;
}

.CodeMirror-buttonsPanel button {
  padding: 2px;
  min-width: 40px;
  margin-right: 3px;
}
</style>
