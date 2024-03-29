// automatically generated by the FlatBuffers compiler, do not modify

/**
 * @constructor
 */
export namespace WorldMapBuffers{
export class WorldMap {
  bb: flatbuffers.ByteBuffer|null = null;

  bb_pos:number = 0;
/**
 * @param number i
 * @param flatbuffers.ByteBuffer bb
 * @returns WorldMap
 */
__init(i:number, bb:flatbuffers.ByteBuffer):WorldMap {
  this.bb_pos = i;
  this.bb = bb;
  return this;
};

/**
 * @param flatbuffers.ByteBuffer bb
 * @param WorldMap= obj
 * @returns WorldMap
 */
static getRoot(bb:flatbuffers.ByteBuffer, obj?:WorldMap):WorldMap {
  return (obj || new WorldMap).__init(bb.readInt32(bb.position()) + bb.position(), bb);
};

/**
 * @param number index
 * @param WorldMapBuffers.TileLayer= obj
 * @returns WorldMapBuffers.TileLayer
 */
layers(index: number, obj?:WorldMapBuffers.TileLayer):WorldMapBuffers.TileLayer|null {
  var offset = this.bb!.__offset(this.bb_pos, 4);
  return offset ? (obj || new WorldMapBuffers.TileLayer).__init(this.bb!.__indirect(this.bb!.__vector(this.bb_pos + offset) + index * 4), this.bb!) : null;
};

/**
 * @returns number
 */
layersLength():number {
  var offset = this.bb!.__offset(this.bb_pos, 4);
  return offset ? this.bb!.__vector_len(this.bb_pos + offset) : 0;
};

/**
 * @returns number
 */
width():number {
  var offset = this.bb!.__offset(this.bb_pos, 6);
  return offset ? this.bb!.readInt32(this.bb_pos + offset) : 0;
};

/**
 * @returns number
 */
height():number {
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
 * @param flatbuffers.Offset layersOffset
 */
static addLayers(builder:flatbuffers.Builder, layersOffset:flatbuffers.Offset) {
  builder.addFieldOffset(0, layersOffset, 0);
};

/**
 * @param flatbuffers.Builder builder
 * @param Array.<flatbuffers.Offset> data
 * @returns flatbuffers.Offset
 */
static createLayersVector(builder:flatbuffers.Builder, data:flatbuffers.Offset[]):flatbuffers.Offset {
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
static startLayersVector(builder:flatbuffers.Builder, numElems:number) {
  builder.startVector(4, numElems, 4);
};

/**
 * @param flatbuffers.Builder builder
 * @param number width
 */
static addWidth(builder:flatbuffers.Builder, width:number) {
  builder.addFieldInt32(1, width, 0);
};

/**
 * @param flatbuffers.Builder builder
 * @param number height
 */
static addHeight(builder:flatbuffers.Builder, height:number) {
  builder.addFieldInt32(2, height, 0);
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

static create(builder:flatbuffers.Builder, layersOffset:flatbuffers.Offset, width:number, height:number):flatbuffers.Offset {
  WorldMap.start(builder);
  WorldMap.addLayers(builder, layersOffset);
  WorldMap.addWidth(builder, width);
  WorldMap.addHeight(builder, height);
  return WorldMap.end(builder);
}
}
}
/**
 * @constructor
 */
export namespace WorldMapBuffers{
export class TileLayer {
  bb: flatbuffers.ByteBuffer|null = null;

  bb_pos:number = 0;
/**
 * @param number i
 * @param flatbuffers.ByteBuffer bb
 * @returns TileLayer
 */
__init(i:number, bb:flatbuffers.ByteBuffer):TileLayer {
  this.bb_pos = i;
  this.bb = bb;
  return this;
};

/**
 * @param flatbuffers.ByteBuffer bb
 * @param TileLayer= obj
 * @returns TileLayer
 */
static getRoot(bb:flatbuffers.ByteBuffer, obj?:TileLayer):TileLayer {
  return (obj || new TileLayer).__init(bb.readInt32(bb.position()) + bb.position(), bb);
};

/**
 * @param number index
 * @returns number
 */
tileIds(index: number):number|null {
  var offset = this.bb!.__offset(this.bb_pos, 4);
  return offset ? this.bb!.readUint16(this.bb!.__vector(this.bb_pos + offset) + index * 2) : 0;
};

/**
 * @returns number
 */
tileIdsLength():number {
  var offset = this.bb!.__offset(this.bb_pos, 4);
  return offset ? this.bb!.__vector_len(this.bb_pos + offset) : 0;
};

/**
 * @returns Uint16Array
 */
tileIdsArray():Uint16Array|null {
  var offset = this.bb!.__offset(this.bb_pos, 4);
  return offset ? new Uint16Array(this.bb!.bytes().buffer, this.bb!.bytes().byteOffset + this.bb!.__vector(this.bb_pos + offset), this.bb!.__vector_len(this.bb_pos + offset)) : null;
};

/**
 * @param flatbuffers.Builder builder
 */
static start(builder:flatbuffers.Builder) {
  builder.startObject(1);
};

/**
 * @param flatbuffers.Builder builder
 * @param flatbuffers.Offset tileIdsOffset
 */
static addTileIds(builder:flatbuffers.Builder, tileIdsOffset:flatbuffers.Offset) {
  builder.addFieldOffset(0, tileIdsOffset, 0);
};

/**
 * @param flatbuffers.Builder builder
 * @param Array.<number> data
 * @returns flatbuffers.Offset
 */
static createTileIdsVector(builder:flatbuffers.Builder, data:number[] | Uint8Array):flatbuffers.Offset {
  builder.startVector(2, data.length, 2);
  for (var i = data.length - 1; i >= 0; i--) {
    builder.addInt16(data[i]);
  }
  return builder.endVector();
};

/**
 * @param flatbuffers.Builder builder
 * @param number numElems
 */
static startTileIdsVector(builder:flatbuffers.Builder, numElems:number) {
  builder.startVector(2, numElems, 2);
};

/**
 * @param flatbuffers.Builder builder
 * @returns flatbuffers.Offset
 */
static end(builder:flatbuffers.Builder):flatbuffers.Offset {
  var offset = builder.endObject();
  return offset;
};

static create(builder:flatbuffers.Builder, tileIdsOffset:flatbuffers.Offset):flatbuffers.Offset {
  TileLayer.start(builder);
  TileLayer.addTileIds(builder, tileIdsOffset);
  return TileLayer.end(builder);
}
}
}
