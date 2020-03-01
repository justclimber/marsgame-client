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
      showMenu: false,
    };
  },
})
export default class App extends Vue {}
</script>

<style lang="stylus">
@import "./assets/style/variables.styl"
html,
body
  height 100%
  font-family Verdana
  background main-bg
  color main-text-color

html
  overflow hidden

input:focus,
select:focus,
textarea:focus,
button:focus
  outline none

button
  font-size main-font-size
  border 1px solid panels-border-color
  background active-element-bg-color
  color active-element-color
  margin-right  5px
  &:hover
    outline 1px solid active-element-color
  &:active
    outline 3px solid active-element-color
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
