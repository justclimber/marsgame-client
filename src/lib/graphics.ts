import * as PIXI from "pixi.js";
import {Viewport} from "pixi-viewport";
import GraphicsResources from "@/lib/resources";
import Entity from "@/lib/entity/entity";
import {Components} from "@/lib/component/components";

export type GameSpriteObj = PIXI.Sprite | PIXI.AnimatedSprite | PIXI.Container;

export default class GraphicsEngine {
  screenWidth: number = 600;
  screenHeight: number = 600;
  xShift: number = 10000;
  yShift: number = 10000;
  worldWide = 30000;
  debug: boolean = false;
  resources = new GraphicsResources();

  renderer = new PIXI.Renderer({
    width: this.screenWidth,
    height: this.screenHeight,
    backgroundColor: 0xffffff,
  });

  stage = new PIXI.Container();
  ticker = new PIXI.Ticker();

  viewport = new Viewport({
    screenWidth: this.screenWidth,
    screenHeight: this.screenHeight,
    worldWidth: this.worldWide,
    worldHeight: this.worldWide,
    interaction: this.renderer.plugins.interaction,
  });

  entities: Map<number, Entity> = new Map();
  player?: Entity;

  // Application components
  // runners = {
  //   init: new PIXI.Runner("init", 0),
  //   load: new PIXI.Runner("load", 0),
  //   beforeAdd: new PIXI.Runner("beforeAdd", 1)
  // };

  render() {
    this.renderer.render(this.stage);
  }

  destroy() {
    this.renderer.destroy();
    this.ticker.destroy();
  }

  viewportSetup(): void {
    this.viewport
      .clampZoom({
        minWidth: 300,
        maxWidth: this.worldWide,
      })
      .zoom(1000)
      // .zoom(1)
      .moveCenter(this.xShift, this.yShift)
      .drag()
      .pinch()
      .wheel()
      .decelerate();
  }

  bootstrap(pixiContainer: HTMLDivElement, gameLoop: (delta: number) => void, callback: () => void): void {
    pixiContainer.appendChild(this.renderer.view);
    this.viewportSetup();
    this.resources
      .load()
      .then(() => {
        this.stage.addChild(this.viewport);
        this.viewport.addChild(this.mapSetup());
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

  timerSetup(): PIXI.Text {
    let timerText = new PIXI.Text("Time left: ...", {
      fontFamily: "Arial",
      fontSize: 16,
      fill: 0xffffff,
    });
    timerText.x = 10;
    timerText.y = this.screenHeight - 70;
    this.stage.addChild(timerText);
    return timerText;
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
    this.viewport.addChild(explosion);
  }

  drawBoundsForObj(obj: GameSpriteObj): void {
    if (!this.debug) {
      return;
    }
    let spriteBound = new PIXI.Graphics();
    spriteBound.lineStyle(4, 0xfeeb77, 1);
    spriteBound.drawRect(0 - obj.width / 2, 0 - obj.height / 2, obj.width, obj.height);
    obj.addChild(spriteBound);
  }

  drawCollisionCircleForObj(obj: GameSpriteObj, radius: number): void {
    if (!this.debug) {
      return;
    }
    let collisionCircle = new PIXI.Graphics();
    collisionCircle.lineStyle(4, 0x00eb77, 1);
    collisionCircle.drawCircle(0, 0, radius);
    obj.addChild(collisionCircle);
  }

  addEntity(entity: Entity): void {
    this.entities.set(entity.id, entity);
    this.viewport.addChild(entity.components.get(Components.Renderable).sprite);
  }
  addPlayer(entity: Entity): void {
    this.player = entity;
    this.viewport.addChild(entity.components.get(Components.Renderable).sprite);
  }
}
