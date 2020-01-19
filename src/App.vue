<template>
  <div id="app">
    <div id="nav" class="row paper" v-show="this.showMenu">
      <router-link to="/">Game</router-link> |
      <router-link to="/home">Home</router-link> |
      <router-link to="/about">About</router-link>
    </div>
    <router-view />
  </div>
</template>

<script>
export default {
  name: "CodeEditor",
  props: {},
  data: function() {
    return {
      showMenu: false
    };
  }
};
</script>

<style>
#app {
  padding: 20px;
  max-width: 1800px;
}

#nav {
  padding: 20px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
</style>
