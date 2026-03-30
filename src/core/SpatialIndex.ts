// SpatialIndex - 空间索引，使用 Grid Hash Map 优化查询性能
// 将画布划分为 32x32 的格子，每个格子存储该区域的六边形

import type { Hexagon } from './types';

const CELL_SIZE = 32;

export class SpatialIndex {
  private cells: Map<string, Hexagon[]>;
  private hexToCell: Map<string, string>;  // hexId -> cellKey
  
  constructor() {
    this.cells = new Map();
    this.hexToCell = new Map();
  }

  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / CELL_SIZE);
    const cellY = Math.floor(y / CELL_SIZE);
    return `${cellX},${cellY}`;
  }

  private getCellKeyFromHex(q: number, r: number, hexMath: { axialToPixel: (q: number, r: number) => { x: number; y: number } }): string {
    const { x, y } = hexMath.axialToPixel(q, r);
    return this.getCellKey(x, y);
  }

  // 插入六边形
  insert(hex: Hexagon, hexMath: { axialToPixel: (q: number, r: number) => { x: number; y: number } }): void {
    const cellKey = this.getCellKeyFromHex(hex.q, hex.r, hexMath);
    
    if (!this.cells.has(cellKey)) {
      this.cells.set(cellKey, []);
    }
    
    this.cells.get(cellKey)!.push(hex);
    this.hexToCell.set(hex.id, cellKey);
  }

  // 移除六边形
  remove(hexId: string): void {
    const cellKey = this.hexToCell.get(hexId);
    if (!cellKey) return;
    
    const cell = this.cells.get(cellKey);
    if (cell) {
      const index = cell.findIndex(h => h.id === hexId);
      if (index !== -1) {
        cell.splice(index, 1);
      }
    }
    this.hexToCell.delete(hexId);
  }

  // 单点查询
  queryPoint(x: number, y: number, hexMath: { pixelToAxial: (x: number, y: number) => { q: number; r: number }; axialToPixel: (q: number, r: number) => { x: number; y: number }; containsPoint: (cx: number, cy: number, px: number, py: number) => boolean }): Hexagon | null {
    const cellKey = this.getCellKey(x, y);
    const cell = this.cells.get(cellKey);
    
    if (!cell) return null;
    
    const { q, r } = hexMath.pixelToAxial(x, y);
    const targetKey = `${q},${r}`;
    
    // 在当前格子和相邻格子中查找
    const searchKeys = this.getSearchKeys(cellKey);
    
    for (const key of searchKeys) {
      const c = this.cells.get(key);
      if (!c) continue;
      
      for (const hex of c) {
        if (hex.id === targetKey || `${hex.q},${hex.r}` === targetKey) {
          // 精确检查点是否在六边形内
          const { x: hx, y: hy } = hexMath.axialToPixel(hex.q, hex.r);
          if (hexMath.containsPoint(hx, hy, x, y)) {
            return hex;
          }
        }
      }
    }
    
    return null;
  }

  // 矩形范围查询（区域选中）
  queryRect(x1: number, y1: number, x2: number, y2: number, hexMath: { axialToPixel: (q: number, r: number) => { x: number; y: number } }): Hexagon[] {
    const result: Hexagon[] = [];
    
    // 规范化坐标
    const left = Math.min(x1, x2);
    const right = Math.max(x1, x2);
    const top = Math.min(y1, y2);
    const bottom = Math.max(y1, y2);
    
    // 获取覆盖范围的格子
    const startCellX = Math.floor(left / CELL_SIZE);
    const endCellX = Math.floor(right / CELL_SIZE);
    const startCellY = Math.floor(top / CELL_SIZE);
    const endCellY = Math.floor(bottom / CELL_SIZE);
    
    for (let cx = startCellX; cx <= endCellX; cx++) {
      for (let cy = startCellY; cy <= endCellY; cy++) {
        const cellKey = `${cx},${cy}`;
        const cell = this.cells.get(cellKey);
        
        if (!cell) continue;
        
        for (const hex of cell) {
          const { x: hx, y: hy } = hexMath.axialToPixel(hex.q, hex.r);
          // 检查六边形中心是否在矩形内（宽松检测）
          if (hx >= left && hx <= right && hy >= top && hy <= bottom) {
            result.push(hex);
          }
        }
      }
    }
    
    return result;
  }

  // 获取相邻格子
  private getSearchKeys(cellKey: string): string[] {
    const [cx, cy] = cellKey.split(',').map(Number);
    const keys: string[] = [];
    
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        keys.push(`${cx + dx},${cy + dy}`);
      }
    }
    
    return keys;
  }

  // 清除所有数据
  clear(): void {
    this.cells.clear();
    this.hexToCell.clear();
  }

  // 获取所有格子（调试用）
  getAllCells(): Map<string, Hexagon[]> {
    return this.cells;
  }

  // 批量插入（性能优化）
  bulkInsert(hexagons: Hexagon[], hexMath: { axialToPixel: (q: number, r: number) => { x: number; y: number } }): void {
    for (const hex of hexagons) {
      this.insert(hex, hexMath);
    }
  }

  // 更新六边形位置
  updatePosition(hex: Hexagon, _oldQ: number, _oldR: number, newQ: number, newR: number, hexMath: { axialToPixel: (q: number, r: number) => { x: number; y: number } }): void {
    this.remove(hex.id);
    hex.q = newQ;
    hex.r = newR;
    this.insert(hex, hexMath);
  }

  // 获取统计数据
  getStats(): { cellCount: number; hexCount: number } {
    let hexCount = 0;
    for (const cell of this.cells.values()) {
      hexCount += cell.length;
    }
    return {
      cellCount: this.cells.size,
      hexCount
    };
  }
}

export const spatialIndex = new SpatialIndex();