// types.ts - 全局类型定义

import type { Orientation } from './HexMath';

// 六边形
export interface Hexagon {
  id: string;
  q: number;
  r: number;
  data: Record<string, any>;  // 自定义属性
}

// 选择状态
export interface Selection {
  ids: Set<string>;
  mode: 'single' | 'area' | 'multi';
}

// 视口状态
export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

// 工具模式
export type ToolMode = 'pan' | 'select' | 'lasso';

// 项目配置
export interface ProjectConfig {
  hexSize: number;
  orientation: Orientation;
  viewport: Viewport;
}

// 文件格式
export interface HexEditorFile {
  version: string;
  settings: ProjectConfig;
  hexagons: Hexagon[];
}

// 渲染样式
export interface HexStyle {
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  selectedStrokeColor: string;
  selectedStrokeWidth: number;
}

// 默认样式
export const DEFAULT_STYLE: HexStyle = {
  fillColor: '#1e2530',
  strokeColor: '#3d4654',
  strokeWidth: 0.5,
  selectedStrokeColor: '#00d4ff',
  selectedStrokeWidth: 2,
};

// 工具栏配置
export interface ToolbarConfig {
  canUndo: boolean;
  canRedo: boolean;
  selectionCount: number;
  currentMode: ToolMode;
  zoom: number;
}