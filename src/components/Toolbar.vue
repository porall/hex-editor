<template>
  <div class="toolbar glass">
    <div class="toolbar-inner">
      <!-- Logo / Brand -->
      <div class="toolbar-brand">
        <svg class="brand-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="currentColor" stroke-width="1.5" fill="none"/>
          <path d="M12 7v10M3 7l9 5 9-5" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
        </svg>
        <span class="brand-text">HEX</span>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Tool Group -->
      <div class="toolbar-group">
        <button
          class="tool-btn"
          :class="{ active: currentTool === 'select' }"
          @click="emit('toolChange', 'select')"
          title="选择工具 (S)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
            <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/>
            <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
            <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
          </svg>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Edit Group -->
      <div class="toolbar-group">
        <button
          class="tool-btn"
          @click="emit('toggleOrientation')"
          title="切换六边形方向"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1" opacity="0.5"/>
            <rect x="3" y="14" width="7" height="7" rx="1" opacity="0.5"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
        </button>
        <button
          class="tool-btn"
          @click="emit('invertSelection')"
          title="反选"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M9 9h6v6H9z"/>
          </svg>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- History Group -->
      <div class="toolbar-group">
        <button
          class="tool-btn"
          @click="emit('undo')"
          :disabled="!canUndo"
          title="撤销 (Ctrl+Z)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 7v6h-6"/>
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/>
          </svg>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- File Group -->
      <div class="toolbar-group">
        <button
          class="tool-btn"
          @click="emit('save')"
          title="保存 (Ctrl+S)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </button>
      </div>

      <div class="toolbar-spacer"></div>

      <!-- Stats -->
      <div class="toolbar-stats">
        <div class="stat-item">
          <span class="stat-value">{{ formatNumber(hexCount) }}</span>
          <span class="stat-label">HEX</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item" :class="{ highlight: selectedCount > 0 }">
          <span class="stat-value">{{ selectedCount }}</span>
          <span class="stat-label">SEL</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ zoomPercent }}%</span>
          <span class="stat-label">ZOOM</span>
        </div>
      </div>
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

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}
</script>

<style scoped>
.toolbar {
  position: relative;
  z-index: 100;
  border-bottom: 1px solid var(--border-default);
}

.toolbar-inner {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  gap: 8px;
}

.toolbar-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--accent-cyan);
  padding-right: 8px;
}

.brand-icon {
  filter: drop-shadow(0 0 8px rgba(0, 212, 255, 0.5));
}

.brand-text {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 2px;
}

.toolbar-divider {
  width: 1px;
  height: 28px;
  background: linear-gradient(
    to bottom,
    transparent,
    var(--border-default) 20%,
    var(--border-default) 80%,
    transparent
  );
}

.toolbar-group {
  display: flex;
  gap: 4px;
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
  border: 1px solid transparent;
  background: transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  position: relative;
}

.tool-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--accent-cyan), transparent);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.tool-btn:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
  border-color: var(--border-default);
}

.tool-btn:hover::before {
  opacity: 0.05;
}

.tool-btn.active {
  color: var(--accent-cyan);
  background: rgba(0, 212, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.3);
  box-shadow: 0 0 12px rgba(0, 212, 255, 0.2);
}

.tool-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.tool-btn:disabled:hover {
  background: transparent;
  border-color: transparent;
  box-shadow: none;
}

.toolbar-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 48px;
}

.stat-value {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 500;
  color: var(--text-muted);
  letter-spacing: 1px;
}

.stat-item.highlight .stat-value {
  color: var(--accent-cyan);
  text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
}

.stat-divider {
  width: 1px;
  height: 24px;
  background: var(--border-default);
}
</style>