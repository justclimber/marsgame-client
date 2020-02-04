<template>
  <div class="game-root">
    <div class="game-control">
      <div class="game-editor paper margin-none">
        <CodeEditor />
      </div>
      <div class="game-console paper margin-none">
        <Console />
      </div>
    </div>
    <div class="game-canvas">
      <GameCanvas />
    </div>
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

<style>
.game-root {
  display: flex;
  height: 100%;
}
.game-control {
  width: 60%;
  display: flex;
  flex-direction: column;
}
.game-console {
  height: 100%;
}
.game-canvas {
  width: 40%;
}
</style>
