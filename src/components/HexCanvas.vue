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
    
    <!-- Selection Box Overlay -->
    <div
      v-if="isSelecting"
      class="selection-overlay"
      :style="selectionStyle"
    >
      <div class="selection-box"></div>
      <div class="selection-label">{{ selectionCount }} selected</div>
    </div>

    <!-- Zoom Indicator -->
    <div class="zoom-indicator" v-if="showZoomHint">
      <span>{{ Math.round(zoom * 100) }}%</span>
    </div>

    <!-- Coordinate Display -->
    <div class="coord-display" v-if="mouseWorldPos">
      <span class="coord-label">X:</span>
      <span class="coord-value">{{ Math.round(mouseWorldPos.x) }}</span>
      <span class="coord-label">Y:</span>
      <span class="coord-value">{{ Math.round(mouseWorldPos.y) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useEditorStore } from '../stores/editorStore';
import { HexMath } from '../core/HexMath';
import { SpatialIndex } from '../core/SpatialIndex';
import { Renderer } from '../core/Renderer';
import { InteractionManager } from '../core/Interaction';
import type { Hexagon, Point } from '../core/types';

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
const selectStart = ref<Point>({ x: 0, y: 0 });
const selectEnd = ref<Point>({ x: 0, y: 0 });
const mouseWorldPos = ref<Point | null>(null);
const zoom = ref(1);
const showZoomHint = ref(false);
const selectionCount = ref(0);

const selectionStyle = computed(() => {
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
      onViewportChange: (x, y, z) => {
        zoom.value = z;
        emit('viewportChange', x, y, z);
      }
    }
  );
  
  renderer.startRenderLoop(() => {
    render();
  });
  
  // Draw grid background
  drawGridBackground();
  render();
}

function drawGridBackground() {
  if (!canvasRef.value) return;
  const ctx = canvasRef.value.getContext('2d');
  if (!ctx) return;
  
  // Create a pattern for the grid
  const patternCanvas = document.createElement('canvas');
  const patternCtx = patternCanvas.getContext('2d');
  if (!patternCtx) return;
  
  patternCanvas.width = 40;
  patternCanvas.height = 40;
  
  // Draw grid lines
  patternCtx.strokeStyle = 'rgba(0, 212, 255, 0.06)';
  patternCtx.lineWidth = 1;
  patternCtx.beginPath();
  patternCtx.moveTo(0, 0);
  patternCtx.lineTo(40, 0);
  patternCtx.moveTo(0, 0);
  patternCtx.lineTo(0, 40);
  patternCtx.stroke();
  
  // Draw major grid lines
  patternCtx.strokeStyle = 'rgba(0, 212, 255, 0.12)';
  patternCtx.lineWidth = 2;
  patternCtx.beginPath();
  patternCtx.moveTo(0, 0);
  patternCtx.lineTo(40, 0);
  patternCtx.moveTo(0, 0);
  patternCtx.lineTo(0, 40);
  patternCtx.stroke();
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
    const worldPos = renderer!.screenToWorld(x, y);
    isSelecting.value = true;
    selectStart.value = worldPos;
    selectEnd.value = worldPos;
  }
}

function onMouseMove(e: MouseEvent) {
  if (!renderer || !spatialIndex || !hexMath) return;
  
  const rect = canvasRef.value!.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  // Update mouse world position
  mouseWorldPos.value = renderer.screenToWorld(x, y);
  
  if (isSelecting.value) {
    selectEnd.value = renderer.screenToWorld(x, y);
    
    // Calculate selection count in real-time
    const selectedHexes = spatialIndex.queryRect(
      selectStart.value.x, selectStart.value.y,
      selectEnd.value.x, selectEnd.value.y,
      hexMath
    );
    selectionCount.value = selectedHexes.length;
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
  // Show zoom hint briefly
  showZoomHint.value = true;
  setTimeout(() => { showZoomHint.value = false; }, 1000);
}

// Expose methods for parent component
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

// Watch viewport changes
watch(() => store.viewport, () => {
  if (renderer) {
    renderer.setViewport(store.viewport);
  }
}, { deep: true });

// Watch selection changes
watch(() => store.selectedIds, () => {
  render();
}, { deep: true });

// Watch hexagons changes
watch(() => store.hexagons, () => {
  render();
}, { deep: true });
</script>

<style scoped>
.hex-canvas-container {
  position: relative;
  flex: 1;
  overflow: hidden;
  background: 
    radial-gradient(ellipse at 30% 20%, rgba(0, 212, 255, 0.03) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 80%, rgba(255, 165, 0, 0.02) 0%, transparent 50%),
    #0d1117;
}

.hex-canvas {
  display: block;
  cursor: crosshair;
}

/* Selection Box */
.selection-overlay {
  position: absolute;
  pointer-events: none;
  z-index: 10;
}

.selection-box {
  position: absolute;
  inset: 0;
  border: 2px dashed rgba(0, 212, 255, 0.6);
  background: rgba(0, 212, 255, 0.08);
  animation: selection-pulse 1s ease-in-out infinite;
}

@keyframes selection-pulse {
  0%, 100% { 
    border-color: rgba(0, 212, 255, 0.6);
    background: rgba(0, 212, 255, 0.08);
  }
  50% { 
    border-color: rgba(0, 212, 255, 0.9);
    background: rgba(0, 212, 255, 0.12);
  }
}

.selection-label {
  position: absolute;
  top: -28px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 12px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--accent-cyan);
  background: var(--bg-secondary);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: var(--radius-sm);
  white-space: nowrap;
  box-shadow: 0 0 12px rgba(0, 212, 255, 0.3);
}

/* Zoom Indicator */
.zoom-indicator {
  position: absolute;
  bottom: 20px;
  right: 20px;
  padding: 8px 16px;
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  color: var(--accent-cyan);
  background: rgba(13, 17, 23, 0.9);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: var(--radius-md);
  backdrop-filter: blur(8px);
  animation: zoom-fade 1s ease forwards;
}

@keyframes zoom-fade {
  0% { opacity: 0; transform: translateY(10px); }
  20% { opacity: 1; transform: translateY(0); }
  80% { opacity: 1; }
  100% { opacity: 0; }
}

/* Coordinate Display */
.coord-display {
  position: absolute;
  bottom: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  font-family: var(--font-mono);
  font-size: 12px;
  background: rgba(13, 17, 23, 0.9);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  backdrop-filter: blur(8px);
}

.coord-label {
  color: var(--text-muted);
  font-weight: 500;
}

.coord-value {
  color: var(--text-primary);
  min-width: 50px;
}
</style>