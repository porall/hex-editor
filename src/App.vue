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
      
      <PropertyEditor
        v-if="selectedHex"
        :selected-hex="selectedHex"
        :selected-count="store.selectedCount"
        @update-hex="handleUpdateHex"
        @close="store.clearSelection"
        @batch-update="handleBatchUpdate"
      />
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

// 画布尺寸
const canvasWidth = ref(window.innerWidth - (selectedHex.value ? 280 : 0));
const canvasHeight = ref(window.innerHeight - 52);

const selectedHex = computed(() => {
  if (store.selectedIds.size === 1) {
    const id = Array.from(store.selectedIds)[0];
    return store.hexagons.get(id) || null;
  }
  return null;
});

const canUndo = computed(() => true); // 从 store 获取
const canRedo = computed(() => true); // 从 store 获取

// 处理事件
function handleHexSelect(hex: Hexagon) {
  store.selectHexagon(hex, false);
}

function handleSelectionChange(ids: Set<string>) {
  store.selectHexagons(ids, false);
}

function handleViewportChange(x: number, y: number, zoom: number) {
  store.setViewport({ x, y, zoom });
}

function handleUpdateHex(id: string, data: Record<string, any>) {
  // 更新 Q/R 坐标
  if ('q' in data && 'r' in data) {
    const hex = store.hexagons.get(id);
    if (hex) {
      store.moveSelectedHexagons(data.q - hex.q, data.r - hex.r);
    }
  } else {
    store.updateHexagonData(id, data);
  }
}

function handleBatchUpdate(data: Record<string, any>) {
  for (const id of store.selectedIds) {
    store.updateHexagonData(id, data);
  }
}

// 文件操作
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
    }
  } catch (e) {
    console.log('使用浏览器下载');
    // 降级到浏览器下载
    const content = store.exportToJSON();
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hex-editor.json';
    a.click();
    URL.revokeObjectURL(url);
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
    }
  } catch (e) {
    console.log('使用浏览器加载');
    // 降级到浏览器上传
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        const content = await file.text();
        store.importFromJSON(content);
      }
    };
    input.click();
  }
}

function handleExport() {
  const dataUrl = store.exportToImage(null as any);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = 'hex-editor.png';
  a.click();
}

// 键盘快捷键
function handleKeyDown(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'z') {
      e.preventDefault();
      store.undo();
    } else if (e.key === 'y') {
      e.preventDefault();
      store.redo();
    } else if (e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  } else {
    if (e.key === 's') {
      store.setToolMode('select');
    } else if (e.key === 'h') {
      store.setToolMode('pan');
    }
  }
}

// 窗口调整
function handleResize() {
  canvasWidth.value = window.innerWidth - (selectedHex.value ? 280 : 0);
  canvasHeight.value = window.innerHeight - 52;
  hexCanvasRef.value?.resize(canvasWidth.value, canvasHeight.value);
}

onMounted(() => {
  // 初始化 20 万个六边形
  store.initializeHexagons(200000);
  
  // 居中视图
  setTimeout(() => {
    const vp = { x: 100, y: 100, zoom: 0.5 };
    store.setViewport(vp);
  }, 100);
  
  // 监听事件
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('resize', handleResize);
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
}

.app {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}
</style>