import CodeMirror from "codemirror";

declare module "codemirror" {
  function normalizeKeyMap(map: any): any;
}
