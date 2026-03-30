// Renderer.ts - Canvas 渲染器
// 使用视口裁剪和批量绘制优化性能

import type { Hexagon, Viewport, HexStyle } from './types';
import { HexMath, type Point } from './HexMath';
import { DEFAULT_STYLE } from './types';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private hexMath: HexMath;
  private viewport: Viewport;
  private style: HexStyle;
  private animationFrameId: number | null = null;
  private dirty: boolean = false;

  constructor(canvas: HTMLCanvasElement, hexMath: HexMath) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');
    this.ctx = ctx;
    this.hexMath = hexMath;
    this.viewport = { x: 0, y: 0, zoom: 1 };
    this.style = { ...DEFAULT_STYLE };
  }

  setViewport(vp: Viewport): void {
    this.viewport = vp;
    this.markDirty();
  }

  getViewport(): Viewport {
    return { ...this.viewport };
  }

  setStyle(style: Partial<HexStyle>): void {
    this.style = { ...this.style, ...style };
    this.markDirty();
  }

  markDirty(): void {
    this.dirty = true;
  }

  // 主渲染循环
  startRenderLoop(onRender?: () => void): void {
    const loop = () => {
      if (this.dirty && onRender) {
        onRender();
        this.dirty = false;
      }
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  stopRenderLoop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // 清除画布
  clear(): void {
    this.ctx.fillStyle = '#f5f5f5';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // 批量绘制六边形（带视口裁剪）
  renderHexagons(hexagons: Map<string, Hexagon>, selectedIds: Set<string>): void {
    this.clear();
    
    const { x: vpX, y: vpY, zoom } = this.viewport;
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;

    // 计算可见区域（世界坐标）
    const visibleLeft = -vpX / zoom;
    const visibleTop = -vpY / zoom;
    const visibleRight = visibleLeft + canvasWidth / zoom;
    const visibleBottom = visibleTop + canvasHeight / zoom;

    // 抗锯齿设置
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    // 批量绘制（同色六边形合并路径）
    const batches = new Map<string, Hexagon[]>();
    const others: Hexagon[] = [];

    for (const hex of hexagons.values()) {
      const { x, y } = this.hexMath.axialToPixel(hex.q, hex.r);
      
      // 视口裁剪
      const halfWidth = this.hexMath.width / 2 + 2;
      const halfHeight = this.hexMath.height / 2 + 2;
      
      if (x + halfWidth < visibleLeft || x - halfWidth > visibleRight ||
          y + halfHeight < visibleTop || y - halfHeight > visibleBottom) {
        continue;
      }

      if (selectedIds.has(hex.id)) {
        others.push(hex);
      } else {
        const colorKey = hex.data.color || this.style.fillColor;
        if (!batches.has(colorKey)) {
          batches.set(colorKey, []);
        }
        batches.get(colorKey)!.push(hex);
      }
    }

    // 绘制批量组
    this.ctx.save();
    this.ctx.scale(zoom, zoom);
    this.ctx.translate(vpX, vpY);

    // 批量绘制同色六边形
    for (const [color, hexes] of batches) {
      this.ctx.beginPath();
      for (const hex of hexes) {
        const { x, y } = this.hexMath.axialToPixel(hex.q, hex.r);
        this.drawHexPath(x, y, false);
      }
      this.ctx.fillStyle = color;
      this.ctx.fill();
      this.ctx.strokeStyle = this.style.strokeColor;
      this.ctx.lineWidth = this.style.strokeWidth;
      this.ctx.stroke();
    }

    // 绘制选中六边形（单独绘制，带高亮）
    for (const hex of others) {
      const { x, y } = this.hexMath.axialToPixel(hex.q, hex.r);
      this.drawHexagon(x, y, hex.data.color || this.style.fillColor, true);
    }

    this.ctx.restore();
  }

  // 绘制单个六边形
  private drawHexagon(x: number, y: number, fillColor: string, selected: boolean): void {
    // 绘制填充
    this.hexMath.createPath(this.ctx, x, y);
    this.ctx.fillStyle = fillColor;
    this.ctx.fill();

    // 绘制边框
    this.hexMath.createPath(this.ctx, x, y);
    this.ctx.strokeStyle = selected ? this.style.selectedStrokeColor : this.style.strokeColor;
    this.ctx.lineWidth = selected ? this.style.selectedStrokeWidth : this.style.strokeWidth;
    this.ctx.stroke();

    // 选中高亮
    if (selected) {
      this.hexMath.createPath(this.ctx, x, y);
      this.ctx.strokeStyle = this.style.selectedStrokeColor;
      this.ctx.lineWidth = this.style.selectedStrokeWidth + 2;
      this.ctx.stroke();
      
      // 发光效果
      this.ctx.shadowColor = this.style.selectedStrokeColor;
      this.ctx.shadowBlur = 8;
      this.hexMath.createPath(this.ctx, x, y);
      this.ctx.strokeStyle = this.style.selectedStrokeColor;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;
    }
  }

  // 绘制路径（不填充不描边）
  private drawHexPath(x: number, y: number, closed: boolean = true): void {
    const vertices = this.hexMath.getVertices(x, y);
    this.ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < 6; i++) {
      this.ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    if (closed) {
      this.ctx.closePath();
    }
  }

  // 绘制选择框
  renderSelectionRect(x1: number, y1: number, x2: number, y2: number): void {
    const { x: vpX, y: vpY, zoom } = this.viewport;
    
    this.ctx.save();
    this.ctx.scale(zoom, zoom);
    this.ctx.translate(vpX, vpY);
    
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);
    
    this.ctx.strokeStyle = '#2196F3';
    this.ctx.lineWidth = 1 / zoom;
    this.ctx.setLineDash([5 / zoom, 5 / zoom]);
    this.ctx.strokeRect(left, top, width, height);
    
    this.ctx.fillStyle = 'rgba(33, 150, 243, 0.1)';
    this.ctx.fillRect(left, top, width, height);
    this.ctx.setLineDash([]);
    
    this.ctx.restore();
  }

  // 绘制吸附指示线
  renderSnapGuide(x: number, y: number, targetX: number, targetY: number): void {
    const { x: vpX, y: vpY, zoom } = this.viewport;
    
    this.ctx.save();
    this.ctx.scale(zoom, zoom);
    this.ctx.translate(vpX, vpY);
    
    this.ctx.strokeStyle = '#4CAF50';
    this.ctx.lineWidth = 2 / zoom;
    this.ctx.setLineDash([5 / zoom, 3 / zoom]);
    
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(targetX, targetY);
    this.ctx.stroke();
    
    // 绘制吸附点
    this.ctx.fillStyle = '#4CAF50';
    this.ctx.beginPath();
    this.ctx.arc(targetX, targetY, 4 / zoom, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.setLineDash([]);
    this.ctx.restore();
  }

  // 导出为图片
  toImage(type: string = 'image/png'): string {
    return this.canvas.toDataURL(type);
  }

  // 调整画布大小
  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.markDirty();
  }

  // 获取鼠标在世界坐标中的位置
  screenToWorld(screenX: number, screenY: number): Point {
    const { x: vpX, y: vpY, zoom } = this.viewport;
    return {
      x: (screenX - vpX) / zoom,
      y: (screenY - vpY) / zoom
    };
  }

  getVisibleHexagons(hexagons: Map<string, Hexagon>): Hexagon[] {
    const result: Hexagon[] = [];
    const { x: vpX, y: vpY, zoom } = this.viewport;
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;

    const visibleLeft = -vpX / zoom;
    const visibleTop = -vpY / zoom;
    const visibleRight = visibleLeft + canvasWidth / zoom;
    const visibleBottom = visibleTop + canvasHeight / zoom;

    for (const hex of hexagons.values()) {
      const { x, y } = this.hexMath.axialToPixel(hex.q, hex.r);
      const halfWidth = this.hexMath.width / 2 + 2;
      const halfHeight = this.hexMath.height / 2 + 2;
      
      if (!(x + halfWidth < visibleLeft || x - halfWidth > visibleRight ||
            y + halfHeight < visibleTop || y - halfHeight > visibleBottom)) {
        result.push(hex);
      }
    }
    return result;
  }
}