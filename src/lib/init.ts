import {InitBuffers} from "@/flatbuffers/init_data_generated";
import {flatbuffers} from "flatbuffers";
export interface InitData {
  timer: Timer;
}
export interface Timer {
  value: number;
}
export class Parser {
  parse(buf: flatbuffers.ByteBuffer): InitData {
    const initBuf: InitBuffers.Init = InitBuffers.Init.getRoot(buf);
    const timer = initBuf.timer();
    return {
      timer: {
        value: timer!.value(),
      },
    };
  }
}
