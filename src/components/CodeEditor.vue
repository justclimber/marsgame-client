<template>
  <div>
    <div class="code-editor-root">
      <div>
        <span>Type your code here:</span>
        <span class="help-button" @click="showHelp = true">?</span>
      </div>
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
      </div>
      <div class="source-code-wrapper">
        <textarea
          class="source-code original"
          v-model="sourceCode"
          @input="onSourceInput"
          spellcheck="false"
          ref="source"
          @scroll="onSourceScroll"
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

function injectString(source: string, inject: string, pos: number): string {
  return source.substring(0, pos) + inject + source.substring(pos, source.length);
}

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

  onSourceScroll(event: any) {
    this.$refs.sourceVisor.scrollTop = event.target.scrollTop;
    this.$refs.sidebar.scrollTop = event.target.scrollTop;
  }

  onSourceInput(event: any) {
    if (event.data === "{") {
      this.pairBracketsWithNewLineAndIndent();
    }
  }

  pairBracketsWithNewLineAndIndent(): void {
    const textToInsert = "\n   \n}";
    const pos = this.$refs.source.selectionStart;
    this.sourceCode = injectString(this.sourceCode, textToInsert, pos);
    this.$nextTick(() => {
      this.gotoPos(pos + 4);
    });
  }

  gotoPos(pos: number): void {
    this.$refs.source.selectionStart = pos;
    this.$refs.source.selectionEnd = pos;
  }

  get sourceCodeHighlighted(): string {
    return this.sourceCode
      .replace(/[+\-*=><:]/g, "<span class='operators'>$&</span>")
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
.source-code-wrapper
  position relative
  font-size 11pt
  font-weight normal
  font-family monospace
  line-height 18px
  .sidebar
    position absolute
    top 0
    left 0
    padding 1px
    overflow hidden
    max-height 384px
    background #eeeeee
    border 1px solid #c1c0bd
    color #7d7575
    .line-numbers
      width 22px
      text-align right

  .source-code
    border 1px solid #c1c0bd
    font-size 12pt
    width 96%
    margin 0
    padding 0
    padding-left 25px
    font-weight normal
    font-family monospace
    color black
    overflow auto
    resize none
    line-height 18px
    height 100%
    max-height 700px

  .original
    z-index: 1
    opacity 0.1

  .visualizer
    background #ffede5
    position absolute
    top 0
    left 0
    z-index -1
    color #7d7575
    .keyword
      color #ac7d68
    .num
      color #a9c089
    .operators
      color #9d505c
    .braces
      color #9806bc

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
      background #eeeeee
      padding 5px 5px 1px 5px
      border 1px solid #c1c0bd
      border-bottom none
      &.active
        background #ffffff
        font-weight bold
        font-size larger
      .delete
        color #c1c0bd
        font-size medium
  .buttons
    display flex
    flex-direction row
    align-content left
    padding-top 5px
    font-size 14px
    button
      font-size 14px
      border 1px solid #c1c0bd
      margin-right  5px

.help-button
  margin-left 10px
  padding 2px 5px
  border 1px solid #c1c0bd
  border-radius 20px
  cursor pointer
</style>
