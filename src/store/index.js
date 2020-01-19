import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    userId: 0,
    wsConnect: undefined
  },
  mutations: {
    newRandomUser(state) {
      state.userId = Math.random()
        .toString(36)
        .replace(/[^a-z]+/g, "")
        .substr(0, 5);
    },
    setWsConnect(state, ws) {
      state.wsConnect = ws;
    }
  },
  actions: {},
  modules: {},
  strict: process.env.NODE_ENV !== "production"
});
