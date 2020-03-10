import * as PIXI from "pixi.js";

export default class GraphicsResources {
  sheet?: PIXI.Spritesheet;
  terraSheet?: PIXI.Spritesheet;
  loader = new PIXI.Loader();
  resources?: Partial<Record<string, PIXI.LoaderResource>>;
  textures: Map<string, any> = new Map<string, any>();

  load(): Promise<PIXI.Spritesheet> {
    return new Promise<PIXI.Spritesheet>((resolve, reject) => {
      this.loader
        .add("/images/spritesheet.json")
        .add("/images/terra.json")
        .load((loader: PIXI.Loader, resources: Partial<Record<string, PIXI.LoaderResource>>) => {
          if (resources["/images/spritesheet.json"]!.spritesheet) {
            this.sheet = resources["/images/spritesheet.json"]!.spritesheet;
            this.resources = resources;
            this.loadTextures();
            resolve(this.sheet);
          } else {
            reject("Can't load spritesheet");
          }
          if (resources["/images/terra.json"]!.spritesheet) {
            this.terraSheet = resources["/images/terra.json"]!.spritesheet;
          } else {
            throw Error("Can't load spritesheet");
          }
        });
    });
  }

  getTexture(name: string): any {
    return this.textures.get(name);
  }

  loadTextures() {
    this.textures.set("terra", this!.sheet!.textures["Sand.png"]);
    this.textures.set("mechBase", this!.sheet!.textures["mech_base.png"]);
    this.textures.set("mechCannon", this!.sheet!.textures["cannon.png"]);
    this.textures.set("rock1", this!.sheet!.textures["rock1.png"]);
    this.textures.set("rock2", this!.sheet!.textures["rock2.png"]);
    this.textures.set("rock3", this!.sheet!.textures["rock3.png"]);
    this.textures.set("enemyBase", this!.sheet!.textures["enemy_base.png"]);
    this.textures.set("enemyCannon", this!.sheet!.textures["enemy_cannon.png"]);
    this.textures.set("missile", this!.sheet!.animations["m"]);
    this.textures.set("xelon", this!.sheet!.animations["k"]);
    this.textures.set("explosion", this!.sheet!.animations["e"]);
  }
}
