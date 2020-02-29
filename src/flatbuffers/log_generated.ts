// automatically generated by the FlatBuffers compiler, do not modify

/**
 * @enum {number}
 */
export namespace WalBuffers{
export enum ObjectType{
  player= 0,
  enemy_mech= 1,
  rock= 2,
  xelon= 3,
  missile= 4
}};

/**
 * @constructor
 */
export namespace WalBuffers{
export class Log {
  bb: flatbuffers.ByteBuffer|null = null;

  bb_pos:number = 0;
/**
 * @param number i
 * @param flatbuffers.ByteBuffer bb
 * @returns Log
 */
__init(i:number, bb:flatbuffers.ByteBuffer):Log {
  this.bb_pos = i;
  this.bb = bb;
  return this;
};

/**
 * @param flatbuffers.ByteBuffer bb
 * @param Log= obj
 * @returns Log
 */
static getRoot(bb:flatbuffers.ByteBuffer, obj?:Log):Log {
  return (obj || new Log).__init(bb.readInt32(bb.position()) + bb.position(), bb);
};

/**
 * @returns number
 */
currTimeId():number {
  var offset = this.bb!.__offset(this.bb_pos, 4);
  return offset ? this.bb!.readInt32(this.bb_pos + offset) : 0;
};

/**
 * @param number index
 * @returns number
 */
timeIds(index: number):number|null {
  var offset = this.bb!.__offset(this.bb_pos, 6);
  return offset ? this.bb!.readInt32(this.bb!.__vector(this.bb_pos + offset) + index * 4) : 0;
};

/**
 * @returns number
 */
timeIdsLength():number {
  var offset = this.bb!.__offset(this.bb_pos, 6);
  return offset ? this.bb!.__vector_len(this.bb_pos + offset) : 0;
};

/**
 * @returns Int32Array
 */
timeIdsArray():Int32Array|null {
  var offset = this.bb!.__offset(this.bb_pos, 6);
  return offset ? new Int32Array(this.bb!.bytes().buffer, this.bb!.bytes().byteOffset + this.bb!.__vector(this.bb_pos + offset), this.bb!.__vector_len(this.bb_pos + offset)) : null;
};

/**
 * @param number index
 * @param WalBuffers.ObjectLog= obj
 * @returns WalBuffers.ObjectLog
 */
objects(index: number, obj?:WalBuffers.ObjectLog):WalBuffers.ObjectLog|null {
  var offset = this.bb!.__offset(this.bb_pos, 8);
  return offset ? (obj || new WalBuffers.ObjectLog).__init(this.bb!.__indirect(this.bb!.__vector(this.bb_pos + offset) + index * 4), this.bb!) : null;
};

/**
 * @returns number
 */
objectsLength():number {
  var offset = this.bb!.__offset(this.bb_pos, 8);
  return offset ? this.bb!.__vector_len(this.bb_pos + offset) : 0;
};

/**
 * @param flatbuffers.Builder builder
 */
static start(builder:flatbuffers.Builder) {
  builder.startObject(3);
};

/**
 * @param flatbuffers.Builder builder
 * @param number currTimeId
 */
static addCurrTimeId(builder:flatbuffers.Builder, currTimeId:number) {
  builder.addFieldInt32(0, currTimeId, 0);
};

/**
 * @param flatbuffers.Builder builder
 * @param flatbuffers.Offset timeIdsOffset
 */
static addTimeIds(builder:flatbuffers.Builder, timeIdsOffset:flatbuffers.Offset) {
  builder.addFieldOffset(1, timeIdsOffset, 0);
};

/**
 * @param flatbuffers.Builder builder
 * @param Array.<number> data
 * @returns flatbuffers.Offset
 */
static createTimeIdsVector(builder:flatbuffers.Builder, data:number[] | Uint8Array):flatbuffers.Offset {
  builder.startVector(4, data.length, 4);
  for (var i = data.length - 1; i >= 0; i--) {
    builder.addInt32(data[i]);
  }
  return builder.endVector();
};

/**
 * @param flatbuffers.Builder builder
 * @param number numElems
 */
static startTimeIdsVector(builder:flatbuffers.Builder, numElems:number) {
  builder.startVector(4, numElems, 4);
};

/**
 * @param flatbuffers.Builder builder
 * @param flatbuffers.Offset objectsOffset
 */
static addObjects(builder:flatbuffers.Builder, objectsOffset:flatbuffers.Offset) {
  builder.addFieldOffset(2, objectsOffset, 0);
};

/**
 * @param flatbuffers.Builder builder
 * @param Array.<flatbuffers.Offset> data
 * @returns flatbuffers.Offset
 */
static createObjectsVector(builder:flatbuffers.Builder, data:flatbuffers.Offset[]):flatbuffers.Offset {
  builder.startVector(4, data.length, 4);
  for (var i = data.length - 1; i >= 0; i--) {
    builder.addOffset(data[i]);
  }
  return builder.endVector();
};

/**
 * @param flatbuffers.Builder builder
 * @param number numElems
 */
static startObjectsVector(builder:flatbuffers.Builder, numElems:number) {
  builder.startVector(4, numElems, 4);
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

static create(builder:flatbuffers.Builder, currTimeId:number, timeIdsOffset:flatbuffers.Offset, objectsOffset:flatbuffers.Offset):flatbuffers.Offset {
  Log.start(builder);
  Log.addCurrTimeId(builder, currTimeId);
  Log.addTimeIds(builder, timeIdsOffset);
  Log.addObjects(builder, objectsOffset);
  return Log.end(builder);
}
}
}
/**
 * @constructor
 */
export namespace WalBuffers{
export class ObjectLog {
  bb: flatbuffers.ByteBuffer|null = null;

  bb_pos:number = 0;
/**
 * @param number i
 * @param flatbuffers.ByteBuffer bb
 * @returns ObjectLog
 */
__init(i:number, bb:flatbuffers.ByteBuffer):ObjectLog {
  this.bb_pos = i;
  this.bb = bb;
  return this;
};

/**
 * @param flatbuffers.ByteBuffer bb
 * @param ObjectLog= obj
 * @returns ObjectLog
 */
static getRoot(bb:flatbuffers.ByteBuffer, obj?:ObjectLog):ObjectLog {
  return (obj || new ObjectLog).__init(bb.readInt32(bb.position()) + bb.position(), bb);
};

/**
 * @returns number
 */
id():number {
  var offset = this.bb!.__offset(this.bb_pos, 4);
  return offset ? this.bb!.readUint32(this.bb_pos + offset) : 0;
};

/**
 * @returns WalBuffers.ObjectType
 */
objectType():WalBuffers.ObjectType {
  var offset = this.bb!.__offset(this.bb_pos, 6);
  return offset ? /**  */ (this.bb!.readInt8(this.bb_pos + offset)) : WalBuffers.ObjectType.player;
};

/**
 * @param number index
 * @param WalBuffers.TimeLog= obj
 * @returns WalBuffers.TimeLog
 */
times(index: number, obj?:WalBuffers.TimeLog):WalBuffers.TimeLog|null {
  var offset = this.bb!.__offset(this.bb_pos, 8);
  return offset ? (obj || new WalBuffers.TimeLog).__init(this.bb!.__indirect(this.bb!.__vector(this.bb_pos + offset) + index * 4), this.bb!) : null;
};

/**
 * @returns number
 */
timesLength():number {
  var offset = this.bb!.__offset(this.bb_pos, 8);
  return offset ? this.bb!.__vector_len(this.bb_pos + offset) : 0;
};

/**
 * @param flatbuffers.Builder builder
 */
static start(builder:flatbuffers.Builder) {
  builder.startObject(3);
};

/**
 * @param flatbuffers.Builder builder
 * @param number id
 */
static addId(builder:flatbuffers.Builder, id:number) {
  builder.addFieldInt32(0, id, 0);
};

/**
 * @param flatbuffers.Builder builder
 * @param WalBuffers.ObjectType objectType
 */
static addObjectType(builder:flatbuffers.Builder, objectType:WalBuffers.ObjectType) {
  builder.addFieldInt8(1, objectType, WalBuffers.ObjectType.player);
};

/**
 * @param flatbuffers.Builder builder
 * @param flatbuffers.Offset timesOffset
 */
static addTimes(builder:flatbuffers.Builder, timesOffset:flatbuffers.Offset) {
  builder.addFieldOffset(2, timesOffset, 0);
};

/**
 * @param flatbuffers.Builder builder
 * @param Array.<flatbuffers.Offset> data
 * @returns flatbuffers.Offset
 */
static createTimesVector(builder:flatbuffers.Builder, data:flatbuffers.Offset[]):flatbuffers.Offset {
  builder.startVector(4, data.length, 4);
  for (var i = data.length - 1; i >= 0; i--) {
    builder.addOffset(data[i]);
  }
  return builder.endVector();
};

/**
 * @param flatbuffers.Builder builder
 * @param number numElems
 */
static startTimesVector(builder:flatbuffers.Builder, numElems:number) {
  builder.startVector(4, numElems, 4);
};

/**
 * @param flatbuffers.Builder builder
 * @returns flatbuffers.Offset
 */
static end(builder:flatbuffers.Builder):flatbuffers.Offset {
  var offset = builder.endObject();
  return offset;
};

static create(builder:flatbuffers.Builder, id:number, objectType:WalBuffers.ObjectType, timesOffset:flatbuffers.Offset):flatbuffers.Offset {
  ObjectLog.start(builder);
  ObjectLog.addId(builder, id);
  ObjectLog.addObjectType(builder, objectType);
  ObjectLog.addTimes(builder, timesOffset);
  return ObjectLog.end(builder);
}
}
}
/**
 * @constructor
 */
export namespace WalBuffers{
export class TimeLog {
  bb: flatbuffers.ByteBuffer|null = null;

  bb_pos:number = 0;
/**
 * @param number i
 * @param flatbuffers.ByteBuffer bb
 * @returns TimeLog
 */
__init(i:number, bb:flatbuffers.ByteBuffer):TimeLog {
  this.bb_pos = i;
  this.bb = bb;
  return this;
};

/**
 * @param flatbuffers.ByteBuffer bb
 * @param TimeLog= obj
 * @returns TimeLog
 */
static getRoot(bb:flatbuffers.ByteBuffer, obj?:TimeLog):TimeLog {
  return (obj || new TimeLog).__init(bb.readInt32(bb.position()) + bb.position(), bb);
};

/**
 * @returns number
 */
timeId():number {
  var offset = this.bb!.__offset(this.bb_pos, 4);
  return offset ? this.bb!.readInt32(this.bb_pos + offset) : 0;
};

/**
 * @returns number
 */
x():number {
  var offset = this.bb!.__offset(this.bb_pos, 6);
  return offset ? this.bb!.readInt32(this.bb_pos + offset) : 99999999;
};

/**
 * @returns number
 */
y():number {
  var offset = this.bb!.__offset(this.bb_pos, 8);
  return offset ? this.bb!.readInt32(this.bb_pos + offset) : 99999999;
};

/**
 * @returns number
 */
angle():number {
  var offset = this.bb!.__offset(this.bb_pos, 10);
  return offset ? this.bb!.readFloat32(this.bb_pos + offset) : 99999999.0;
};

/**
 * @returns number
 */
cannonAngle():number {
  var offset = this.bb!.__offset(this.bb_pos, 12);
  return offset ? this.bb!.readFloat32(this.bb_pos + offset) : 99999999.0;
};

/**
 * @returns number
 */
cannonRotation():number {
  var offset = this.bb!.__offset(this.bb_pos, 14);
  return offset ? this.bb!.readFloat32(this.bb_pos + offset) : 99999999.0;
};

/**
 * @returns number
 */
cannonUntilTimeId():number {
  var offset = this.bb!.__offset(this.bb_pos, 16);
  return offset ? this.bb!.readInt32(this.bb_pos + offset) : 99999999;
};

/**
 * @returns boolean
 */
fire():boolean {
  var offset = this.bb!.__offset(this.bb_pos, 18);
  return offset ? !!this.bb!.readInt8(this.bb_pos + offset) : false;
};

/**
 * @returns boolean
 */
isDelete():boolean {
  var offset = this.bb!.__offset(this.bb_pos, 20);
  return offset ? !!this.bb!.readInt8(this.bb_pos + offset) : false;
};

/**
 * @returns boolean
 */
explode():boolean {
  var offset = this.bb!.__offset(this.bb_pos, 22);
  return offset ? !!this.bb!.readInt8(this.bb_pos + offset) : false;
};

/**
 * @returns boolean
 */
explodeOther():boolean {
  var offset = this.bb!.__offset(this.bb_pos, 24);
  return offset ? !!this.bb!.readInt8(this.bb_pos + offset) : false;
};

/**
 * @param number index
 * @returns number
 */
deleteOtherIds(index: number):number|null {
  var offset = this.bb!.__offset(this.bb_pos, 26);
  return offset ? this.bb!.readUint32(this.bb!.__vector(this.bb_pos + offset) + index * 4) : 0;
};

/**
 * @returns number
 */
deleteOtherIdsLength():number {
  var offset = this.bb!.__offset(this.bb_pos, 26);
  return offset ? this.bb!.__vector_len(this.bb_pos + offset) : 0;
};

/**
 * @returns Uint32Array
 */
deleteOtherIdsArray():Uint32Array|null {
  var offset = this.bb!.__offset(this.bb_pos, 26);
  return offset ? new Uint32Array(this.bb!.bytes().buffer, this.bb!.bytes().byteOffset + this.bb!.__vector(this.bb_pos + offset), this.bb!.__vector_len(this.bb_pos + offset)) : null;
};

/**
 * @returns number
 */
velocityLen():number {
  var offset = this.bb!.__offset(this.bb_pos, 28);
  return offset ? this.bb!.readFloat32(this.bb_pos + offset) : 99999999.0;
};

/**
 * @returns number
 */
velocityRotation():number {
  var offset = this.bb!.__offset(this.bb_pos, 30);
  return offset ? this.bb!.readFloat32(this.bb_pos + offset) : 99999999.0;
};

/**
 * @returns number
 */
velocityUntilTimeId():number {
  var offset = this.bb!.__offset(this.bb_pos, 32);
  return offset ? this.bb!.readInt32(this.bb_pos + offset) : 99999999;
};

/**
 * @param flatbuffers.Builder builder
 */
static start(builder:flatbuffers.Builder) {
  builder.startObject(15);
};

/**
 * @param flatbuffers.Builder builder
 * @param number timeId
 */
static addTimeId(builder:flatbuffers.Builder, timeId:number) {
  builder.addFieldInt32(0, timeId, 0);
};

/**
 * @param flatbuffers.Builder builder
 * @param number x
 */
static addX(builder:flatbuffers.Builder, x:number) {
  builder.addFieldInt32(1, x, 99999999);
};

/**
 * @param flatbuffers.Builder builder
 * @param number y
 */
static addY(builder:flatbuffers.Builder, y:number) {
  builder.addFieldInt32(2, y, 99999999);
};

/**
 * @param flatbuffers.Builder builder
 * @param number angle
 */
static addAngle(builder:flatbuffers.Builder, angle:number) {
  builder.addFieldFloat32(3, angle, 99999999.0);
};

/**
 * @param flatbuffers.Builder builder
 * @param number cannonAngle
 */
static addCannonAngle(builder:flatbuffers.Builder, cannonAngle:number) {
  builder.addFieldFloat32(4, cannonAngle, 99999999.0);
};

/**
 * @param flatbuffers.Builder builder
 * @param number cannonRotation
 */
static addCannonRotation(builder:flatbuffers.Builder, cannonRotation:number) {
  builder.addFieldFloat32(5, cannonRotation, 99999999.0);
};

/**
 * @param flatbuffers.Builder builder
 * @param number cannonUntilTimeId
 */
static addCannonUntilTimeId(builder:flatbuffers.Builder, cannonUntilTimeId:number) {
  builder.addFieldInt32(6, cannonUntilTimeId, 99999999);
};

/**
 * @param flatbuffers.Builder builder
 * @param boolean fire
 */
static addFire(builder:flatbuffers.Builder, fire:boolean) {
  builder.addFieldInt8(7, +fire, +false);
};

/**
 * @param flatbuffers.Builder builder
 * @param boolean isDelete
 */
static addIsDelete(builder:flatbuffers.Builder, isDelete:boolean) {
  builder.addFieldInt8(8, +isDelete, +false);
};

/**
 * @param flatbuffers.Builder builder
 * @param boolean explode
 */
static addExplode(builder:flatbuffers.Builder, explode:boolean) {
  builder.addFieldInt8(9, +explode, +false);
};

/**
 * @param flatbuffers.Builder builder
 * @param boolean explodeOther
 */
static addExplodeOther(builder:flatbuffers.Builder, explodeOther:boolean) {
  builder.addFieldInt8(10, +explodeOther, +false);
};

/**
 * @param flatbuffers.Builder builder
 * @param flatbuffers.Offset deleteOtherIdsOffset
 */
static addDeleteOtherIds(builder:flatbuffers.Builder, deleteOtherIdsOffset:flatbuffers.Offset) {
  builder.addFieldOffset(11, deleteOtherIdsOffset, 0);
};

/**
 * @param flatbuffers.Builder builder
 * @param Array.<number> data
 * @returns flatbuffers.Offset
 */
static createDeleteOtherIdsVector(builder:flatbuffers.Builder, data:number[] | Uint8Array):flatbuffers.Offset {
  builder.startVector(4, data.length, 4);
  for (var i = data.length - 1; i >= 0; i--) {
    builder.addInt32(data[i]);
  }
  return builder.endVector();
};

/**
 * @param flatbuffers.Builder builder
 * @param number numElems
 */
static startDeleteOtherIdsVector(builder:flatbuffers.Builder, numElems:number) {
  builder.startVector(4, numElems, 4);
};

/**
 * @param flatbuffers.Builder builder
 * @param number velocityLen
 */
static addVelocityLen(builder:flatbuffers.Builder, velocityLen:number) {
  builder.addFieldFloat32(12, velocityLen, 99999999.0);
};

/**
 * @param flatbuffers.Builder builder
 * @param number velocityRotation
 */
static addVelocityRotation(builder:flatbuffers.Builder, velocityRotation:number) {
  builder.addFieldFloat32(13, velocityRotation, 99999999.0);
};

/**
 * @param flatbuffers.Builder builder
 * @param number velocityUntilTimeId
 */
static addVelocityUntilTimeId(builder:flatbuffers.Builder, velocityUntilTimeId:number) {
  builder.addFieldInt32(14, velocityUntilTimeId, 99999999);
};

/**
 * @param flatbuffers.Builder builder
 * @returns flatbuffers.Offset
 */
static end(builder:flatbuffers.Builder):flatbuffers.Offset {
  var offset = builder.endObject();
  return offset;
};

static create(builder:flatbuffers.Builder, timeId:number, x:number, y:number, angle:number, cannonAngle:number, cannonRotation:number, cannonUntilTimeId:number, fire:boolean, isDelete:boolean, explode:boolean, explodeOther:boolean, deleteOtherIdsOffset:flatbuffers.Offset, velocityLen:number, velocityRotation:number, velocityUntilTimeId:number):flatbuffers.Offset {
  TimeLog.start(builder);
  TimeLog.addTimeId(builder, timeId);
  TimeLog.addX(builder, x);
  TimeLog.addY(builder, y);
  TimeLog.addAngle(builder, angle);
  TimeLog.addCannonAngle(builder, cannonAngle);
  TimeLog.addCannonRotation(builder, cannonRotation);
  TimeLog.addCannonUntilTimeId(builder, cannonUntilTimeId);
  TimeLog.addFire(builder, fire);
  TimeLog.addIsDelete(builder, isDelete);
  TimeLog.addExplode(builder, explode);
  TimeLog.addExplodeOther(builder, explodeOther);
  TimeLog.addDeleteOtherIds(builder, deleteOtherIdsOffset);
  TimeLog.addVelocityLen(builder, velocityLen);
  TimeLog.addVelocityRotation(builder, velocityRotation);
  TimeLog.addVelocityUntilTimeId(builder, velocityUntilTimeId);
  return TimeLog.end(builder);
}
}
}