// editorStore.ts - Pinia 状态管理
import { defineStore } from 'pinia';
import { ref, computed, shallowRef } from 'vue';
import type { Hexagon, Viewport, ToolMode, HexEditorFile } from '../core/types';
import { HexMath, DEFAULT_SIZE, DEFAULT_ORIENTATION } from '../core/HexMath';
import { SpatialIndex } from '../core/SpatialIndex';
import type { Renderer } from '../core/Renderer';

export const useEditorStore = defineStore('editor', () => {
  // 状态
  const hexagons = ref<Map<string, Hexagon>>(new Map());
  const selectedIds = ref<Set<string>>(new Set());
  const viewport = ref<Viewport>({ x: 0, y: 0, zoom: 1 });
  const toolMode = ref<ToolMode>('select');
  const hexMath = shallowRef<HexMath>(new HexMath(DEFAULT_SIZE, DEFAULT_ORIENTATION));
  const spatialIndex = shallowRef<SpatialIndex>(new SpatialIndex());
  const isDirty = ref(false);
  const filePath = ref<string | null>(null);
  
  // 历史记录（用于撤销/重做）
  const history = ref<Hexagon[][]>([]);
  const historyIndex = ref(-1);
  
  // Renderer引用
  let _renderer: Renderer | null = null;
  
  // 计算属性
  const hexagonCount = computed(() => hexagons.value.size);
  const selectedCount = computed(() => selectedIds.value.size);
  const selectedHexagons = computed(() => {
    const result: Hexagon[] = [];
    for (const id of selectedIds.value) {
      const hex = hexagons.value.get(id);
      if (hex) result.push(hex);
    }
    return result;
  });
  
  // 初始化六边形（生成 20 万个六边形网格）
  function initializeHexagons(count: number = 200000): void {
    hexagons.value.clear();
    spatialIndex.value.clear();
    
    // 计算网格范围（每个六边形约占 12px 宽度）
    // 200000 个六边形，假设 450 x 450 的网格
    const sideLen = Math.ceil(Math.sqrt(count * 2 / Math.sqrt(3)));
    const halfSide = Math.ceil(sideLen / 2);
    
    let created = 0;
    for (let r = -halfSide; r <= halfSide && created < count; r++) {
      for (let q = -halfSide; q <= halfSide && created < count; q++) {
        const hex: Hexagon = {
          id: `${q},${r}`,
          q,
          r,
          data: {
            color: '#e8e8e8'
          }
        };
        hexagons.value.set(hex.id, hex);
        spatialIndex.value.insert(hex, hexMath.value);
        created++;
      }
    }
    
    isDirty.value = true;
    saveToHistory();
  }
  
  // 选中六边形
  function selectHexagon(hex: Hexagon, addToSelection: boolean = false): void {
    if (!addToSelection) {
      selectedIds.value.clear();
    }
    selectedIds.value.add(hex.id);
    isDirty.value = true;
  }
  
  // 选择多个六边形
  function selectHexagons(ids: Set<string>, addToSelection: boolean = false): void {
    if (!addToSelection) {
      selectedIds.value.clear();
    }
    for (const id of ids) {
      if (hexagons.value.has(id)) {
        selectedIds.value.add(id);
      }
    }
    isDirty.value = true;
  }
  
  // 清除选择
  function clearSelection(): void {
    selectedIds.value.clear();
    isDirty.value = true;
  }
  
  // 反选
  function invertSelection(): void {
    const newSelection = new Set<string>();
    for (const id of hexagons.value.keys()) {
      if (!selectedIds.value.has(id)) {
        newSelection.add(id);
      }
    }
    selectedIds.value = newSelection;
    isDirty.value = true;
  }
  
  // 移动选中的六边形
  function moveSelectedHexagons(deltaQ: number, deltaR: number): void {
    const newHexagons = new Map(hexagons.value);
    
    for (const id of selectedIds.value) {
      const hex = newHexagons.get(id);
      if (hex) {
        // 更新位置
        const newQ = hex.q + deltaQ;
        const newR = hex.r + deltaR;
        
        // 从旧位置移除
        spatialIndex.value.remove(id);
        
        // 更新坐标
        hex.q = newQ;
        hex.r = newR;
        hex.id = `${newQ},${newR}`;
        
        // 插入新位置
        spatialIndex.value.insert(hex, hexMath.value);
        newHexagons.set(hex.id, hex);
        
        // 更新选择
        selectedIds.value.delete(id);
        selectedIds.value.add(hex.id);
      }
    }
    
    hexagons.value = newHexagons;
    isDirty.value = true;
  }
  
  // 更新六边形属性
  function updateHexagonData(id: string, data: Record<string, unknown>): void {
    const hex = hexagons.value.get(id);
    if (hex) {
      hex.data = { ...hex.data, ...data };
      isDirty.value = true;
      saveToHistory();
    }
  }
  
  // 更新视图
  function setViewport(vp: Viewport): void {
    viewport.value = vp;
  }
  
  // 设置工具模式
  function setToolMode(mode: ToolMode): void {
    toolMode.value = mode;
  }
  
  // 切换六边形方向
  function toggleOrientation(): void {
    hexMath.value.toggleOrientation();
    // 重建空间索引
    const hexArray = Array.from(hexagons.value.values());
    spatialIndex.value.clear();
    for (const hex of hexArray) {
      spatialIndex.value.insert(hex, hexMath.value);
    }
    isDirty.value = true;
  }
  
  // 保存到历史
  function saveToHistory(): void {
    const snapshot = Array.from(hexagons.value.values()).map(h => ({ ...h }));
    
    // 移除当前位置之后的历史
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1);
    }
    
    history.value.push(snapshot);
    historyIndex.value = history.value.length - 1;
    
    // 限制历史记录数量
    if (history.value.length > 50) {
      history.value.shift();
      historyIndex.value--;
    }
  }
  
  // 撤销
  function undo(): void {
    if (historyIndex.value > 0) {
      historyIndex.value--;
      restoreFromHistory(history.value[historyIndex.value]);
    }
  }
  
  // 重做
  function redo(): void {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++;
      restoreFromHistory(history.value[historyIndex.value]);
    }
  }
  
  // 从历史恢复
  function restoreFromHistory(snapshot: Hexagon[]): void {
    hexagons.value.clear();
    spatialIndex.value.clear();
    
    for (const hex of snapshot) {
      hexagons.value.set(hex.id, hex);
      spatialIndex.value.insert(hex, hexMath.value);
    }
    
    isDirty.value = true;
  }
  
  // 导出为 JSON
  function exportToJSON(): string {
    const file: HexEditorFile = {
      version: '1.0',
      settings: {
        hexSize: hexMath.value.size,
        orientation: hexMath.value.orientation as 'flat-top' | 'pointy-top',
        viewport: viewport.value
      },
      hexagons: Array.from(hexagons.value.values())
    };
    return JSON.stringify(file, null, 2);
  }
  
  // 从 JSON 导入
  function importFromJSON(json: string): void {
    try {
      const file: HexEditorFile = JSON.parse(json);
      hexagons.value.clear();
      spatialIndex.value.clear();
      
      for (const hex of file.hexagons) {
        hexagons.value.set(hex.id, hex);
        spatialIndex.value.insert(hex, hexMath.value);
      }
      
      hexMath.value.size = file.settings.hexSize;
      hexMath.value.orientation = file.settings.orientation as 'flat-top' | 'pointy-top';
      viewport.value = file.settings.viewport;
      
      selectedIds.value.clear();
      isDirty.value = false;
      saveToHistory();
    } catch (e) {
      console.error('Failed to import JSON:', e);
    }
  }
  
  // 导出为图片
  function exportToImage(): string {
    if (_renderer) {
      return _renderer.toImage('image/png');
    }
    return '';
  }
  
  // 设置编辑器引用（用于图片导出）
  function setRenderer(renderer: Renderer): void {
    _renderer = renderer;
  }
  
  return {
    // 状态
    hexagons,
    selectedIds,
    viewport,
    toolMode,
    hexMath,
    spatialIndex,
    isDirty,
    filePath,
    
    // 计算属性
    hexagonCount,
    selectedCount,
    selectedHexagons,
    
    // 方法
    initializeHexagons,
    selectHexagon,
    selectHexagons,
    clearSelection,
    invertSelection,
    moveSelectedHexagons,
    updateHexagonData,
    setViewport,
    setToolMode,
    toggleOrientation,
    undo,
    redo,
    exportToJSON,
    importFromJSON,
    exportToImage,
    setRenderer
  };
});