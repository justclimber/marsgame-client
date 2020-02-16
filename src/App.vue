<template>
  <div id="app">
    <div id="nav" v-show="this.showMenu">
      <router-link to="/">Game</router-link> | <router-link to="/home">Home</router-link> |
      <router-link to="/about">About</router-link>
    </div>
    <router-view />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component({
  data: function() {
    return {
      showMenu: false
    };
  }
})
export default class App extends Vue {}
</script>

<style lang="stylus">
html,
body
  height 100%
  font-family Verdana

html
  overflow hidden

input:focus,
select:focus,
textarea:focus,
button:focus
  outline none

#app
  max-width 1800px
  overflow hidden

#nav
  padding 20px
  a
    font-weight bold
    color #2c3e50
    &.router-link-exact-active
      color #42b983
</style>
