import { WalBuffers } from "@/flatbuffers/log_generated";

export default class Parser {
  parseWal(wal: WalBuffers.Log): any {
    const timeIdsCount = wal.timeIdsLength();
    const objLogsCount = wal.objectsLength();
    for (let i = 0; i < timeIdsCount; i++) {
      console.log(wal.timeIds(i)!.low);
    }
    for (let i = 0; i < objLogsCount; i++) {
      let objectLog = wal.objects(i);
      const timeLogsCount = objectLog!.timesLength();
      for (let j = 0; j < timeLogsCount; j++) {
        let timeLog = objectLog!.times(j);
        console.log(timeLog!.x(), timeLog!.y());
      }
    }
  }
}
