import "@/lib/pixi";
import "pixi-tilemap";
import GraphicsResources from "@/lib/resources";
import Entity from "@/lib/entity/entity";
import {Components} from "@/lib/component/components";
import Renderable, {RenderableType} from "@/lib/component/renderable";
import WithCannon from "@/lib/component/withCannon";
import Viewport from "@/lib/viewport";
import Textable from "@/lib/component/textable";
import {TileLayer, WorldMap} from "@/lib/init";
import Movable from "@/lib/component/movable";
import EntityManager from "@/lib/entity/entityManager";

PIXI.utils.skipHello();
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

const tileSize = 32;

export default class GraphicsEngine {
  screenWidth: number = 600;
  screenHeight: number = 600;
  xShift: number = 10000;
  yShift: number = 10000;
  debug: boolean = false;
  worldMap?: WorldMap = undefined;
  resources = new GraphicsResources();
  em: EntityManager = new EntityManager();
  tileMap?: PIXI.tilemap.CompositeRectTileLayer;

  renderer = new PIXI.Renderer({
    width: this.screenWidth,
    height: this.screenHeight,
    backgroundColor: 0x000000,
  });

  stage = new PIXI.Container();
  ticker = new PIXI.Ticker();
  viewport = new Viewport(this.xShift, this.yShift, this.screenWidth, this.screenHeight);

  player?: Entity;

  async bootstrap(pixiContainer: HTMLDivElement, gameLoop: (delta: number) => void, em: EntityManager): Promise<any> {
    this.em = em;
    pixiContainer.appendChild(this.renderer.view);
    await this.resources.load();

    this.tileMap = new PIXI.tilemap.CompositeRectTileLayer(0, this.resources.terraSheet!.textures);
    this.stage.addChild(this.tileMap);
    this.ticker.add(() => {
      gameLoop(this.ticker.deltaMS);
    });
    this.ticker.add(() => {
      this.render();
    }, PIXI.UPDATE_PRIORITY.LOW);

    this.ticker.start();
  }

  mapSetup(worldMap: WorldMap): void {
    this.worldMap = worldMap;
  }

  render() {
    this.preRenderCalculations();
    this.renderWoldMap();
    this.renderer.render(this.stage);
  }

  preRenderCalculations(): void {
    this.centerViewportOnPlayer();
    for (let [id, obj] of this.em.entities) {
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
      renderable.sprite!.x = renderable.movable!.x - this.viewport.x + this.viewport.gap;
      renderable.sprite!.y = renderable.movable!.y - this.viewport.y + this.viewport.gap;
      renderable.sprite!.rotation = renderable.movable!.angle;
    }

    if (!this.player) {
      return;
    }
    const cannon = this.player.components.get(Components.WithCannon) as WithCannon;
    const renderable = this.player.components.get(Components.Renderable) as Renderable;
    renderable!.sprite!.children[1].rotation = cannon.angle;
  }

  renderWoldMap(): void {
    if (!this.worldMap || !this.tileMap) {
      return;
    }

    this.tileMap.clear();
    const mapWidth = this.worldMap.width;
    let tilesCount = 0;
    this.worldMap.tileLayers.forEach((layer: TileLayer) => {
      for (let i = 0; i < layer.tileIds.length; i++) {
        if (layer.tileIds[i] === 0) {
          continue;
        }
        const y = Math.ceil(i / mapWidth) * tileSize + this.yShift - 1000;
        const x = (i % mapWidth) * tileSize + this.xShift - 1000;
        if (this.viewport.isOutside(x, y)) {
          continue;
        }
        tilesCount++;
        this.tileMap!.addFrame(
          `t${layer.tileIds[i]}.png`,
          x - this.viewport.x + this.viewport.gap,
          y - this.viewport.y + this.viewport.gap,
        );
      }
    });
  }

  makeExplosion(x: number, y: number): void {
    const id = this.em.getNewId();
    const entity = new Entity(id);
    const movable = new Movable(x, y, 0);
    const renderable = new Renderable(RenderableType.Animated, movable, [this.resources.getTexture("explosion")]);
    entity.components.set(Components.Renderable, renderable);
    entity.components.set(Components.Movable, movable);
    const animatedSprite = renderable.sprite! as PIXI.AnimatedSprite;
    animatedSprite.loop = false;
    animatedSprite.onComplete = () => {
      renderable.sprite!.destroy();
      this.em.entities.delete(id);
    };
    this.stage.addChild(entity.components.get(Components.Renderable).sprite);
    this.em.entities.set(id, entity);
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
    this.em.entities.set(entity.id, entity);
    this.stage.addChild(entity.components.get(Components.Renderable).sprite);
    this.drawBoundsForObj(entity);
    this.drawCollisionCircleForObj(entity, 20);
  }

  addText(entity: Entity): void {
    const text = (entity.components.get(Components.Textable) as Textable)!.textObj;
    if (text) {
      this.stage.addChild(text);
    }
  }

  mechSetup(id: number, x: number, y: number): Entity {
    const entity = this.em.createMech(id, x, y, [
      this.resources.getTexture("mechBase"),
      this.resources.getTexture("mechCannon"),
    ]);
    this.em.entities.set(entity.id, entity);
    this.stage.addChild(entity.components.get(Components.Renderable).sprite);
    this.drawBoundsForObj(entity);
    this.drawCollisionCircleForObj(entity, 25);
    return entity;
  }

  playerSetup(id: number, x: number, y: number): void {
    this.player = this.mechSetup(id, x, y);
    this.viewport.centerTo(x, y);
  }

  centerViewportOnPlayer(): void {
    if (!this.player) {
      return;
    }

    const movable = this.player.components.get(Components.Movable) as Movable;
    this.viewport.centerTo(movable.x, movable.y);
  }

  timerSetup(): number {
    const timerTextId = this.em.getNewId();
    const entity = this.em.createText(timerTextId, 10, this.screenWidth - 70, "Time left: ...");
    this.em.entities.set(timerTextId, entity);
    this.addText(entity);
    return timerTextId;
  }

  destroy() {
    this.renderer.destroy();
    this.ticker.destroy();
  }
}
