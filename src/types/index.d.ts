import Vue from "vue";

declare module "vue/types/vue" {
  // 3. Объявите расширение для Vue
  interface Vue {
    $socket: string;
  }
}

declare module "vue/types/options" {
  interface ComponentOptions<V extends Vue> {
    wsCommands?: any;
  }
}
