export default class Viewport {
  x: number = 0;
  y: number = 0;
  width: number = 1;
  width2: number = 1;
  height: number = 1;
  height2: number = 1;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.width2 = width / 2;
    this.height = height;
    this.height2 = height / 2;
  }

  isOutside(x: number, y: number): boolean {
    return x < this.x || x > this.x + this.width || y < this.y || y > this.y + this.height;
  }

  centerTo(x: number, y: number): void {
    this.x = x - this.width2;
    this.y = y - this.height2;
  }
}
