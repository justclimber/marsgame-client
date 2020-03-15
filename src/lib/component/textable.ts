import * as PIXI from "pixi.js";

export default class Textable {
  textObj?: PIXI.Text = undefined;
  text: string = "";

  constructor(textObj: PIXI.Text, text: string) {
    this.textObj = textObj;
    this.text = text;
  }

  setText(text: string): void {
    this.text = text;
    this.textObj!.text = text;
  }
  destroy(): void {
    this.textObj!.destroy();
  }
}
