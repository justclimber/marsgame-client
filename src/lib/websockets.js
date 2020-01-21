module.exports = {
  install(Vue, options = {}) {
    let socket;
    if (!options.connectionStr) {
      throw new Error("[websocket plugin] should have connectionStr option!");
    }
    Vue.prototype.$socket = socket;

    let commandHandlers = {};
    Vue.mixin({
      beforeCreate() {
        if (this.$options["wsCommands"]) {
          let conf = this.$options["wsCommands"];
          Object.keys(conf).forEach(key => {
            commandHandlers[key] = {
              callback: conf[key],
              obj: this
            };
          });
        }
      }
    });

    Vue.prototype.wsSendCommand = function(command) {
      socket.send(JSON.stringify(command));
    };

    Vue.prototype.wsConnect = function(userId) {
      socket = new WebSocket(options.connectionStr + userId);
      socket.onopen = () => {
        console.log("Connection success");
        let command = {
          type: "greetings",
          payload: "Hi from the client!"
        };
        socket.send(JSON.stringify(command));
      };

      socket.onclose = event => {
        console.log("Socket connection closed: ", event);
      };
      socket.onerror = error => {
        console.log("Socket error: ", error);
      };

      socket.onmessage = function(msg) {
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
