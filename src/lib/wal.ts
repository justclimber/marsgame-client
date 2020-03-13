import {WalBuffers} from "@/flatbuffers/log_generated";
import {flatbuffers} from "flatbuffers";

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

export class Parser {
  objectsCache: ObjectsSnapshotsMap = new Map();
  objectsUsedPool: Map<number, boolean> = new Map();
  parse(buf: flatbuffers.ByteBuffer): GameHistory {
    const wal: WalBuffers.Log = WalBuffers.Log.getRoot(buf);
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

        let objSnapshot = Parser.parseObjectSnapshot(objectLog, objectLog.id(), timeLog);

        let newObject: ObjectSnapshotUnion;
        if (objectLog.objectType() === WalBuffers.ObjectType.player) {
          newObject = Parser.parseMechObject(timeLog, objSnapshot);
        } else {
          newObject = Parser.parseGenericObject(objSnapshot);
        }

        if (newObject.obj.isDelete) {
          this.objectsCache.delete(objectLog.id());
          this.objectsUsedPool.delete(objectLog.id());
        } else {
          this.objectsCache.set(objectLog.id(), newObject);
          this.objectsUsedPool.set(objectLog.id(), true);
        }
        if (newObject.obj.deleteOtherIds.length > 0) {
          for (let deleteOtherId of newObject.obj.deleteOtherIds) {
            this.objectsCache.delete(deleteOtherId);
            this.objectsUsedPool.delete(deleteOtherId);
          }
        }

        if (!isDefault(timeLog.velocityUntilTimeId())) {
          Parser.objectPredictionsByVelocity(timeIdsCount, timeIds, timeLog, objectLog, history);
        }
        let existedObject = history.get(timeLog.timeId())!.objects.get(newObject.obj.id);
        if (existedObject) {
          if (!isDefault(newObject.obj.x)) {
            existedObject.obj.x = newObject.obj.x;
          }
          if (!isDefault(newObject.obj.y)) {
            existedObject.obj.y = newObject.obj.y;
          }
          if (!isDefault(newObject.obj.angle)) {
            existedObject.obj.angle = newObject.obj.angle;
          }
          if (!isDefault(newObject.obj.velocityLen)) {
            existedObject.obj.velocityLen = newObject.obj.velocityLen;
          }
          if (!isDefault(newObject.obj.velocityRotation)) {
            existedObject.obj.velocityRotation = newObject.obj.velocityRotation;
          }
          if (newObject.obj.isDelete) {
            existedObject.obj.isDelete = newObject.obj.isDelete;
          }
          if (newObject.obj.explode) {
            existedObject.obj.explode = newObject.obj.explode;
          }
          if (newObject.obj.deleteOtherIds) {
            existedObject.obj.deleteOtherIds = newObject.obj.deleteOtherIds;
          }
        } else {
          this.extendByCacheIfExists(objectLog, newObject.obj);
          history.get(timeLog.timeId())!.objects.set(newObject.obj.id, newObject);
        }
      }
    }

    // если на сервере в рамках чанка не происходит никакого изменения объекта и это не новый объект -
    // в wal'е этого объекта не будет. но из-за специфики перемотки нам необходимо доставать эти объекты из кэша
    for (let [key, value] of this.objectsUsedPool) {
      if (!value) {
        let objectFromCache: ObjectSnapshotUnion | undefined = this.objectsCache.get(key);
        if (!objectFromCache) {
          console.error("Inconsistency for objectsUsedPool and objectsCache for " + key);
          continue;
        }
        // необходимо проставить объект из кэша в каждую timeId запись этого чанка хистори
        for (let timeId of timeIds) {
          history.get(timeId)!.objects.set(key, objectFromCache);
        }
      }
      this.objectsUsedPool.set(key, false);
    }
    return {timeToStart: wal.currTimeId(), timeIds: timeIds, moments: history};
  }

  private extendByCacheIfExists(objectLog: WalBuffers.ObjectLog, objSnapshot: ObjSnapshot) {
    let objectFromCache: ObjectSnapshotUnion | undefined = this.objectsCache.get(objectLog.id());
    if (!objectFromCache) {
      return;
    }
    if (isDefault(objSnapshot.x)) {
      objSnapshot.x = objectFromCache.obj.x;
    }
    if (isDefault(objSnapshot.y)) {
      objSnapshot.y = objectFromCache.obj.y;
    }
    if (isDefault(objSnapshot.angle)) {
      objSnapshot.angle = objectFromCache.obj.angle;
    }
    if (isDefault(objSnapshot.velocityLen)) {
      objSnapshot.velocityLen = objectFromCache.obj.velocityLen;
    }
    if (isDefault(objSnapshot.velocityRotation)) {
      objSnapshot.velocityRotation = objectFromCache.obj.velocityRotation;
    }
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

  private static objectPredictionsByVelocity(
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
}
