import { WalBuffers } from "@/flatbuffers/log_generated";

export interface GameHistory {
  timeIds: number[];
  moments: GameHistoryMoment[];
}

export interface GameHistoryMoment {
  timeId: number;
  objects: GameHistoryObject[];
}
export interface GameHistoryObject {
  id: number;
  objectType: number;

  x: number;
  y: number;
  angle: number;
  cannonAngle: number;
  velocityX: number;
  velocityY: number;
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
      velocityX: timeLog.velocityX(),
      velocityY: timeLog.velocityY(),
      velocityRotation: timeLog.velocityRotation()
    };
    // @fixme: надо учитывать что в истории в будущем уже могут быть объекты
    history[timeIds[t]].objects.push(historyObjectPrediction);
    if (timeIds[t] === timeLog.velocityUntilTimeId()) {
      break;
    }
  }
}

export class WalParser {
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
      history[timeId] = { timeId: timeId, objects: [] };
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
        let historyObject: GameHistoryObject = {
          id: objectLog.id(),
          objectType: objectLog.objectType(),
          x: timeLog.x(),
          y: timeLog.y(),
          angle: timeLog.angle(),
          cannonAngle: timeLog.cannonAngle(),
          velocityX: timeLog.velocityX(),
          velocityY: timeLog.velocityY(),
          velocityRotation: timeLog.velocityRotation()
        };
        if (!isDefault(timeLog.velocityUntilTimeId())) {
          objectPredictions(timeIdsCount, timeIds, timeLog, objectLog, history);
        }
        // @fixme: надо учитывать что в истории в уже могут быть объекты
        history[timeLog.timeId()].objects.push(historyObject);
      }
    }
    return { timeIds: timeIds, moments: history };
  }
}
