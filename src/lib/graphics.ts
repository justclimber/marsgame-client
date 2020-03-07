import * as PIXI from "pixi.js";
import {Viewport} from "pixi-viewport";

export default class GraphicsEngine {
  screenWidth: number = 600;
  screenHeight: number = 600;
  xShift: number = 10000;
  yShift: number = 10000;
  worldWide = 30000;
  sheet?: PIXI.Spritesheet;

  renderer = new PIXI.Renderer({
    width: this.screenWidth,
    height: this.screenHeight,
    backgroundColor: 0xffffff,
  });

  stage = new PIXI.Container();
  ticker = new PIXI.Ticker();
  loader = new PIXI.Loader();

  viewport = new Viewport({
    screenWidth: this.screenWidth,
    screenHeight: this.screenHeight,
    worldWidth: this.worldWide,
    worldHeight: this.worldWide,
    interaction: this.renderer.plugins.interaction,
  });

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

  bootstrap(pixiContainer: HTMLDivElement, gameLoop: () => void, callback: (sheet: PIXI.Spritesheet) => void): void {
    pixiContainer.appendChild(this.renderer.view);
    this.viewportSetup();
    this.loader
      .add("/images/spritesheet.json")
      .load((loader: PIXI.Loader, resources: Partial<Record<string, PIXI.LoaderResource>>) => {
        if (resources["/images/spritesheet.json"]!.spritesheet) {
          this.sheet = resources["/images/spritesheet.json"]!.spritesheet;
        } else {
          throw Error("Can't load spritesheet");
        }
        this.stage.addChild(this.viewport);
        this.viewport.addChild(this.mapSetup());
        callback(this.sheet);
        this.ticker.add(() => gameLoop());
        this.ticker.add(() => {
          this.render();
        }, PIXI.UPDATE_PRIORITY.LOW);

        this.ticker.start();
      });
  }

  mapSetup(): PIXI.TilingSprite {
    const terra = new PIXI.TilingSprite(this.sheet!.textures["Sand.png"], this.worldWide, this.worldWide);
    terra.anchor.set(0);
    return terra;
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
}
