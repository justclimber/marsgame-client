import { WalBuffers } from "@/flatbuffers/log_generated";

export interface GameHistory {
  timeToStart: number;
  timeIds: number[];
  moments: GameHistoryMoment[];
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

function objectPredictions(
  timeIdsCount: number,
  timeIds: number[],
  timeLog: WalBuffers.TimeLog,
  objectLog: WalBuffers.ObjectLog,
  history: GameHistoryMoment[]
) {
  for (let t = 0; t < timeIdsCount; t++) {
    if (timeIds[t] <= timeLog.timeId()) {
      continue;
    }
    if (objectLog.objectType() === WalBuffers.ObjectType.enemy_mech) {
      //asd
    }
    let historyObjectPrediction: ObjectSnapshotUnion = {
      obj: {
        id: objectLog.id(),
        objectType: objectLog.objectType(),
        x: timeLog.x(),
        y: timeLog.y(),
        angle: timeLog.angle(),
        velocityLen: timeLog.velocityLen(),
        velocityRotation: timeLog.velocityRotation(),
        isDelete: timeLog.isDelete(),
        explode: timeLog.explode(),
        deleteOtherIds: []
      }
    };
    // @fixme: надо учитывать что в истории в будущем уже могут быть объекты
    history[timeIds[t]].objects.set(objectLog.id(), historyObjectPrediction);
    if (timeIds[t] === timeLog.velocityUntilTimeId()) {
      break;
    }
  }
}

export class Wall {
  objectsCache: ObjectsSnapshotsMap = new Map();
  parseWal(wal: WalBuffers.Log): GameHistory {
    const timeIdsCount = wal.timeIdsLength();
    const objLogsCount = wal.objectsLength();

    let history: GameHistoryMoment[] = [];
    let timeIds: number[] = [];
    for (let i = 0; i < timeIdsCount; i++) {
      const timeId = wal.timeIds(i);
      if (!timeId) {
        continue;
      }
      history[timeId] = { timeId: timeId, objects: new Map() };
      timeIds.push(timeId);
    }
    // console.log(history);
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

        let objSnapshot = Wall.parseObjectSnapshot(objectLog, objectLog.id(), timeLog);
        if (objectFromCache) {
          Wall.extendObjectSnapshotByCached(objSnapshot, objectFromCache);
        }

        let newObject: ObjectSnapshotUnion;
        if (objectLog.objectType() === WalBuffers.ObjectType.enemy_mech) {
          newObject = Wall.parseMechObject(timeLog, objSnapshot);
        } else {
          newObject = Wall.parseGenericObject(objSnapshot);
        }

        this.objectsCache.set(objectLog.id(), newObject);

        if (!isDefault(timeLog.velocityUntilTimeId())) {
          objectPredictions(timeIdsCount, timeIds, timeLog, objectLog, history);
        }
        Wall.upsertObjectToHistory(history[timeLog.timeId()].objects, newObject);
      }
    }
    return { timeToStart: wal.currTimeId(), timeIds: timeIds, moments: history };
  }
  private static parseObjectSnapshot(
    objectLog: WalBuffers.ObjectLog,
    id: number,
    timeLog: WalBuffers.TimeLog
  ): ObjSnapshot {
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
      deleteOtherIds: []
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
    let mech: any = objSnapshot as unknown;
    mech.obj = objSnapshot;
    mech.cannonAngle = timeLog.cannonAngle();
    mech.cannonRotation = timeLog.cannonRotation();
    return mech as MechSnapshot;
  }

  private static parseGenericObject(objSnapshot: ObjSnapshot): GenericObjSnapshot {
    return { obj: objSnapshot };
  }

  private static upsertObjectToHistory(objects: ObjectsSnapshotsMap, historyObject: ObjectSnapshotUnion): void {
    let obj = objects.get(historyObject.obj.id);
    if (obj) {
      obj.obj.x = historyObject.obj.x;
      obj.obj.y = historyObject.obj.y;
      obj.obj.angle = historyObject.obj.angle;
      obj.obj.velocityLen = historyObject.obj.velocityLen;
      obj.obj.velocityRotation = historyObject.obj.velocityRotation;
    } else {
      objects.set(historyObject.obj.id, historyObject);
    }
  }
}
