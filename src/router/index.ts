import Vue from "vue";
import VueRouter from "vue-router";
import Game from "../views/GameWindow.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "gameWindow",
    component: Game,
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

export default router;
