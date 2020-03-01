import {WalBuffers} from "@/flatbuffers/log_generated";

export interface GameHistory {
  timeToStart: number;
  timeIds: number[];
  moments: Map<number, GameHistoryMoment>;
}

export type ObjectsSnapshotsMap = Map<number, ObjectSnapshotUnion>;
export type ObjectSnapshotUnion = GenericObjSnapshot | MechSnapshot;

export interface GameHistoryMoment {
  timeId: number;
  objects: ObjectsSnapshotsMap;
}

export interface ObjSnapshot {
  id: number;
  objectType: WalBuffers.ObjectType;
  x: number;
  y: number;
  angle: number;
  velocityLen: number;
  velocityRotation: number;
  isDelete: boolean;
  explode: boolean;
  deleteOtherIds: number[];
}

export interface GenericObjSnapshot {
  obj: ObjSnapshot;
}

export interface MechSnapshot {
  obj: ObjSnapshot;
  cannonAngle: number;
  cannonRotation: number;
}

function isDefault(value: number) {
  return value === 99999999;
}

function objectPredictionsByVelocity(
  timeIdsCount: number,
  timeIds: number[],
  timeLog: WalBuffers.TimeLog,
  objectLog: WalBuffers.ObjectLog,
  history: Map<number, GameHistoryMoment>,
) {
  let x: number = timeLog.x();
  let y: number = timeLog.y();
  let angle: number = timeLog.angle();
  const velocityLen = timeLog.velocityLen();
  const velocityRotation = timeLog.velocityRotation();

  for (let t = 0; t < timeIdsCount; t++) {
    if (timeIds[t] <= timeLog.timeId()) {
      continue;
    }
    let timeDelta = (timeIds[t] - timeIds[t - 1]) / 1000;
    let objectInHistory = history.get(timeIds[t])!.objects.get(objectLog.id());

    x = x + velocityLen * Math.cos(angle) * timeDelta;
    y = y + velocityLen * Math.sin(angle) * timeDelta;
    angle = angle + velocityRotation;

    if (objectInHistory) {
      objectInHistory.obj.x = x;
      objectInHistory.obj.y = y;
      objectInHistory.obj.angle = angle;
    } else {
      let historyObjectPrediction: ObjectSnapshotUnion = {
        obj: {
          id: objectLog.id(),
          objectType: objectLog.objectType(),
          x: x,
          y: y,
          angle: angle,
          velocityLen: velocityLen,
          velocityRotation: velocityRotation,
          isDelete: false,
          explode: false,
          deleteOtherIds: [],
        },
      };
      history.get(timeIds[t])!.objects.set(objectLog.id(), historyObjectPrediction);
    }
    if (timeIds[t] === timeLog.velocityUntilTimeId()) {
      break;
    }
  }
}

export class Wal {
  objectsCache: ObjectsSnapshotsMap = new Map();
  parseWal(wal: WalBuffers.Log): GameHistory {
    const timeIdsCount = wal.timeIdsLength();
    const objLogsCount = wal.objectsLength();

    let history: Map<number, GameHistoryMoment> = new Map();
    let timeIds: number[] = [];
    for (let i = 0; i < timeIdsCount; i++) {
      const timeId = wal.timeIds(i);
      if (!timeId) {
        continue;
      }
      history.set(timeId, {timeId: timeId, objects: new Map()});
      timeIds.push(timeId);
    }

    for (let i = 0; i < objLogsCount; i++) {
      let objectLog = wal.objects(i);
      if (!objectLog) {
        continue;
      }
      const timeLogsCount = objectLog.timesLength();
      for (let j = 0; j < timeLogsCount; j++) {
        let timeLog = objectLog.times(j);
        if (!timeLog) {
          continue;
        }

        let objectFromCache: ObjectSnapshotUnion | undefined;
        objectFromCache = this.objectsCache.get(objectLog.id());

        let objSnapshot = Wal.parseObjectSnapshot(objectLog, objectLog.id(), timeLog);
        if (objectFromCache) {
          Wal.extendObjectSnapshotByCached(objSnapshot, objectFromCache);
        }

        let newObject: ObjectSnapshotUnion;
        if (objectLog.objectType() === WalBuffers.ObjectType.player) {
          newObject = Wal.parseMechObject(timeLog, objSnapshot);
        } else {
          newObject = Wal.parseGenericObject(objSnapshot);
        }

        this.objectsCache.set(objectLog.id(), newObject);

        if (!isDefault(timeLog.velocityUntilTimeId())) {
          objectPredictionsByVelocity(timeIdsCount, timeIds, timeLog, objectLog, history);
        }
        Wal.upsertObjectToHistory(history.get(timeLog.timeId())!.objects, newObject);
      }
    }
    return {timeToStart: wal.currTimeId(), timeIds: timeIds, moments: history};
  }
  private static parseObjectSnapshot(
    objectLog: WalBuffers.ObjectLog,
    id: number,
    timeLog: WalBuffers.TimeLog,
  ): ObjSnapshot {
    const rawArray = timeLog.deleteOtherIdsArray();
    const deleteOtherIds = rawArray ? Array.from(rawArray) : [];
    return {
      id: id,
      objectType: objectLog.objectType(),
      x: timeLog.x(),
      y: timeLog.y(),
      angle: timeLog.angle(),
      velocityLen: timeLog.velocityLen(),
      velocityRotation: timeLog.velocityRotation(),
      isDelete: timeLog.isDelete(),
      explode: timeLog.explode(),
      deleteOtherIds: deleteOtherIds,
    };
  }

  private static extendObjectSnapshotByCached(newObject: ObjSnapshot, objectFromCache: ObjectSnapshotUnion): void {
    if (isDefault(newObject.x)) {
      newObject.x = objectFromCache.obj.x;
    }
    if (isDefault(newObject.y)) {
      newObject.y = objectFromCache.obj.y;
    }
    if (isDefault(newObject.angle)) {
      newObject.angle = objectFromCache.obj.angle;
    }
    if (isDefault(newObject.velocityLen)) {
      newObject.velocityLen = objectFromCache.obj.velocityLen;
    }
    if (isDefault(newObject.velocityRotation)) {
      newObject.velocityRotation = objectFromCache.obj.velocityRotation;
    }
  }

  private static parseMechObject(timeLog: WalBuffers.TimeLog, objSnapshot: ObjSnapshot): MechSnapshot {
    return {
      obj: objSnapshot,
      cannonAngle: timeLog.cannonAngle(),
      cannonRotation: isDefault(timeLog.cannonRotation()) ? 0 : timeLog.cannonRotation(),
    };
  }

  private static parseGenericObject(objSnapshot: ObjSnapshot): GenericObjSnapshot {
    return {obj: objSnapshot};
  }

  private static upsertObjectToHistory(objects: ObjectsSnapshotsMap, newObject: ObjectSnapshotUnion): void {
    let obj = objects.get(newObject.obj.id);
    if (obj) {
      obj.obj.x = newObject.obj.x;
      obj.obj.y = newObject.obj.y;
      obj.obj.angle = newObject.obj.angle;
      obj.obj.velocityLen = newObject.obj.velocityLen;
      obj.obj.velocityRotation = newObject.obj.velocityRotation;
      obj.obj.isDelete = newObject.obj.isDelete;
      obj.obj.explode = newObject.obj.explode;
      obj.obj.deleteOtherIds = newObject.obj.deleteOtherIds;
    } else {
      objects.set(newObject.obj.id, newObject);
    }
  }
}
