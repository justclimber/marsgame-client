import * as PIXI from "pixi.js";

declare module "pixi.js" {
  interface AnimatedSprite {
    vx: number;
    vy: number;
    vr: number;
  }

  interface Container {
    vx: number;
    vy: number;
    vr: number;
  }
}
