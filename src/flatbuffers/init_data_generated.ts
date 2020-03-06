// automatically generated by the FlatBuffers compiler, do not modify

import * as NS1601814486106842324 from "./world_map_generated";
/**
 * @enum {number}
 */
export namespace InitBuffers{
export enum TimerState{
  Stopped= 0,
  Paused= 1,
  Started= 2,
  Expired= 3
}};

/**
 * @constructor
 */
export namespace InitBuffers{
export class Init {
  bb: flatbuffers.ByteBuffer|null = null;

  bb_pos:number = 0;
/**
 * @param number i
 * @param flatbuffers.ByteBuffer bb
 * @returns Init
 */
__init(i:number, bb:flatbuffers.ByteBuffer):Init {
  this.bb_pos = i;
  this.bb = bb;
  return this;
};

/**
 * @param flatbuffers.ByteBuffer bb
 * @param Init= obj
 * @returns Init
 */
static getRoot(bb:flatbuffers.ByteBuffer, obj?:Init):Init {
  return (obj || new Init).__init(bb.readInt32(bb.position()) + bb.position(), bb);
};

/**
 * @param InitBuffers.Timer= obj
 * @returns InitBuffers.Timer|null
 */
timer(obj?:InitBuffers.Timer):InitBuffers.Timer|null {
  var offset = this.bb!.__offset(this.bb_pos, 4);
  return offset ? (obj || new InitBuffers.Timer).__init(this.bb!.__indirect(this.bb_pos + offset), this.bb!) : null;
};

/**
 * @param WorldMapBuffers.WorldMap= obj
 * @returns WorldMapBuffers.WorldMap|null
 */
worldMap(obj?:NS1601814486106842324.WorldMapBuffers.WorldMap):NS1601814486106842324.WorldMapBuffers.WorldMap|null {
  var offset = this.bb!.__offset(this.bb_pos, 6);
  return offset ? (obj || new NS1601814486106842324.WorldMapBuffers.WorldMap).__init(this.bb!.__indirect(this.bb_pos + offset), this.bb!) : null;
};

/**
 * @param flatbuffers.Builder builder
 */
static start(builder:flatbuffers.Builder) {
  builder.startObject(2);
};

/**
 * @param flatbuffers.Builder builder
 * @param flatbuffers.Offset timerOffset
 */
static addTimer(builder:flatbuffers.Builder, timerOffset:flatbuffers.Offset) {
  builder.addFieldOffset(0, timerOffset, 0);
};

/**
 * @param flatbuffers.Builder builder
 * @param flatbuffers.Offset worldMapOffset
 */
static addWorldMap(builder:flatbuffers.Builder, worldMapOffset:flatbuffers.Offset) {
  builder.addFieldOffset(1, worldMapOffset, 0);
};

/**
 * @param flatbuffers.Builder builder
 * @returns flatbuffers.Offset
 */
static end(builder:flatbuffers.Builder):flatbuffers.Offset {
  var offset = builder.endObject();
  return offset;
};

/**
 * @param flatbuffers.Builder builder
 * @param flatbuffers.Offset offset
 */
static finishBuffer(builder:flatbuffers.Builder, offset:flatbuffers.Offset) {
  builder.finish(offset);
};

static create(builder:flatbuffers.Builder, timerOffset:flatbuffers.Offset, worldMapOffset:flatbuffers.Offset):flatbuffers.Offset {
  Init.start(builder);
  Init.addTimer(builder, timerOffset);
  Init.addWorldMap(builder, worldMapOffset);
  return Init.end(builder);
}
}
}
/**
 * @constructor
 */
export namespace InitBuffers{
export class Timer {
  bb: flatbuffers.ByteBuffer|null = null;

  bb_pos:number = 0;
/**
 * @param number i
 * @param flatbuffers.ByteBuffer bb
 * @returns Timer
 */
__init(i:number, bb:flatbuffers.ByteBuffer):Timer {
  this.bb_pos = i;
  this.bb = bb;
  return this;
};

/**
 * @param flatbuffers.ByteBuffer bb
 * @param Timer= obj
 * @returns Timer
 */
static getRoot(bb:flatbuffers.ByteBuffer, obj?:Timer):Timer {
  return (obj || new Timer).__init(bb.readInt32(bb.position()) + bb.position(), bb);
};

/**
 * @returns InitBuffers.TimerState
 */
state():InitBuffers.TimerState {
  var offset = this.bb!.__offset(this.bb_pos, 4);
  return offset ? /**  */ (this.bb!.readInt8(this.bb_pos + offset)) : InitBuffers.TimerState.Stopped;
};

/**
 * @returns number
 */
value():number {
  var offset = this.bb!.__offset(this.bb_pos, 6);
  return offset ? this.bb!.readInt32(this.bb_pos + offset) : 0;
};

/**
 * @returns number
 */
left():number {
  var offset = this.bb!.__offset(this.bb_pos, 8);
  return offset ? this.bb!.readInt32(this.bb_pos + offset) : 0;
};

/**
 * @param flatbuffers.Builder builder
 */
static start(builder:flatbuffers.Builder) {
  builder.startObject(3);
};

/**
 * @param flatbuffers.Builder builder
 * @param InitBuffers.TimerState state
 */
static addState(builder:flatbuffers.Builder, state:InitBuffers.TimerState) {
  builder.addFieldInt8(0, state, InitBuffers.TimerState.Stopped);
};

/**
 * @param flatbuffers.Builder builder
 * @param number value
 */
static addValue(builder:flatbuffers.Builder, value:number) {
  builder.addFieldInt32(1, value, 0);
};

/**
 * @param flatbuffers.Builder builder
 * @param number left
 */
static addLeft(builder:flatbuffers.Builder, left:number) {
  builder.addFieldInt32(2, left, 0);
};

/**
 * @param flatbuffers.Builder builder
 * @returns flatbuffers.Offset
 */
static end(builder:flatbuffers.Builder):flatbuffers.Offset {
  var offset = builder.endObject();
  return offset;
};

static create(builder:flatbuffers.Builder, state:InitBuffers.TimerState, value:number, left:number):flatbuffers.Offset {
  Timer.start(builder);
  Timer.addState(builder, state);
  Timer.addValue(builder, value);
  Timer.addLeft(builder, left);
  return Timer.end(builder);
}
}
}
