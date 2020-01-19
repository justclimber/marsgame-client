<template>
  <div class="paper container" id="pixiDiv"></div>
</template>

<script>
import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";

let xShift = 1000;
let yShift = 1000;

export default {
  name: "GameCanvas",
  props: {},
  data: function() {
    return {
      app: new PIXI.Application({
        backgroundColor: "0xffffff",
        width: 880
      }),
      viewport: undefined,
      mech: undefined,
      mechBase: undefined,
      mechWeaponCannon: undefined,
      terra: undefined
    };
  },
  mounted: function() {
    this.$el.appendChild(this.app.view);
    this.viewportSetup();
    this.app.loader
      .add("/images/spritesheet.json")
      .load((loader, resources) => {
        let sheet = resources["/images/spritesheet.json"];
        this.mapSetup(resources, sheet);
        this.mechSetup(resources, sheet);

        this.app.stage.addChild(this.viewport);
        this.viewport.addChild(this.terra);
        this.viewport.addChild(this.mech);

        this.app.ticker.add(delta => this.gameLoop(delta));
      });
  },
  methods: {
    gameLoop() {},
    viewportSetup() {
      this.viewport = new Viewport({
        screenWidth: 880,
        screenHeight: 600,
        worldWidth: 3000,
        worldHeight: 2000,

        // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
        interaction: this.app.renderer.plugins.interaction
      });
      this.viewport
        .clampZoom({
          minWidth: 300,
          maxWidth: 3000
        })
        .bounce({
          time: 400
        })
        .moveCenter(xShift, yShift)
        .drag()
        .pinch()
        .wheel()
        .decelerate();
    },
    mechSetup(resources, sheet) {
      this.mechBase = new PIXI.Sprite(sheet.textures["mech_base_128.png"]);
      this.mechWeaponCannon = new PIXI.Sprite(sheet.textures["cannon_128.png"]);

      this.mechBase.anchor.set(0.5);

      // смещаем башню немного, потому что она не по центру меха
      this.mechWeaponCannon.y = 3;
      this.mechWeaponCannon.x = 20;
      this.mechWeaponCannon.anchor.set(0.18, 0.5);

      this.mech = new PIXI.Container();
      this.mech.scale.y *= -1;
      this.mech.pivot.set(0.5);
      this.mech.x = xShift;
      this.mech.y = yShift;
      this.mech.vx = 0;
      this.mech.vy = 0;
      this.mech.vr = 0;
      this.mech.throttle = 0;
      this.mech.rotation = 0;

      this.mechWeaponCannon.vr = 0;
      this.mechWeaponCannon.rotation = 0;

      this.mech.addChild(this.mechBase);
      this.mech.addChild(this.mechWeaponCannon);
    },
    mapSetup(resources, sheet) {
      this.terra = new PIXI.TilingSprite(
        sheet.textures["terra_256.png"],
        2800,
        2000
      );
      this.terra.anchor.set(0);
    }
  }
};
</script>

<style scoped></style>
