// Interaction.ts - 交互管理器
// 处理鼠标事件、选择、拖拽等交互

import type { Hexagon, ToolMode } from './types';
import { HexMath } from './HexMath';
import type { Renderer } from './Renderer';
import type { SpatialIndex } from './SpatialIndex';

export interface InteractionEvents {
  onHexSelect?: (hex: Hexagon) => void;
  onHexDrag?: (hexes: Hexagon[], dx: number, dy: number) => void;
  onSelectionChange?: (ids: Set<string>) => void;
  onViewportChange?: (x: number, y: number, zoom: number) => void;
}

export class InteractionManager {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private hexMath: HexMath;
  private spatialIndex: SpatialIndex;
  private events: InteractionEvents;

  private mode: ToolMode = 'select';
  private isDragging: boolean = false;
  private isPanning: boolean = false;
  private isSelecting: boolean = false;
  private startX: number = 0;
  private startY: number = 0;
  private lastX: number = 0;
  private lastY: number = 0;
  private selectStartX: number = 0;
  private selectStartY: number = 0;
  private dragHexes: Hexagon[] = [];
  private dragOffsets: Map<string, { dx: number; dy: number }> = new Map();

  constructor(
    canvas: HTMLCanvasElement,
    renderer: Renderer,
    hexMath: HexMath,
    spatialIndex: SpatialIndex,
    events: InteractionEvents
  ) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.hexMath = hexMath;
    this.spatialIndex = spatialIndex;
    this.events = events;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('wheel', this.onWheel.bind(this));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  setMode(mode: ToolMode): void {
    this.mode = mode;
    this.isDragging = false;
    this.isPanning = false;
    this.isSelecting = false;
  }

  getMode(): ToolMode {
    return this.mode;
  }

  private onMouseDown(e: MouseEvent): void {
    const worldPos = this.renderer.screenToWorld(e.offsetX, e.offsetY);
    this.startX = worldPos.x;
    this.startY = worldPos.y;
    this.lastX = e.offsetX;
    this.lastY = e.offsetY;

    // 右键或按住空格拖拽画布
    if (e.button === 2 || e.getModifierState('Space')) {
      this.isPanning = true;
      this.canvas.style.cursor = 'grabbing';
      return;
    }

    // 中键拖拽
    if (e.button === 1) {
      this.isPanning = true;
      this.canvas.style.cursor = 'grabbing';
      return;
    }

    // 左键
    if (e.button === 0) {
      const hex = this.spatialIndex.queryPoint(worldPos.x, worldPos.y, this.hexMath);

      if (hex) {
        this.events.onHexSelect?.(hex);
        this.isDragging = true;
        this.canvas.style.cursor = 'move';
      } else {
        // 开始框选
        this.isSelecting = true;
        this.selectStartX = worldPos.x;
        this.selectStartY = worldPos.y;
      }
    }
  }

  private onMouseMove(e: MouseEvent): void {
    const worldPos = this.renderer.screenToWorld(e.offsetX, e.offsetY);

    // 拖拽画布
    if (this.isPanning) {
      const dx = e.offsetX - this.lastX;
      const dy = e.offsetY - this.lastY;
      this.lastX = e.offsetX;
      this.lastY = e.offsetY;

      const vp = this.renderer.getViewport();
      this.renderer.setViewport({
        ...vp,
        x: vp.x + dx,
        y: vp.y + dy
      });
      this.events.onViewportChange?.(vp.x + dx, vp.y + dy, vp.zoom);
      return;
    }

    // 拖拽六边形
    if (this.isDragging && this.dragHexes.length > 0) {
      const dx = worldPos.x - this.startX;
      const dy = worldPos.y - this.startY;
      
      this.events.onHexDrag?.(this.dragHexes, dx, dy);
      this.startX = worldPos.x;
      this.startY = worldPos.y;
      return;
    }

    // 框选
    if (this.isSelecting) {
      this.renderer.renderSelectionRect(
        this.selectStartX, this.selectStartY,
        worldPos.x, worldPos.y
      );
      return;
    }

    // 默认光标
    if (this.mode === 'pan') {
      this.canvas.style.cursor = 'grab';
    } else if (this.mode === 'select') {
      const hex = this.spatialIndex.queryPoint(worldPos.x, worldPos.y, this.hexMath);
      this.canvas.style.cursor = hex ? 'pointer' : 'default';
    }
  }

  private onMouseUp(e: MouseEvent): void {
    const worldPos = this.renderer.screenToWorld(e.offsetX, e.offsetY);

    // 结束拖拽
    if (this.isDragging) {
      this.isDragging = false;
      this.dragHexes = [];
      this.canvas.style.cursor = 'default';
    }

    // 结束框选
    if (this.isSelecting) {
      const selectedHexes = this.spatialIndex.queryRect(
        this.selectStartX, this.selectStartY,
        worldPos.x, worldPos.y,
        this.hexMath
      );
      
      const ids = new Set(selectedHexes.map(h => h.id));
      
      if (e.ctrlKey || e.metaKey) {
        // 反选
        this.events.onSelectionChange?.(ids);
      } else {
        this.events.onSelectionChange?.(ids);
      }
      
      this.isSelecting = false;
    }

    // 结束平移
    if (this.isPanning) {
      this.isPanning = false;
      this.canvas.style.cursor = 'default';
    }
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();

    const vp = this.renderer.getViewport();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(10, vp.zoom * zoomFactor));

    // 以鼠标位置为中心缩放
    const mouseX = e.offsetX;
    const mouseY = e.offsetY;

    const newX = mouseX - (mouseX - vp.x) * (newZoom / vp.zoom);
    const newY = mouseY - (mouseY - vp.y) * (newZoom / vp.zoom);

    this.renderer.setViewport({
      x: newX,
      y: newY,
      zoom: newZoom
    });

    this.events.onViewportChange?.(newX, newY, newZoom);
  }

  // 设置要拖拽的六边形
  setDragHexes(hexes: Hexagon[]): void {
    this.dragHexes = hexes;
    this.dragOffsets.clear();
    
    const centerX = hexes.reduce((sum, h) => sum + this.hexMath.axialToPixel(h.q, h.r).x, 0) / hexes.length;
    const centerY = hexes.reduce((sum, h) => sum + this.hexMath.axialToPixel(h.q, h.r).y, 0) / hexes.length;
    
    for (const hex of hexes) {
      const pos = this.hexMath.axialToPixel(hex.q, hex.r);
      this.dragOffsets.set(hex.id, {
        dx: pos.x - centerX,
        dy: pos.y - centerY
      });
    }
  }

  // 销毁
  destroy(): void {
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mouseup', this.onMouseUp);
    this.canvas.removeEventListener('wheel', this.onWheel);
  }
}