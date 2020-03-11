export default class Viewport {
  x: number = 0;
  y: number = 0;
  width: number = 1;
  width2: number = 1;
  height: number = 1;
  height2: number = 1;
  gap: number = 0;
  spacer: number = 30;

  constructor(x: number, y: number, width: number, height: number, gap: number = 0) {
    this.gap = gap;
    this.x = x + gap;
    this.y = y + gap;
    this.width = width - gap * 2;
    this.width2 = width / 2;
    this.height = height - gap * 2;
    this.height2 = height / 2;
  }

  isOutside(x: number, y: number): boolean {
    return x < this.x - this.spacer || x > this.x + this.width || y < this.y - this.spacer || y > this.y + this.height;
  }

  centerTo(x: number, y: number): void {
    this.x = x - this.width2 + this.gap;
    this.y = y - this.height2 + this.gap;
  }
}
