<template>
  <div class="paper container" id="code-editor">
    <div class="row margin-bottom-none">
      <div class="col-12 col padding-bottom-none">
        <label for="sourceCode">Type your code here:</label>
        <div class="row tabs">
          <div
            class="tab"
            v-for="(tab, i) in tabs"
            :key="`tab-${i}`"
            :class="{ active: i === activeTab }"
            @click="changeTab(i)"
          >
            {{ tab.name }}
            <span class="delete" @click="deleteTab(i)" v-if="i !== 0">х</span>
          </div>
          <div class="tab" @click="addTab">+</div>
        </div>
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

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import Console from "@/components/Console.vue";
import { codemirror } from "vue-codemirror";
import "codemirror/addon/display/panel";
import "@/lib/codemirror/buttons";
import "codemirror/lib/codemirror.css";
import "codemirror/mode/go/go";

const sourceCode = `mThr = 1.
mrThr = 0.2
crThr = 0.2
`;

type Tab = {
  name: string;
  code: string;
};

@Component({
  components: { codemirror, Console }
})
export default class CodeEditor extends Vue {
  $refs!: { codemirror: any };
  sourceCode: string = sourceCode;
  autoSave: boolean = false;
  autoStart: boolean = false;
  showLegend: boolean = false;
  tabs: Tab[] = [
    {
      name: "main",
      code: sourceCode
    }
  ];
  activeTab: number = 0;
  codemirrorOptions = {
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
  };

  saveCode(): void {
    this.wsSendCommand({
      type: "saveCode",
      payload: this.sourceCode
    });
  }

  changeTab(i: number): void {
    this.activeTab = i;
  }

  addTab(i: number): void {
    this.tabs.push({
      name: "tab" + this.tabs.length,
      code: ""
    });
    this.activeTab = this.tabs.length - 1;
  }

  deleteTab(i: number): void {
    this.activeTab = i - 2;
    this.tabs.splice(i, 1);
  }

  runProgram(): void {
    this.programFlow("1");
  }

  stopProgram(): void {
    this.programFlow("0");
  }

  programFlow(flowCmd: string): void {
    this.wsSendCommand({
      type: "programFlow",
      payload: flowCmd
    });
  }

  mounted(): void {
    if (localStorage.tabs) {
      this.tabs = JSON.parse(localStorage.tabs);
      this.activeTab = localStorage.activeTab ? parseInt(localStorage.activeTab) : 0;
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
      Tab: function(cm: any) {
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
      "Shift-Tab": function(cm: any) {
        cm.indentSelection("subtract");
      }
    });
  }

  @Watch("tabs")
  watchTabs(newTabs: Tab[]): void {
    localStorage.tabs = JSON.stringify(newTabs);
  }

  @Watch("sourceCode")
  watchSourceCode(newSourceCode: string): void {
    this.tabs[this.activeTab].code = newSourceCode;
    localStorage.tabs = JSON.stringify(this.tabs);
  }

  @Watch("activeTab")
  watchActiveTab(newActiveTab: number): void {
    localStorage.activeTab = newActiveTab;
    this.sourceCode = this.tabs[this.activeTab].code;
  }

  @Watch("autoSave")
  watchAutoSave(newAutoSave: boolean): void {
    localStorage.autoSave = newAutoSave;
  }

  @Watch("autoStart")
  watchAutoStart(newAutoStart: boolean): void {
    localStorage.autoStart = newAutoStart;
  }
}
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

#code-editor .tabs {
  margin: 10px 0 0 0;
  cursor: pointer;
}
#code-editor .tabs .tab {
  background: #eeeeee;
  padding: 5px 5px 1px 5px;
  border: 1px solid #c1c0bd;
  border-bottom: none;
}

#code-editor .tabs .tab.active {
  background: #ffffff;
  font-weight: bold;
  font-size: larger;
}
#code-editor .tabs .tab .delete {
  color: #c1c0bd;
  font-size: medium;
}
</style>
