<template>
  <div class="toolbar">
    <div class="toolbar-group">
      <button
        class="tool-btn"
        :class="{ active: currentTool === 'select' }"
        @click="emit('toolChange', 'select')"
        title="选择工具 (S)"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
          <path d="M13 13l6 6"/>
        </svg>
      </button>
      <button
        class="tool-btn"
        :class="{ active: currentTool === 'pan' }"
        @click="emit('toolChange', 'pan')"
        title="平移工具 (H)"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
          <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/>
          <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
          <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
        </svg>
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <button
        class="tool-btn"
        @click="emit('toggleOrientation')"
        title="切换六边形方向"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 3v18"/>
          <path d="M3 12h18"/>
          <path d="m3 9 4 3-4 3"/>
          <path d="m21 9-4 3 4 3"/>
          <path d="m3 15 4-3-4-3"/>
          <path d="m21 15-4-3 4-3"/>
        </svg>
      </button>
      <button
        class="tool-btn"
        @click="emit('invertSelection')"
        title="反选"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M9 9h6v6H9z"/>
        </svg>
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <button
        class="tool-btn"
        @click="emit('undo')"
        :disabled="!canUndo"
        title="撤销 (Ctrl+Z)"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 7v6h6"/>
          <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
        </svg>
      </button>
      <button
        class="tool-btn"
        @click="emit('redo')"
        :disabled="!canRedo"
        title="重做 (Ctrl+Y)"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 7v6h-6"/>
          <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/>
        </svg>
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <button
        class="tool-btn"
        @click="emit('save')"
        title="保存 (Ctrl+S)"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/>
          <polyline points="7 3 7 8 15 8"/>
        </svg>
      </button>
      <button
        class="tool-btn"
        @click="emit('load')"
        title="加载"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </button>
      <button
        class="tool-btn"
        @click="emit('export')"
        title="导出图片"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      </button>
    </div>

    <div class="toolbar-spacer"></div>

    <div class="toolbar-info">
      <span class="info-item">六边形: {{ hexCount }}</span>
      <span class="info-item">已选中: {{ selectedCount }}</span>
      <span class="info-item">缩放: {{ zoomPercent }}%</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ToolMode } from '../core/types';

const props = defineProps<{
  currentTool: ToolMode;
  canUndo: boolean;
  canRedo: boolean;
  hexCount: number;
  selectedCount: number;
  zoom: number;
}>();

const emit = defineEmits<{
  (e: 'toolChange', mode: ToolMode): void;
  (e: 'toggleOrientation'): void;
  (e: 'invertSelection'): void;
  (e: 'undo'): void;
  (e: 'redo'): void;
  (e: 'save'): void;
  (e: 'load'): void;
  (e: 'export'): void;
}>();

const zoomPercent = computed(() => Math.round(props.zoom * 100));
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
}

.toolbar-group {
  display: flex;
  gap: 2px;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #e0e0e0;
  margin: 0 8px;
}

.toolbar-spacer {
  flex: 1;
}

.tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: #666;
  transition: all 0.15s;
}

.tool-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.tool-btn.active {
  background: #e3f2fd;
  color: #1976d2;
}

.tool-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar-info {
  display: flex;
  gap: 16px;
  color: #666;
  font-size: 13px;
}

.info-item {
  white-space: nowrap;
}
</style>