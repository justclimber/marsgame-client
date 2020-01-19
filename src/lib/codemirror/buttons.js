import CodeMirror from "codemirror";
(function(mod) {
  // Plain browser env
  mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  const PANEL_ELEMENT_CLASS = "CodeMirror-buttonsPanel";

  CodeMirror.defineOption("buttons", [], function(cm, value) {
    let panelNode = document.createElement("div");
    panelNode.className = PANEL_ELEMENT_CLASS;
    let i = 0,
      len = value.length;
    for (; i < len; i++) {
      let button = createButton(cm, value[i]);
      panelNode.appendChild(button);
    }
    cm.addPanel(panelNode, { position: "bottom" });
  });

  function createButton(cm, config) {
    let buttonNode;

    if (config.el) {
      if (typeof config.el === "function") {
        buttonNode = config.el(cm);
      } else {
        buttonNode = config.el;
      }
    } else {
      buttonNode = document.createElement("button");
      buttonNode.innerHTML = config.label;
      buttonNode.setAttribute("type", "button");
      buttonNode.setAttribute("tabindex", "-1");

      buttonNode.addEventListener("click", function(e) {
        e.preventDefault();
        cm.focus();
        config.callback(cm);
      });

      if (config.class) {
        buttonNode.className = config.class;
      }

      if (config.title) {
        buttonNode.setAttribute("title", config.title);
      }
    }

    if (config.hotkey) {
      let map = {};
      map[config.hotkey] = config.callback;
      cm.addKeyMap(CodeMirror.normalizeKeyMap(map));
    }

    return buttonNode;
  }
});
