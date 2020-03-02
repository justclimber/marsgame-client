import _Vue from "vue";
import {PluginObject} from "vue/types/umd";
import {Store} from "vuex";

import {flatbuffers} from "flatbuffers";
import {WalBuffers} from "@/flatbuffers/log_generated";
import {WalBuffers as Commands} from "@/flatbuffers/command_generated";

export default {
  install(Vue: typeof _Vue, options: any = {}, store: Store<any>) {
    let socket: any;
    if (!options.connectionStr) {
      throw new Error("[websocket plugin] should have connectionStr option!");
    }
    Vue.prototype.$socket = socket;

    interface WsCallback {
      (payload: any): void;
    }
    interface WsCallbackObj {
      callback: WsCallback;
      obj: any;
    }

    interface Command {
      type: string;
      payload: string;
    }

    interface CommandWrapper {
      data: string | ArrayBuffer;
    }

    let commandHandlers: Map<string, WsCallbackObj> = new Map();
    Vue.mixin({
      beforeMount() {
        if (this.wsCommands) {
          for (let key in this.wsCommands) {
            commandHandlers.set(key, {
              callback: this.wsCommands[key],
              obj: this,
            });
          }
        }
      },
    });

    Vue.prototype.wsSendCommand = function(command: any) {
      socket.send(JSON.stringify(command));
    };

    Vue.prototype.wsConnect = function(userId: number) {
      store.commit("addConsoleInfo", "Connecting to server...");
      socket = new WebSocket(options.connectionStr + userId);
      socket.binaryType = "arraybuffer";
      socket.onopen = () => {
        store.commit("addConsoleInfo", "Connected!");
      };

      socket.onclose = () => {
        store.commit("addConsoleInfo", "Server closed connection");
      };
      socket.onerror = (error: string) => {
        console.log("Socket error: ", error);
      };

      socket.onmessage = function(msg: CommandWrapper) {
        let commandName: string;
        let payload: any;
        if (msg.data instanceof ArrayBuffer) {
          const uint8Array = new Uint8Array(msg.data);
          const commandType = uint8Array[0];
          let buf = new flatbuffers.ByteBuffer(uint8Array.slice(1));
          if (commandType == Commands.Command.wal) {
            payload = WalBuffers.Log.getRoot(buf);
            commandName = "worldChangesWal";
          } else {
            commandName = "unknown";
          }
        } else {
          let data: Command = JSON.parse(msg.data);
          payload = JSON.parse(data.payload);
          commandName = data.type;
        }

        const wsCallback = commandHandlers.get(commandName);
        if (!wsCallback) {
          throw new Error("couldn't find " + commandName + " registered handler");
        }

        wsCallback.callback.call(wsCallback.obj, payload);
      };
    };
  },
} as PluginObject<any>;
