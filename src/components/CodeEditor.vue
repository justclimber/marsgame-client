<template>
  <div>
    <div class="code-editor-root">
      <div class="tabs">
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
        <span class="help-button" @click="showHelp = true">Help</span>
      </div>
      <CodeEditorCore class="code-editor-core" :value="sourceCode" @update:value="changeSourceCode" />
      <div class="buttons">
        <button @click="saveCode">Save</button>
        <button @click="runProgram">Run</button>
        <button @click="stopProgram">Stop</button>
        <button @click="resetMech">Reset Mech</button>
        <button @click="resetWorld">Reset World</button>
        <div>
          <label for="autoSaveCheckbox">
            <input type="checkbox" id="autoSaveCheckbox" v-model="autoSave" />
            <span>Auto save</span>
          </label>
        </div>
        <div>
          <label for="autoStartCheckbox" :class="{ disabled: !autoSave }">
            <input type="checkbox" id="autoStartCheckbox" v-model="autoStart" :disabled="!autoSave" />
            <span>Auto start</span>
          </label>
        </div>
      </div>
    </div>
    <Help v-show="showHelp" @help-close="showHelp = false" />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import Help from "@/components/Help.vue";
import CodeEditorCore from "@/components/CodeEditorCore.vue";

const sourceCode = `mThr = 1.
mrThr = 0.2
crThr = 0.2
`;

type Tab = {
  name: string;
  code: string;
};

@Component({
  components: { Help, CodeEditorCore }
})
export default class CodeEditor extends Vue {
  sourceCode: string = sourceCode;
  autoSave: boolean = false;
  autoStart: boolean = false;
  showHelp: boolean = false;
  tabs: Tab[] = [
    {
      name: "main",
      code: sourceCode
    }
  ];
  activeTab: number = 0;

  changeSourceCode(s: string): void {
    this.sourceCode = s;
  }

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

  resetMech(): void {
    this.wsSendCommand({
      type: "resetMech"
    });
  }

  resetWorld(): void {
    this.wsSendCommand({
      type: "resetWorld"
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
  }

  @Watch("tabs") watchTabs(newTabs: Tab[]): void {
    localStorage.tabs = JSON.stringify(newTabs);
  }

  @Watch("sourceCode") watchSourceCode(newSourceCode: string): void {
    this.tabs[this.activeTab].code = newSourceCode;
    localStorage.tabs = JSON.stringify(this.tabs);
  }

  @Watch("activeTab") watchActiveTab(newActiveTab: number): void {
    localStorage.activeTab = newActiveTab;
    this.sourceCode = this.tabs[this.activeTab].code;
  }

  @Watch("autoSave") watchAutoSave(newAutoSave: boolean): void {
    localStorage.autoSave = newAutoSave;
  }

  @Watch("autoStart") watchAutoStart(newAutoStart: boolean): void {
    localStorage.autoStart = newAutoStart;
  }
}
</script>

<style lang="stylus">
@import "../assets/style/variables.styl"
.code-editor-root
  display flex
  flex-direction column
  align-items stretch
  height 100%
  overflow hidden
  .code-editor-core
    flex-grow 1
  .tabs
    margin 0
    cursor pointer
    display flex
    flex-direction row
    .tab
      background elements-bg
      padding 5px 5px 1px 5px
      border 2px solid panels-border-color
      border-bottom none
      &.active
        background active-element-bg-color
        color active-element-color
        font-weight bold
        font-size 13pt
        padding 3px 5px 3px 5px
      .delete
        font-size medium
  .buttons
    display flex
    flex-direction row
    align-content left
    padding-top 5px
    font-size 14px
    button
      font-size 14px
      border 1px solid panels-border-color
      background active-element-bg-color
      color active-element-color
      margin-right  5px

.help-button
  margin-left 10px
  padding 4px 10px 1px 10px
  border 1px solid panels-border-color
  border-radius 10px
  cursor pointer
</style>
