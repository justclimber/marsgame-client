import * as PIXI from "pixi.js";

export default class GraphicsResources {
  sheet?: PIXI.Spritesheet;
  loader = new PIXI.Loader();
  resources?: Partial<Record<string, PIXI.LoaderResource>>;

  load(): Promise<PIXI.Spritesheet> {
    return new Promise<PIXI.Spritesheet>((resolve, reject) => {
      this.loader
        .add("/images/spritesheet.json")
        .load((loader: PIXI.Loader, resources: Partial<Record<string, PIXI.LoaderResource>>) => {
          if (resources["/images/spritesheet.json"]!.spritesheet) {
            this.sheet = resources["/images/spritesheet.json"]!.spritesheet;
            this.resources = resources;
            resolve(this.sheet);
          } else {
            reject("Can't load spritesheet");
          }
        });
    });
  }
}
