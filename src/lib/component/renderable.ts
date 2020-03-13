import * as PIXI from "pixi.js";
import Movable from "@/lib/component/movable";

export type GameSpriteObj = PIXI.Sprite | PIXI.AnimatedSprite | PIXI.Container;
export enum RenderableType {
  Simple = 1,
  Animated,
  Mech,
}

export default class Renderable {
  sprite?: GameSpriteObj;
  type: RenderableType = 1;
  movable?: Movable;

  constructor(type: RenderableType, movable: Movable, textures: any) {
    this.movable = movable;
    this.type = type;
    switch (type) {
      case RenderableType.Animated: {
        const sprite = new PIXI.AnimatedSprite(textures[0]);
        sprite.animationSpeed = 0.1;
        sprite.play();
        this.sprite = sprite;
        break;
      }
      case RenderableType.Simple: {
        this.sprite = new PIXI.Sprite(textures[0]);
        break;
      }
      case RenderableType.Mech: {
        const mechBase = new PIXI.Sprite(textures[0]);
        const mechCannon = new PIXI.Sprite(textures[1]);
        const container = new PIXI.Container();
        container.pivot.set(0.5);
        // смещаем башню немного, потому что она не по центру меха
        mechCannon.x = -3;
        container.addChild(mechBase);
        container.addChild(mechCannon);
        this.sprite = container;
        break;
      }
    }
  }
}
