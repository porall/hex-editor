<template>
  <div class="hex-canvas-container">
    <canvas
      ref="canvasRef"
      class="hex-canvas"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @wheel.prevent="onWheel"
      @contextmenu.prevent
    ></canvas>
    
    <!-- 选择框 -->
    <div
      v-if="isSelecting"
      class="selection-rect"
      :style="selectionRectStyle"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useEditorStore } from '../stores/editorStore';
import { HexMath } from '../core/HexMath';
import { SpatialIndex } from '../core/SpatialIndex';
import { Renderer } from '../core/Renderer';
import { InteractionManager } from '../core/Interaction';
import type { Hexagon } from '../core/types';

const props = defineProps<{
  width: number;
  height: number;
}>();

const emit = defineEmits<{
  (e: 'hexSelect', hex: Hexagon): void;
  (e: 'selectionChange', ids: Set<string>): void;
  (e: 'viewportChange', x: number, y: number, zoom: number): void;
}>();

const store = useEditorStore();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let renderer: Renderer | null = null;
let interactionManager: InteractionManager | null = null;
let hexMath: HexMath | null = null;
let spatialIndex: SpatialIndex | null = null;

const isSelecting = ref(false);
const selectStart = ref({ x: 0, y: 0 });
const selectEnd = ref({ x: 0, y: 0 });

const selectionRectStyle = computed(() => {
  const left = Math.min(selectStart.value.x, selectEnd.value.x);
  const top = Math.min(selectStart.value.y, selectEnd.value.y);
  const width = Math.abs(selectEnd.value.x - selectStart.value.x);
  const height = Math.abs(selectEnd.value.y - selectStart.value.y);
  
  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`
  };
});

function init() {
  if (!canvasRef.value) return;
  
  hexMath = store.hexMath as HexMath;
  spatialIndex = store.spatialIndex as SpatialIndex;
  
  renderer = new Renderer(canvasRef.value, hexMath);
  store.setRenderer(renderer);
  
  interactionManager = new InteractionManager(
    canvasRef.value,
    renderer,
    hexMath,
    spatialIndex,
    {
      onHexSelect: (hex) => {
        emit('hexSelect', hex);
      },
      onSelectionChange: (ids) => {
        emit('selectionChange', ids);
      },
      onViewportChange: (x, y, zoom) => {
        store.setViewport({ x, y, zoom });
        emit('viewportChange', x, y, zoom);
      }
    }
  );
  
  renderer.startRenderLoop(() => {
    render();
  });
  
  render();
}

function render() {
  if (!renderer) return;
  renderer.renderHexagons(store.hexagons, store.selectedIds, spatialIndex);
}

function onMouseDown(e: MouseEvent) {
  if (!interactionManager) return;
  
  const rect = canvasRef.value!.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  if (e.button === 0 && !e.ctrlKey) {
    // 左键点击空白区域，开始框选
    const worldPos = renderer!.screenToWorld(x, y);
    isSelecting.value = true;
    selectStart.value = worldPos;
    selectEnd.value = worldPos;
  }
}

function onMouseMove(e: MouseEvent) {
  if (!renderer) return;
  
  const rect = canvasRef.value!.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  if (isSelecting.value) {
    selectEnd.value = renderer.screenToWorld(x, y);
  }
}

function onMouseUp(e: MouseEvent) {
  if (!renderer || !spatialIndex || !hexMath) return;
  
  if (isSelecting.value) {
    const selectedHexes = spatialIndex.queryRect(
      selectStart.value.x, selectStart.value.y,
      selectEnd.value.x, selectEnd.value.y,
      hexMath
    );
    
    const ids = new Set(selectedHexes.map(h => h.id));
    emit('selectionChange', ids);
    
    isSelecting.value = false;
  }
}

function onWheel(e: WheelEvent) {
  // Handled by interaction manager
}

// 暴露刷新方法
defineExpose({
  render: () => render(),
  resize: (w: number, h: number) => {
    if (renderer) {
      renderer.resize(w, h);
    }
  }
});

onMounted(() => {
  init();
});

onUnmounted(() => {
  if (interactionManager) {
    interactionManager.destroy();
  }
  if (renderer) {
    renderer.stopRenderLoop();
  }
});

// 监听视口变化
watch(() => store.viewport, () => {
  if (renderer) {
    renderer.setViewport(store.viewport);
  }
}, { deep: true });

// 监听选择变化
watch(() => store.selectedIds, () => {
  render();
}, { deep: true });

// 监听六边形变化
watch(() => store.hexagons, () => {
  render();
}, { deep: true });
</script>

<style scoped>
.hex-canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.hex-canvas {
  display: block;
  cursor: default;
}

.selection-rect {
  position: absolute;
  border: 1px dashed #2196F3;
  background: rgba(33, 150, 243, 0.1);
  pointer-events: none;
}
</style>