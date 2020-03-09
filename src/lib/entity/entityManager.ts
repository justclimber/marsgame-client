import Entity from "@/lib/entity/entity";
import Movable from "@/lib/component/movable";
import {Components} from "@/lib/component/components";
import Renderable, {RenderableType} from "@/lib/component/renderable";
import WithCannon from "@/lib/component/withCannon";

export default class EntityManager {
  entities: Map<number, Entity> = new Map();

  createMissile(id: number, x: number, y: number, texture: any): Entity {
    return this.createMovableAnimated(id, x, y, texture);
  }

  createXelon(id: number, x: number, y: number, texture: any): Entity {
    return this.createMovableAnimated(id, x, y, texture);
  }

  createRock(id: number, x: number, y: number, texture: any): Entity {
    return this.createMovableSimple(id, x, y, texture);
  }

  createMech(id: number, x: number, y: number, textures: any): Entity {
    const entity = new Entity(id);
    const movableComponent = new Movable(x, y, 0);
    const renderableComponent = new Renderable(RenderableType.Mech, textures);
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
    const renderableComponent = new Renderable(RenderableType.Animated, [texture]);
    entity.components.set(Components.Movable, movableComponent);
    entity.components.set(Components.Renderable, renderableComponent);

    this.entities.set(id, entity);
    return entity;
  }

  private createMovableSimple(id: number, x: number, y: number, texture: any) {
    const entity = new Entity(id);
    const movableComponent = new Movable(x, y, 0);
    const renderableComponent = new Renderable(RenderableType.Simple, [texture]);
    entity.components.set(Components.Movable, movableComponent);
    entity.components.set(Components.Renderable, renderableComponent);

    this.entities.set(id, entity);
    return entity;
  }
}
