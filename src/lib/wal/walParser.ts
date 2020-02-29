import { WalBuffers } from "@/flatbuffers/log_generated";

export interface GameHistory {
  timeToStart: number;
  timeIds: number[];
  moments: GameHistoryMoment[];
}
export type GameHistoryObjectsMap = Map<number, GameHistoryObject>;

export interface GameHistoryMoment {
  timeId: number;
  objects: GameHistoryObjectsMap;
}
export interface GameHistoryObject {
  id: number;
  objectType: number;

  x: number;
  y: number;
  angle: number;
  cannonAngle: number;
  velocityLen: number;
  velocityRotation: number;
  isDelete?: boolean;
  explode?: boolean;
  deleteOtherIds?: number[];
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
    let historyObjectPrediction: GameHistoryObject = {
      id: objectLog.id(),
      objectType: objectLog.objectType(),
      x: timeLog.x(),
      y: timeLog.y(),
      angle: timeLog.angle(),
      cannonAngle: timeLog.cannonAngle(),
      velocityLen: timeLog.velocityLen(),
      velocityRotation: timeLog.velocityRotation()
    };
    // @fixme: надо учитывать что в истории в будущем уже могут быть объекты
    history[timeIds[t]].objects.set(objectLog.id(), historyObjectPrediction);
    if (timeIds[t] === timeLog.velocityUntilTimeId()) {
      break;
    }
  }
}

export class WalParser {
  objectsCache: Map<number, GameHistoryObject> = new Map();
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

        let newObject = {
          id: objectLog.id(),
          objectType: objectLog.objectType(),
          x: timeLog.x(),
          y: timeLog.y(),
          angle: timeLog.angle(),
          cannonAngle: timeLog.cannonAngle(),
          velocityLen: timeLog.velocityLen(),
          velocityRotation: timeLog.velocityRotation()
        };

        let objectFromCache: GameHistoryObject | undefined;
        objectFromCache = this.objectsCache.get(objectLog.id());

        if (objectFromCache) {
          if (isDefault(newObject.x)) {
            newObject.x = objectFromCache.x;
          }
          if (isDefault(newObject.y)) {
            newObject.y = objectFromCache.y;
          }
          if (isDefault(newObject.angle)) {
            newObject.angle = objectFromCache.angle;
          }
          if (isDefault(newObject.velocityLen)) {
            newObject.velocityLen = objectFromCache.velocityLen;
          }
          if (isDefault(newObject.velocityRotation)) {
            newObject.velocityRotation = objectFromCache.velocityRotation;
          }
        }
        this.objectsCache.set(objectLog.id(), newObject);

        if (!isDefault(timeLog.velocityUntilTimeId())) {
          objectPredictions(timeIdsCount, timeIds, timeLog, objectLog, history);
        }
        this.upsertObjectToHistory(history[timeLog.timeId()].objects, newObject);
      }
    }
    return { timeToStart: wal.currTimeId(), timeIds: timeIds, moments: history };
  }

  private upsertObjectToHistory(objects: GameHistoryObjectsMap, historyObject: GameHistoryObject): void {
    let obj = objects.get(historyObject.id);
    if (obj) {
      obj.x = historyObject.x;
      obj.y = historyObject.y;
      obj.angle = historyObject.angle;
      obj.velocityLen = historyObject.velocityLen;
      obj.velocityRotation = historyObject.velocityRotation;
    } else {
      objects.set(historyObject.id, historyObject);
    }
  }
}
