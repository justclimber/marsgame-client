<template>
  <div class="game-root">
    <CodeEditor class="game-editor" />
    <Console class="game-console" />
    <GameCanvas class="game-canvas" />
  </div>
</template>

<script>
// @ is an alias to /src
import CodeEditor from "@/components/CodeEditor.vue";
import GameCanvas from "@/components/GameCanvas.vue";
import Console from "@/components/Console.vue";

export default {
  name: "game",
  components: {
    CodeEditor,
    GameCanvas,
    Console
  }
};
</script>

<style lang="stylus">
.game-root
  display grid
  grid-template-areas "game-editor game-canvas"\
                      "game-console game-canvas"
  grid-template-columns 1fr 680px
  grid-template-rows 2fr 1fr
  grid-gap 10px
  max-height 756px
.game-editor
  grid-area game-editor
.game-canvas
  grid-area game-canvas
.game-console
  grid-area game-console
</style>
