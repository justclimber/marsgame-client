<template>
  <div class="game-root">
    <CodeEditor class="game-editor" />
    <Console class="game-console" />
    <GameEngine class="game-canvas" />
  </div>
</template>

<script>
// @ is an alias to /src
import CodeEditor from "@/components/CodeEditor.vue";
import GameEngine from "@/components/GameEngine.vue";
import Console from "@/components/Console.vue";

export default {
  name: "gameWindow",
  components: {
    GameEngine,
    CodeEditor,
    Console,
  },
};
</script>

<style lang="stylus">
.game-root
  display grid
  grid-template-areas "game-editor game-canvas"\
                      "game-console game-canvas"
  grid-template-columns 1fr 600px
  grid-template-rows 2fr 1fr
  grid-gap 7px
  max-height 800px
  padding 6px
  border 6px double #44251e
.game-editor
  grid-area game-editor
.game-canvas
  grid-area game-canvas
.game-console
  grid-area game-console
</style>
