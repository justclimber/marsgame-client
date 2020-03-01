<template>
  <div class="source-code-wrapper">
    <textarea
      class="source-code original"
      spellcheck="false"
      autocapitalize="off"
      autocomplete="off"
      ref="source"
      :value="sourceCode"
      @input="onSourceInput"
      @scroll="onSourceScroll"
      @keydown="onSourceKeyDown"
    />
    <pre><code class="source-code visualizer" v-html="sourceCodeHighlighted" ref="sourceVisor" /></pre>
    <div class="sidebar" ref="sidebar">
      <div class="line-numbers">
        <div class="line-num" v-for="(line, i) in lines" :key="`line-${i}`">{{ i }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {Component, PropSync, Vue} from "vue-property-decorator";

function injectToString(str: string, inject: string, pos: number): string {
  return str.substring(0, pos) + inject + str.substring(pos, str.length);
}

function ejectFromString(str: string, pos: number, length: number): string {
  return str.substring(0, pos) + str.substring(pos + length, str.length);
}

const indent = 3;
const indentStr = " ".repeat(indent);

@Component
export default class CodeEditorCore extends Vue {
  @PropSync("value", String) sourceCode!: string;
  $refs!: {
    source: HTMLTextAreaElement;
    sourceVisor: HTMLDivElement;
    sidebar: HTMLDivElement;
  };
  // sourceCode: string = sourceCode;
  onSourceScroll(event: any): void {
    this.$refs.sourceVisor.scrollTop = event.target.scrollTop;
    this.$refs.sourceVisor.scrollLeft = event.target.scrollLeft;
    this.$refs.sidebar.scrollTop = event.target.scrollTop;
  }

  onSourceInput(event: any): void {
    this.sourceCode = event.target.value;
    switch (event.data) {
      case "{":
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
      case "Backspace":
        if (event.metaKey) {
          event.preventDefault();
          this.handleDeleteLine();
        }
        break;
    }
  }

  handleDeleteLine(): void {
    const pos = this.$refs.source.selectionStart;
    let lineStart = this.sourceCode.lastIndexOf("\n", pos - 1);
    let lineEnd: number;
    if (pos === this.sourceCode.length) {
      // особый случай для конца документа
      lineStart--;
      lineEnd = pos;
    } else if (pos === lineStart + 1) {
      // особый случай для начала строки
      lineStart--;
      lineEnd = this.sourceCode.indexOf("\n", pos) - 1;
    } else {
      // все остальное
      lineEnd = this.sourceCode.indexOf("\n", pos - 1);
    }
    this.sourceCode = ejectFromString(this.sourceCode, lineStart + 1, lineEnd - lineStart);
    this.gotoPos(pos);
  }

  closeBraceOrBracket(brace: string): void {
    const closeBraceMatchMap = {
      "(": ")",
      "[": "]",
      "{": "}",
    };
    const pos = this.$refs.source.selectionStart;
    this.sourceCode = injectToString(this.sourceCode, brace + closeBraceMatchMap[brace], pos - 1);
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
    const prevChar = this.sourceCode.substr(pos - 1, 1);
    let addition = "";
    let posToGo = pos + indentToAdd + 1;
    if (prevChar === ":") {
      addition = indentStr;
    } else if (prevChar === "{") {
      addition = indentStr + "\n" + " ".repeat(indentToAdd);
      posToGo += indent;
    }

    this.sourceCode = injectToString(this.sourceCode, "\n" + " ".repeat(indentToAdd) + addition, pos);
    this.gotoPos(posToGo);
  }

  getCurrLineIndent(pos: number): number {
    const lineStart = this.sourceCode.lastIndexOf("\n", pos - 1);
    const spaceLast = lineStart + this.sourceCode.slice(lineStart + 1).search(/[^ ]|$/);
    return spaceLast > lineStart ? spaceLast - lineStart : 0;
  }

  gotoPos(pos: number): void {
    this.$nextTick(() => {
      this.$refs.source.selectionStart = pos;
      this.$refs.source.selectionEnd = pos;
    });
  }

  get sourceCodeHighlighted(): string {
    return this.sourceCode
      .replace(/[<>=]/g, "<span class='operators'>$&</span>")
      .replace(/\w+:\w+/g, "<span class='enums'>$&</span>")
      .replace(/[+\-*:,.]/g, "<span class='operators'>$&</span>")
      .replace(/(\w+)\(/g, "<span class='functions'>$1(</span>")
      .replace(/[(){}[]/g, "<span class='braces'>$&</span>")
      .replace(/ifempty|if|return|switch|case|default|else/g, "<span class='keyword'>$&</span>")
      .replace(/\d+/g, "<span class='num'>$&</span>");
  }

  get lines(): string[] {
    return this.sourceCode.split("\n");
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
    height 100%
    overflow hidden
    background elements-bg
    border 1px solid panels-border-color
    z-index 2
    .line-numbers
      width 22px
      text-align right
      font-size codeEditor-font-size

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
    white-space nowrap
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
    .enums
      color codeHighlighting-enums
</style>
