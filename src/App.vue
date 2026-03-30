<template>
  <div class="app">
    <Toolbar
      :current-tool="store.toolMode"
      :can-undo="canUndo"
      :can-redo="canRedo"
      :hex-count="store.hexagonCount"
      :selected-count="store.selectedCount"
      :zoom="store.viewport.zoom"
      @tool-change="store.setToolMode"
      @toggle-orientation="store.toggleOrientation"
      @invert-selection="store.invertSelection"
      @undo="store.undo"
      @redo="store.redo"
      @save="handleSave"
      @load="handleLoad"
      @export="handleExport"
    />
    
    <div class="main-content">
      <HexCanvas
        ref="hexCanvasRef"
        :width="canvasWidth"
        :height="canvasHeight"
        @hex-select="handleHexSelect"
        @selection-change="handleSelectionChange"
        @viewport-change="handleViewportChange"
      />
      
      <Transition name="panel">
        <PropertyEditor
          v-if="selectedHex"
          :selected-hex="selectedHex"
          :selected-count="store.selectedCount"
          @update-hex="handleUpdateHex"
          @close="store.clearSelection"
          @batch-update="handleBatchUpdate"
        />
      </Transition>
    </div>

    <!-- Loading Overlay -->
    <Transition name="fade">
      <div class="loading-overlay" v-if="isLoading">
        <div class="loading-content">
          <div class="loading-hex">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="currentColor" stroke-width="1.5" fill="none"/>
            </svg>
          </div>
          <span class="loading-text">初始化中...</span>
          <span class="loading-progress">{{ initProgress }}%</span>
        </div>
      </div>
    </Transition>

    <!-- Toast Notifications -->
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div 
          v-for="toast in toasts" 
          :key="toast.id" 
          class="toast"
          :class="toast.type"
        >
          <span>{{ toast.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useEditorStore } from './stores/editorStore';
import HexCanvas from './components/HexCanvas.vue';
import Toolbar from './components/Toolbar.vue';
import PropertyEditor from './components/PropertyEditor.vue';
import type { Hexagon } from './core/types';

const store = useEditorStore();
const hexCanvasRef = ref<InstanceType<typeof HexCanvas> | null>(null);

// State
const canvasWidth = ref(800);
const canvasHeight = ref(600);
const isLoading = ref(false);
const initProgress = ref(0);
const toasts = ref<Array<{ id: number; message: string; type: string }>>([]);

let toastId = 0;

const selectedHex = computed(() => {
  if (store.selectedIds.size === 1) {
    const id = Array.from(store.selectedIds)[0];
    return store.hexagons.get(id) || null;
  }
  return null;
});

const canUndo = computed(() => true);
const canRedo = computed(() => true);

// Toast helper
function showToast(message: string, type: string = 'info') {
  const id = ++toastId;
  toasts.value.push({ id, message, type });
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }, 3000);
}

// Event handlers
function handleHexSelect(hex: Hexagon) {
  store.selectHexagon(hex, false);
}

function handleSelectionChange(ids: Set<string>) {
  store.selectHexagons(ids, false);
}

function handleViewportChange(x: number, y: number, zoom: number) {
  store.setViewport({ x, y, zoom });
}

function handleUpdateHex(id: string, data: Record<string, unknown>) {
  if ('q' in data && 'r' in data) {
    const hex = store.hexagons.get(id);
    if (hex) {
      store.moveSelectedHexagons(data.q as number - hex.q, data.r as number - hex.r);
    }
  } else {
    store.updateHexagonData(id, data);
  }
}

function handleBatchUpdate(data: Record<string, unknown>) {
  for (const id of store.selectedIds) {
    store.updateHexagonData(id, data);
  }
  showToast(`已更新 ${store.selectedCount} 个六边形`, 'success');
}

// File operations
async function handleSave() {
  try {
    const { save } = await import('@tauri-apps/plugin-dialog');
    const { writeTextFile } = await import('@tauri-apps/plugin-fs');
    
    const filePath = await save({
      filters: [{ name: 'Hex Editor', extensions: ['json'] }]
    });
    
    if (filePath) {
      const content = store.exportToJSON();
      await writeTextFile(filePath, content);
      showToast('项目已保存', 'success');
    }
  } catch (e) {
    console.log('Using browser download');
    const content = store.exportToJSON();
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hex-editor.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('项目已导出', 'success');
  }
}

async function handleLoad() {
  try {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const { readTextFile } = await import('@tauri-apps/plugin-fs');
    
    const filePath = await open({
      filters: [{ name: 'Hex Editor', extensions: ['json'] }]
    });
    
    if (filePath && typeof filePath === 'string') {
      const content = await readTextFile(filePath);
      store.importFromJSON(content);
      showToast('项目已加载', 'success');
    }
  } catch (e) {
    console.log('Using browser upload');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        const content = await file.text();
        store.importFromJSON(content);
        showToast('项目已加载', 'success');
      }
    };
    input.click();
  }
}

function handleExport() {
  const dataUrl = store.exportToImage();
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = 'hex-editor.png';
  a.click();
  showToast('图片已导出', 'success');
}

// Keyboard shortcuts
function handleKeyDown(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'z') {
      e.preventDefault();
      store.undo();
      showToast('已撤销', 'info');
    } else if (e.key === 'y') {
      e.preventDefault();
      store.redo();
      showToast('已重做', 'info');
    } else if (e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  } else {
    if (e.key === 's') {
      store.setToolMode('select');
    } else if (e.key === 'h') {
      store.setToolMode('pan');
    } else if (e.key === 'Escape') {
      store.clearSelection();
    }
  }
}

// Window resize
function handleResize() {
  const hasPanel = selectedHex.value !== null;
  canvasWidth.value = window.innerWidth - (hasPanel ? 300 : 0);
  canvasHeight.value = window.innerHeight - 52;
  hexCanvasRef.value?.resize(canvasWidth.value, canvasHeight.value);
}

// Initialize
onMounted(async () => {
  isLoading.value = true;
  
  // Simulate progress
  for (let i = 0; i <= 100; i += 10) {
    initProgress.value = i;
    await new Promise(r => setTimeout(r, 50));
  }
  
  store.initializeHexagons(200000);
  
  setTimeout(() => {
    store.setViewport({ x: 100, y: 100, zoom: 0.5 });
    isLoading.value = false;
    showToast('已加载 200,000 个六边形', 'success');
  }, 300);
  
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('resize', handleResize);
  
  handleResize();
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('resize', handleResize);
});
</script>

<style>
/* Global styles are in style.css */

/* App Layout */
.app {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(13, 17, 23, 0.95);
  backdrop-filter: blur(8px);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.loading-hex {
  color: var(--accent-cyan);
  animation: hex-pulse 1.5s ease-in-out infinite;
}

@keyframes hex-pulse {
  0%, 100% { 
    transform: scale(1) rotate(0deg);
    filter: drop-shadow(0 0 10px rgba(0, 212, 255, 0.5));
  }
  50% { 
    transform: scale(1.1) rotate(30deg);
    filter: drop-shadow(0 0 20px rgba(0, 212, 255, 0.8));
  }
}

.loading-text {
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--text-secondary);
  letter-spacing: 2px;
}

.loading-progress {
  font-family: var(--font-mono);
  font-size: 24px;
  font-weight: 600;
  color: var(--accent-cyan);
}

/* Toast Notifications */
.toast-container {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9000;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toast {
  padding: 12px 24px;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-panel);
}

.toast.success {
  border-color: rgba(0, 255, 136, 0.4);
  background: linear-gradient(135deg, rgba(0, 255, 136, 0.1), var(--bg-secondary));
}

.toast.error {
  border-color: rgba(255, 71, 87, 0.4);
  background: linear-gradient(135deg, rgba(255, 71, 87, 0.1), var(--bg-secondary));
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.panel-enter-active {
  transition: all 0.3s ease;
}

.panel-leave-active {
  transition: all 0.2s ease;
}

.panel-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.panel-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>