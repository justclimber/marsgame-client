import Vue from "vue";
import {CommandsBuffer} from "@/flatbuffers/command_generated";

interface WsCommand {
  command: CommandsBuffer.Command;
  (payload: any): void;
}

declare module "vue/types/vue" {
  interface Vue {
    $socket: any;
    wsConnect: any;
    wsSendCommand?: any;
  }
  interface VueConstructor<V extends Vue> {
    wsCommands?: any;
    wsBuffers?: any;
  }
}

declare module "vue/types/options" {
  interface ComponentOptions<V extends Vue> {
    wsCommands?: any;
    wsBuffers?: any;
    app?: any;
    $el?: any;
    $store?: any;
  }
}

declare global {
  interface Map<K, V> {
    toJSON(): any;
  }
  interface MapConstructor {
    fromJSON(key: any, value: any): any;
  }
}
