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
      <div class="source-code-wrapper">
        <textarea
          class="source-code original"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          v-model="sourceCode"
          ref="source"
          @input="onSourceInput"
          @scroll="onSourceScroll"
          @click="onSourceClick"
          @keydown="onSourceKeyDown"
        />
        <pre><code class="source-code visualizer" v-html="sourceCodeHighlighted" ref="sourceVisor" /></pre>
        <div class="sidebar" ref="sidebar">
          <div class="line-numbers">
            <div class="line-num" v-for="(line, i) in lines" :key="`line-${i}`">{{ i }}</div>
          </div>
        </div>
      </div>
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

const sourceCode = `mThr = 1.
mrThr = 0.2
crThr = 0.2
`;

type Tab = {
  name: string;
  code: string;
};

function injectToString(str: string, inject: string, pos: number): string {
  return str.substring(0, pos) + inject + str.substring(pos, str.length);
}

function ejectFromString(str: string, pos: number, length: number): string {
  return str.substring(0, pos) + str.substring(pos + length, str.length);
}

const indent = 3;
const indentStr = " ".repeat(indent);

@Component({
  components: { Help }
})
export default class CodeEditor extends Vue {
  $refs!: {
    source: HTMLTextAreaElement;
    sourceVisor: HTMLDivElement;
    sidebar: HTMLDivElement;
  };
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

  onSourceScroll(event: any): void {
    this.$refs.sourceVisor.scrollTop = event.target.scrollTop;
    this.$refs.sidebar.scrollTop = event.target.scrollTop;
  }

  onSourceClick(event: any): void {
    let selStart = event.target.selectionStart;
    let selEnd = event.target.selectionEnd;
    // console.log(selStart, selEnd);
  }

  onSourceInput(event: any): void {
    switch (event.data) {
      case "{":
        this.pairCurlyBracesWithNewLineAndIndent();
        break;
      case "(":
      case "[":
        this.closeBraceOrBracket(event.data);
        break;
    }
  }

  onSourceKeyDown(event: any): void {
    switch (event.key) {
      case "Enter":
        event.preventDefault();
        this.handleNewLineIndentation();
        break;
      case "Tab":
        event.preventDefault();
        this.handleTabIndent(event.shiftKey);
        break;
    }
  }

  closeBraceOrBracket(brace: string): void {
    const closeBraceMatchMap = {
      "(": ")",
      "[": "]"
    };
    const pos = this.$refs.source.selectionStart;
    this.sourceCode = injectToString(this.sourceCode, closeBraceMatchMap[brace], pos);
    this.gotoPos(pos);
  }

  handleTabIndent(shiftKey: boolean): void {
    const pos = this.$refs.source.selectionStart;
    const lineStart = this.sourceCode.lastIndexOf("\n", pos - 1);
    if (shiftKey) {
      if (this.sourceCode.substr(lineStart + 1, indent) !== indentStr) {
        return;
      }
      this.sourceCode = ejectFromString(this.sourceCode, lineStart + 1, indent);
      this.gotoPos(pos - indent);
    } else {
      this.sourceCode = injectToString(this.sourceCode, indentStr, lineStart + 1);
      this.gotoPos(pos + indent);
    }
  }

  handleNewLineIndentation(): void {
    const pos = this.$refs.source.selectionStart;
    let indentToAdd = this.getCurrLineIndent(pos);
    const lastChar = this.sourceCode.substr(pos - 1, 1);
    if (lastChar === ":" || lastChar === "{") {
      indentToAdd += indent;
    }

    this.sourceCode = injectToString(this.sourceCode, "\n" + " ".repeat(indentToAdd), pos);
    this.gotoPos(pos + indentToAdd + 1);
  }

  getCurrLineIndent(pos: number): number {
    const lineStart = this.sourceCode.lastIndexOf("\n", pos - 1);
    const spaceLast = lineStart + this.sourceCode.slice(lineStart + 1).search(/[^ ]|$/);
    return spaceLast > lineStart ? spaceLast - lineStart : 0;
  }

  pairCurlyBracesWithNewLineAndIndent(): void {
    const pos = this.$refs.source.selectionStart;
    const currLineIndent = this.getCurrLineIndent(pos);
    const currLineIndentStr = " ".repeat(currLineIndent);
    const textToInsert = "\n" + currLineIndentStr + indentStr + "\n" + currLineIndentStr + "}";
    this.sourceCode = injectToString(this.sourceCode, textToInsert, pos);
    this.gotoPos(pos + indent + currLineIndent + 1);
  }

  gotoPos(pos: number): void {
    this.$nextTick(() => {
      this.$refs.source.selectionStart = pos;
      this.$refs.source.selectionEnd = pos;
    });
  }

  get sourceCodeHighlighted(): string {
    return this.sourceCode
      .replace(/[+\-*=><:]/g, "<span class='operators'>$&</span>")
      .replace(/(\w+)\(/g, "<span class='functions'>$1(</span>")
      .replace(/[(){}[]/g, "<span class='braces'>$&</span>")
      .replace(/ifempty|if|return|switch|case|default|else/g, "<span class='keyword'>$&</span>")
      .replace(/\d+/g, "<span class='num'>$&</span>");
  }

  get lines(): string[] {
    return this.sourceCode.split("\n");
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
.source-code-wrapper
  position relative
  font-size 11pt
  font-weight normal
  font-family monospace
  line-height codeEditor-line-height
  .sidebar
    position absolute
    top 0
    left 0
    padding 1px
    overflow hidden
    max-height 406px
    background elements-bg
    border 1px solid panels-border-color
    z-index 2
    .line-numbers
      width 22px
      text-align right

  .source-code
    border 2px solid panels-border-color
    font-size codeEditor-font-size
    width 96%
    margin 0
    padding 0
    padding-left 27px
    font-weight normal
    font-family monospace
    line-height codeEditor-line-height
    height 100%
    max-height 700px
    outline none

  .original
    overflow auto
    position absolute
    top 0
    left 0
    background none
    z-index: 2
    color transparent
    caret-color active-element-color
    resize none
    &::-webkit-scrollbar-track
      background-color panels-bg
    &::-webkit-scrollbar
      width 15px
    &::-webkit-scrollbar-thumb
      background-color: elements-bg;
      border: 1px solid panels-border-color;

  .visualizer
    overflow hidden
    background panels-bg
    position absolute
    top 0
    left 0
    z-index 1
    color codeHighlighting-none
    white-space pre
    .keyword
      color codeHighlighting-keywords
    .num
      color codeHighlighting-num
    .operators
      color codeHighlighting-operators
    .braces
      color codeHighlighting-braces
    .functions
      color codeHighlighting-functions

.code-editor-root
  display flex
  flex-direction column
  align-items stretch
  height 100%
  overflow hidden
  .source-code-wrapper
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
