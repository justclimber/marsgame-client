import * as PIXI from "pixi.js";
import GraphicsResources from "@/lib/resources";
import Entity from "@/lib/entity/entity";
import {Components} from "@/lib/component/components";
import Renderable from "@/lib/component/renderable";
import WithCannon from "@/lib/component/withCannon";
import Viewport from "@/lib/viewport";
import Textable from "@/lib/component/textable";

PIXI.utils.skipHello();
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

export default class GraphicsEngine {
  screenWidth: number = 600;
  screenHeight: number = 600;
  xShift: number = 10000;
  yShift: number = 10000;
  worldWide = 30000;
  debug: boolean = true;
  resources = new GraphicsResources();

  renderer = new PIXI.Renderer({
    width: this.screenWidth,
    height: this.screenHeight,
    backgroundColor: 0xffffff,
  });

  stage = new PIXI.Container();
  ticker = new PIXI.Ticker();
  viewport = new Viewport(this.xShift, this.yShift, this.screenWidth, this.screenHeight);

  entities: Map<number, Entity> = new Map();
  player?: Entity;

  render() {
    this.preRenderCalculations();
    this.renderer.render(this.stage);
  }

  preRenderCalculations(): void {
    for (let [id, obj] of this.entities) {
      const renderable = obj.components.get(Components.Renderable) as Renderable;
      if (!renderable) {
        continue;
      }
      if (this.viewport.isOutside(renderable.movable!.x, renderable.movable!.y)) {
        renderable.sprite!.renderable = false;
        continue;
      } else {
        renderable.sprite!.renderable = true;
      }
      renderable.sprite!.x = renderable.movable!.x - this.viewport.x;
      renderable.sprite!.y = renderable.movable!.y - this.viewport.y;
      renderable.sprite!.rotation = renderable.movable!.angle;
    }

    if (!this.player) {
      return;
    }
    const cannon = this.player.components.get(Components.WithCannon) as WithCannon;
    const renderable = this.player.components.get(Components.Renderable) as Renderable;
    renderable!.sprite!.children[1].rotation = cannon.angle;
  }

  destroy() {
    this.renderer.destroy();
    this.ticker.destroy();
  }

  bootstrap(pixiContainer: HTMLDivElement, gameLoop: (delta: number) => void, callback: () => void): void {
    pixiContainer.appendChild(this.renderer.view);
    this.resources
      .load()
      .then(() => {
        // this.viewportOld.addChild(this.mapSetup());
        callback();
        this.ticker.add(() => {
          gameLoop(this.ticker.deltaMS);
        });
        this.ticker.add(() => {
          this.render();
        }, PIXI.UPDATE_PRIORITY.LOW);

        this.ticker.start();
      })
      .catch(err => {
        throw Error(err);
      });
  }

  mapSetup(): PIXI.TilingSprite {
    return new PIXI.TilingSprite(this.resources.getTexture("terra"), this.worldWide, this.worldWide);
  }

  makeExplosion(x: number = 0, y: number = 0): void {
    const explosion = new PIXI.AnimatedSprite(this.resources.getTexture("explosion"));
    explosion.x = x;
    explosion.y = y;
    explosion.loop = false;
    explosion.onComplete = () => {
      explosion.destroy();
    };
    explosion.animationSpeed = 0.167;
    explosion.play();
    this.stage.addChild(explosion);
  }

  drawBoundsForObj(obj: Entity): void {
    if (!this.debug) {
      return;
    }
    let spriteBound = new PIXI.Graphics();
    const boundObj = (obj.components.get(Components.Renderable) as Renderable).sprite;
    spriteBound.lineStyle(2, 0xfeeb77, 1);
    spriteBound.drawRect(0 - boundObj!.width / 2, 0 - boundObj!.height / 2, boundObj!.width, boundObj!.height);
    boundObj!.addChild(spriteBound);
  }

  drawCollisionCircleForObj(obj: Entity, radius: number): void {
    if (!this.debug) {
      return;
    }
    let collisionCircle = new PIXI.Graphics();
    const boundObj = (obj.components.get(Components.Renderable) as Renderable).sprite;
    collisionCircle.lineStyle(2, 0x00eb77, 1);
    collisionCircle.drawCircle(0, 0, radius);
    boundObj!.addChild(collisionCircle);
  }

  addEntity(entity: Entity): void {
    this.entities.set(entity.id, entity);
    this.stage.addChild(entity.components.get(Components.Renderable).sprite);
  }

  addPlayer(entity: Entity): void {
    this.player = entity;
    this.entities.set(entity.id, entity);
    this.stage.addChild(entity.components.get(Components.Renderable).sprite);
  }
  addText(entity: Entity): void {
    const text = (entity.components.get(Components.Textable) as Textable)!.textObj;
    if (text) {
      this.stage.addChild(text);
    }
  }

  // Application components
  // runners = {
  //   init: new PIXI.Runner("init", 0),
  //   load: new PIXI.Runner("load", 0),
  //   beforeAdd: new PIXI.Runner("beforeAdd", 1)
  // };
}
