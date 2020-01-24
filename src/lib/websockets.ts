import _Vue from "vue";

declare module "vue/types/vue" {
  // 3. Объявите расширение для Vue
  interface Vue {
    $socket: string;
  }
}

declare module "vue/types/options" {
  interface ComponentOptions<V extends Vue> {
    wsCommands?: string;
  }
}

export default {
  install(Vue: typeof _Vue, options: any = {}, store: any) {
    let socket: any;
    if (!options.connectionStr) {
      throw new Error("[websocket plugin] should have connectionStr option!");
    }
    Vue.prototype.$socket = socket;

    let commandHandlers: any = {};
    Vue.mixin({
      beforeCreate() {
        if (this.$options["wsCommands"]) {
          let conf = this.$options["wsCommands"];
          Object.keys(conf).forEach((key: number): void => {
            commandHandlers[key] = {
              callback: conf[key],
              obj: this
            };
          });
        }
      }
    });

    Vue.prototype.wsSendCommand = function(command: any) {
      socket.send(JSON.stringify(command));
    };

    Vue.prototype.wsConnect = function(userId: number) {
      store.commit("addConsoleInfo", "Connecting to server...");
      socket = new WebSocket(options.connectionStr + userId);
      socket.onopen = () => {
        store.commit("addConsoleInfo", "Connected!");
      };

      socket.onclose = () => {
        store.commit("addConsoleInfo", "Server closed connection");
      };
      socket.onerror = (error: string) => {
        console.log("Socket error: ", error);
      };

      socket.onmessage = function(msg: any) {
        if (!msg.data) {
          throw new Error("msg should have data property");
        }

        let data = JSON.parse(msg.data);
        if (!data.type || !data.payload) {
          throw new Error("data should have type and payload property");
        }

        let payload = JSON.parse(data.payload);
        if (!commandHandlers[data.type]) {
          throw new Error("couldn't find " + data.type + " registered handler");
        }

        commandHandlers[data.type].callback.call(commandHandlers[data.type].obj, payload);
      };
    };
  }
};
