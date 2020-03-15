export default class Movable {
  x: number = 0;
  y: number = 0;
  angle: number = 0;
  velocityX: number = 0;
  velocityY: number = 0;
  velocityRotation: number = 0;

  constructor(x: number, y: number, angle: number) {
    this.x = x;
    this.y = y;
    this.angle = angle;
  }
  destroy(): void {}
}
