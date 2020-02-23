import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * Math.floor(max)) + min;
}

export default new Vuex.Store({
  state: {
    userId: 123,
    console: {
      rows: [
        {
          id: 1,
          text: "Welcome to Marsgame console!",
          date: new Date()
        }
      ],
      input: ["a = 5"],
      output: ["mThr = 1.0"],
      commands: ["move = 0."],
      cost: 0,
      energy: 0
    }
  },
  mutations: {
    newRandomUser(state) {
      state.userId = getRandomInt(1000, 9999);
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
    },
    setConsoleInputOutput({ console }, inputOutput: any) {
      console.input = inputOutput.Input;
      console.output = inputOutput.Output;
      console.commands = inputOutput.Commands;
      console.energy = inputOutput.Energy;
      console.cost = inputOutput.Cost;
    }
  },
  modules: {},
  strict: process.env.NODE_ENV !== "production"
});
