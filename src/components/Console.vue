<template>
  <div id="console">
    <div class="row margin-none" v-for="row in rows" :key="row.id">{{ row.text }}</div>
  </div>
</template>

<script>
export default {
  name: "Console",
  data: function() {
    return {
      rows: [
        {
          id: 1,
          text: "lorem ipsum"
        },
        {
          id: 2,
          text: "sadf'lkjsd fl;"
        }
      ]
    };
  }
};
</script>

<style scoped>
#console {
  border: 1px solid black;
  width: 650px;
  height: 300px;
  background-color: #251006;
  color: #c08a70;
  font-family: monospace;
  font-size: 12pt;
  padding: 10px;
}
</style>
