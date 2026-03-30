// HexMath Engine - 六边形数学核心
// 使用 axial coordinates (q, r) 存储六边形位置

export interface Point {
  x: number;
  y: number;
}

export type Orientation = 'flat-top' | 'pointy-top';

// 六方向偏移量（axial coordinates）
export const DIRECTIONS = [
  [1, 0],   // E
  [1, -1],  // NE
  [0, -1],  // NW
  [-1, 0],  // W
  [-1, 1],  // SW
  [0, 1],   // SE
];

// 默认配置
export const DEFAULT_SIZE = 8;  // 半径 8px
export const DEFAULT_ORIENTATION: Orientation = 'flat-top';
export const SNAP_THRESHOLD = 5; // 吸附阈值 5px

export class HexMath {
  private _size: number;
  private _orientation: Orientation;

  constructor(size: number = DEFAULT_SIZE, orientation: Orientation = DEFAULT_ORIENTATION) {
    this._size = size;
    this._orientation = orientation;
  }

  get size(): number {
    return this._size;
  }

  set size(v: number) {
    this._size = v;
  }

  get orientation(): Orientation {
    return this._orientation;
  }

  set orientation(v: Orientation) {
    this._orientation = v;
  }

  toggleOrientation(): Orientation {
    this._orientation = this._orientation === 'flat-top' ? 'pointy-top' : 'flat-top';
    return this._orientation;
  }

  // 计算六边形的宽度和高度
  get width(): number {
    return this._orientation === 'flat-top' ? 2 * this._size : Math.sqrt(3) * this._size;
  }

  get height(): number {
    return this._orientation === 'flat-top' ? Math.sqrt(3) * this._size : 2 * this._size;
  }

  // axial to pixel (中心点)
  axialToPixel(q: number, r: number): Point {
    if (this._orientation === 'pointy-top') {
      return {
        x: this._size * (Math.sqrt(3) * q + Math.sqrt(3)/2 * r),
        y: this._size * (2 * r)
      };
    }
    const x = this._size * (3/2 * q);
    const y = this._size * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
    return { x, y };
  }

  // pixel to axial（返回浮点坐标，用于鼠标检测）
  pixelToAxialF(x: number, y: number): Point {
    if (this._orientation === 'pointy-top') {
      const q = (Math.sqrt(3)/3 * x - 1/3 * y) / this._size;
      const r = (2/3 * y) / this._size;
      return { x: q, y: r };
    }
    const q = (2/3 * x) / this._size;
    const r = (-1/3 * x + Math.sqrt(3)/3 * y) / this._size;
    return { x: q, y: r };
  }

  // pixel 转 axial（返回最近的整数坐标）
  pixelToAxial(x: number, y: number): { q: number; r: number } {
    const f = this.pixelToAxialF(x, y);
    return this.axialRound(f.x, f.y);
  }

  // 四舍五入到最近的六边形格子
  axialRound(q: number, r: number): { q: number; r: number } {
    const s = -q - r;

    let rq = Math.round(q);
    let rr = Math.round(r);
    let rs = Math.round(s);

    const qDiff = Math.abs(rq - q);
    const rDiff = Math.abs(rr - r);
    const sDiff = Math.abs(rs - s);

    if (qDiff > rDiff && qDiff > sDiff) {
      rq = -rr - rs;
    } else if (rDiff > sDiff) {
      rr = -rq - rs;
    }

    return { q: rq, r: rr };
  }

  // 获取邻居
  getNeighbors(q: number, r: number): Array<{ q: number; r: number }> {
    return DIRECTIONS.map(([dq, dr]) => ({ q: q + dq, r: r + dr }));
  }

  // 计算两个六边形的距离
  distance(q1: number, r1: number, q2: number, r2: number): number {
    return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
  }

  // 获取六边形的六个顶点
  getVertices(cx: number, cy: number): Point[] {
    const vertices: Point[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = this._orientation === 'flat-top'
        ? 2 * Math.PI / 6 * i - Math.PI / 6
        : 2 * Math.PI / 6 * i;
      vertices.push({
        x: cx + this._size * Math.cos(angle),
        y: cy + this._size * Math.sin(angle)
      });
    }
    return vertices;
  }

  // 生成六边形路径
  createPath(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    const vertices = this.getVertices(cx, cy);
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < 6; i++) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    ctx.closePath();
  }

  // 检查点是否在六边形内
  containsPoint(cx: number, cy: number, px: number, py: number): boolean {
    const vertices = this.getVertices(cx, cy);
    let inside = false;
    
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i].x, yi = vertices[i].y;
      const xj = vertices[j].x, yj = vertices[j].y;
      
      if (((yi > py) !== (yj > py)) && 
          (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  }

  // 计算吸附位置（边的中点）
  getEdgeMidpoint(hex1: { q: number; r: number }, hex2: { q: number; r: number }): Point | null {
    const p1 = this.axialToPixel(hex1.q, hex1.r);
    const p2 = this.axialToPixel(hex2.q, hex2.r);
    
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2
    };
  }

  // 获取吸附边的方向
  getSnapPosition(currentHex: { q: number; r: number }, allHexagons: Map<string, unknown>, _mouseX: number, _mouseY: number): { q: number; r: number } | null {
    const neighbors = this.getNeighbors(currentHex.q, currentHex.r);

    for (const neighbor of neighbors) {
      const key = `${neighbor.q},${neighbor.r}`;
      if (allHexagons.has(key)) {
        // 找到相邻的六边形，返回吸附位置
        return neighbor;
      }
    }
    return null;
  }
}

export const hexMath = new HexMath();