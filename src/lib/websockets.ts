import _Vue from "vue";
import {PluginObject} from "vue/types/umd";
import {Store} from "vuex";

import {flatbuffers} from "flatbuffers";
import {CommandsBuffer} from "@/flatbuffers/command_generated";

export default {
  install(Vue: typeof _Vue, options: any = {}, store: Store<any>) {
    let socket: any;
    if (!options.connectionStr) {
      throw new Error("[websocket plugin] should have connectionStr option!");
    }
    Vue.prototype.$socket = socket;

    interface WsFbCommand {
      command: CommandsBuffer.Command;
      fn: Callback;
    }
    interface WsFbCommandWithObj {
      wsCommand: WsFbCommand;
      obj: any;
    }
    interface WsJsonCallbackObj {
      callback: Callback;
      obj: any;
    }
    interface JsonCommand {
      type: string;
      payload: string;
    }
    interface Callback {
      (payload: any): void;
    }
    interface CommandWrapper {
      data: string | ArrayBuffer;
    }

    let commandHandlers: Map<string, WsJsonCallbackObj> = new Map();
    let buffHandlers: Map<CommandsBuffer.Command, WsFbCommandWithObj> = new Map();
    Vue.mixin({
      beforeMount() {
        // websocket json protocol callbacks
        if (this.wsCommands) {
          for (let key in this.wsCommands) {
            commandHandlers.set(key, {
              callback: this.wsCommands[key],
              obj: this,
            });
          }
        }
        // websocket binary Flattbuffers protocol callbacks
        if (this.wsBuffers) {
          this.wsBuffers.forEach((wsCommand: WsFbCommand) => {
            buffHandlers.set(wsCommand.command, {
              wsCommand: wsCommand,
              obj: this,
            });
          });
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
        if (msg.data instanceof ArrayBuffer) {
          parseFlatbuffersCommand(msg.data);
        } else {
          parseJsonCommand(msg.data);
        }
      };
    };

    function parseFlatbuffersCommand(data: ArrayBuffer): void {
      const uint8Array = new Uint8Array(data);
      const command = uint8Array[0];
      let wsCommandWithObj = buffHandlers.get(command);
      if (!wsCommandWithObj) {
        throw new Error("couldn't find '" + command + "' registered buf handler");
      }

      wsCommandWithObj.wsCommand.fn.call(wsCommandWithObj.obj, new flatbuffers.ByteBuffer(uint8Array.slice(1)));
    }

    function parseJsonCommand(data: string): void {
      let jsonCommand: JsonCommand = JSON.parse(data);
      let payload = JSON.parse(jsonCommand.payload);
      const wsCallback = commandHandlers.get(jsonCommand.type);
      if (!wsCallback) {
        throw new Error("couldn't find " + jsonCommand.type + " registered handler");
      }

      wsCallback.callback.call(wsCallback.obj, payload);
    }
  },
} as PluginObject<any>;
