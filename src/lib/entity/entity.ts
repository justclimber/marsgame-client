import {Components} from "@/lib/component/components";

export default class Entity {
  id: number = 0;
  components: Map<Components, any> = new Map();

  constructor(id: number) {
    this.id = id;
  }
}
