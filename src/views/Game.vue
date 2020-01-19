<template>
  <div class="row">
    <CodeEditor class="col-5" />
    <GameCanvas class="col-5" />
  </div>
</template>

<script>
// @ is an alias to /src
import CodeEditor from "@/components/CodeEditor.vue";
import GameCanvas from "@/components/GameCanvas.vue";

export default {
  name: "game",
  components: {
    CodeEditor,
    GameCanvas
  }
};
</script>
