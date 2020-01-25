import Vue from "vue";

declare module "vue/types/vue" {
  interface Vue {
    $socket: any;
    wsConnect: any;
    wsCommands?: any;
  }
  interface VueConstructor<V extends Vue> {
    wsCommands?: any;
  }
}

declare module "vue/types/options" {
  interface ComponentOptions<V extends Vue> {
    wsCommands?: any;
    app?: any;
    $el?: any;
    $store?: any;
  }
}
