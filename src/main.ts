import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import VueWs from "./lib/websockets";

Vue.config.productionTip = false;
Vue.use(VueWs, {connectionStr: "ws://localhost/ws?id="}, store);

new Vue({
  router,
  store,
  render: function(h) {
    return h(App);
  },
}).$mount("#app");
