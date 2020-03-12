import Entity from "@/lib/entity/entity";
import Movable from "@/lib/component/movable";
import {Components} from "@/lib/component/components";
import Renderable, {RenderableType} from "@/lib/component/renderable";
import WithCannon from "@/lib/component/withCannon";
import * as PIXI from "pixi.js";
import Textable from "@/lib/component/textable";

export default class EntityManager {
  entities: Map<number, Entity> = new Map();
  lastId: number = 1000000;

  reset(): void {
    this.entities.forEach((obj: Entity) => {
      const renderable = obj.components.get(Components.Renderable) as Renderable;
      if (renderable) {
        renderable.sprite!.destroy();
      }
    });
    this.entities.clear();
  }

  getNewId(): number {
    return ++this.lastId;
  }

  createMissile(id: number, x: number, y: number, texture: any): Entity {
    return this.createMovableAnimated(id, x, y, texture);
  }

  createXelon(id: number, x: number, y: number, texture: any): Entity {
    return this.createMovableAnimated(id, x, y, texture);
  }

  createRock(id: number, x: number, y: number, texture: any): Entity {
    return this.createMovableSimple(id, x, y, texture);
  }

  createText(id: number, x: number, y: number, text: string): Entity {
    const entity = new Entity(id);
    let textObj = new PIXI.Text(text, {
      fontFamily: "Arial",
      fontSize: 16,
      fill: 0x000000,
    });
    textObj.x = x;
    textObj.y = y;
    entity.components.set(Components.Textable, new Textable(textObj, text));

    this.entities.set(id, entity);
    return entity;
  }

  createMech(id: number, x: number, y: number, textures: any): Entity {
    const entity = new Entity(id);
    const movableComponent = new Movable(x, y, 0);
    const renderableComponent = new Renderable(RenderableType.Mech, movableComponent, textures);
    const withCannon = new WithCannon(0, 0);
    entity.components.set(Components.Movable, movableComponent);
    entity.components.set(Components.Renderable, renderableComponent);
    entity.components.set(Components.WithCannon, withCannon);

    this.entities.set(id, entity);
    return entity;
  }

  private createMovableAnimated(id: number, x: number, y: number, texture: Array<any>) {
    const entity = new Entity(id);
    const movableComponent = new Movable(x, y, 0);
    const renderableComponent = new Renderable(RenderableType.Animated, movableComponent, [texture]);
    entity.components.set(Components.Movable, movableComponent);
    entity.components.set(Components.Renderable, renderableComponent);

    this.entities.set(id, entity);
    return entity;
  }

  private createMovableSimple(id: number, x: number, y: number, texture: any) {
    const entity = new Entity(id);
    const movableComponent = new Movable(x, y, 0);
    const renderableComponent = new Renderable(RenderableType.Simple, movableComponent, [texture]);
    entity.components.set(Components.Movable, movableComponent);
    entity.components.set(Components.Renderable, renderableComponent);

    this.entities.set(id, entity);
    return entity;
  }
}
