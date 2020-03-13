import {InitBuffers} from "@/flatbuffers/init_data_generated";
import {WorldMapBuffers} from "@/flatbuffers/world_map_generated";
import {flatbuffers} from "flatbuffers";
export interface InitData {
  timer: Timer;
  worldMap: WorldMap;
}
export interface Timer {
  value: number;
}
export interface WorldMap {
  tileLayers: TileLayer[];
  width: number;
  height: number;
}
export interface TileLayer {
  tileIds: Uint16Array;
}
export class Parser {
  parse(buf: flatbuffers.ByteBuffer): InitData {
    const initBuf: InitBuffers.Init = InitBuffers.Init.getRoot(buf);
    const timer = initBuf.timer();

    const worldMap: WorldMapBuffers.WorldMap | null = initBuf.worldMap();
    if (!worldMap) {
      throw Error("Where is the map???");
    }

    const layersCount = worldMap.layersLength();
    let layers: TileLayer[] = [];
    for (let i = 0; i < layersCount; i++) {
      const layer = worldMap.layers(i);
      if (!layer) {
        continue;
      }
      const tileIdsArray = layer.tileIdsArray();
      if (tileIdsArray === null) {
        continue;
      }
      layers[i] = {tileIds: tileIdsArray};
    }

    return {
      timer: {
        value: timer!.value(),
      },
      worldMap: {
        tileLayers: layers,
        width: worldMap.width(),
        height: worldMap.height(),
      },
    };
  }
}
