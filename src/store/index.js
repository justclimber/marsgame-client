import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    userId: 0,
    console: {
      rows: [
        {
          id: 1,
          text: "Welcome to Marsgame console!",
          date: new Date()
        }
      ],
      env: [],
      output: []
    }
  },
  mutations: {
    newRandomUser(state) {
      state.userId = Math.random()
        .toString(36)
        .replace(/[^a-z]+/g, "")
        .substr(0, 5);
    },
    addConsoleRow({ console }, row) {
      row.id = console.rows.length + 1;
      row.date = new Date();
      console.rows.push(row);
    },
    addConsoleInfo({ console }, text) {
      const row = {
        id: console.rows.length + 1,
        text: text,
        type: "info",
        date: new Date()
      };
      console.rows.push(row);
    },
    addConsoleError({ console }, text) {
      const row = {
        id: console.rows.length + 1,
        text: text,
        type: "error",
        date: new Date()
      };
      console.rows.push(row);
    }
  },
  modules: {},
  strict: process.env.NODE_ENV !== "production"
});
