<template>
  <div class="hex-canvas-container" ref="containerRef">
    <canvas
      ref="canvasRef"
      class="hex-canvas"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @wheel="onWheel"
      @contextmenu.prevent
    ></canvas>
    
    <!-- Selection Box Overlay (using screen coordinates) -->
    <div
      v-if="isSelecting && selectionRect.width > 5 && selectionRect.height > 5"
      class="selection-overlay"
      :style="selectionRectStyle"
    >
      <div class="selection-box"></div>
      <div class="selection-label">{{ selectionCount }} selected</div>
    </div>

    <!-- Zoom Indicator -->
    <Transition name="fade">
      <div class="zoom-indicator" v-if="showZoomHint">
        <span>{{ Math.round(zoom * 100) }}%</span>
      </div>
    </Transition>

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
import type { Hexagon, Point } from '../core/types';

const props = defineProps<{
  width: number;
  height: number;
}>();

const emit = defineEmits<{
  (e: 'hexSelect', hex: Hexagon): void;
  (e: 'selectionChange', ids: Set<string>, addToSelection: boolean): void;
  (e: 'viewportChange', x: number, y: number, zoom: number): void;
}>();

const store = useEditorStore();

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
let renderer: Renderer | null = null;
let hexMath: HexMath | null = null;
let spatialIndex: SpatialIndex | null = null;

// Selection state (screen coordinates for DOM, world coordinates for query)
const isSelecting = ref(false);
const selectStartScreen = ref<Point>({ x: 0, y: 0 });
const selectStartWorld = ref<Point>({ x: 0, y: 0 });
const selectEndScreen = ref<Point>({ x: 0, y: 0 });
const selectEndWorld = ref<Point>({ x: 0, y: 0 });

// Pan state
const isPanning = ref(false);
const lastPanX = ref(0);
const lastPanY = ref(0);

// Drag state
const isDragging = ref(false);
const dragHexes = ref<Hexagon[]>([]);

// UI state
const mouseWorldPos = ref<Point | null>(null);
const zoom = ref(1);
const showZoomHint = ref(false);
const selectionCount = ref(0);
const ctrlHeld = ref(false);

// Selection rectangle in screen coordinates
const selectionRect = computed(() => {
  const left = Math.min(selectStartScreen.value.x, selectEndScreen.value.x);
  const top = Math.min(selectStartScreen.value.y, selectEndScreen.value.y);
  const width = Math.abs(selectEndScreen.value.x - selectStartScreen.value.x);
  const height = Math.abs(selectEndScreen.value.y - selectStartScreen.value.y);
  return { left, top, width, height };
});

const selectionRectStyle = computed(() => ({
  left: `${selectionRect.value.left}px`,
  top: `${selectionRect.value.top}px`,
  width: `${selectionRect.value.width}px`,
  height: `${selectionRect.value.height}px`
}));

function init() {
  if (!canvasRef.value) return;
  
  hexMath = store.hexMath as HexMath;
  spatialIndex = store.spatialIndex as SpatialIndex;
  
  renderer = new Renderer(canvasRef.value, hexMath);
  store.setRenderer(renderer);
  
  renderer.startRenderLoop(() => {
    render();
  });
  
  render();
}

function render() {
  if (!renderer) return;
  renderer.renderHexagons(store.hexagons, store.selectedIds);
}

function getCanvasRect(): DOMRect | null {
  return canvasRef.value?.getBoundingClientRect() ?? null;
}

function getContainerRect(): DOMRect | null {
  return containerRef.value?.getBoundingClientRect() ?? null;
}

function onMouseDown(e: MouseEvent) {
  if (!renderer || !spatialIndex || !hexMath) return;
  
  const canvasRect = getCanvasRect();
  if (!canvasRect) return;
  
  const screenX = e.clientX - canvasRect.left;
  const screenY = e.clientY - canvasRect.top;
  const worldPos = renderer.screenToWorld(screenX, screenY);
  
  // Track Ctrl key state
  ctrlHeld.value = e.ctrlKey || e.metaKey;
  
  // Right click or middle click = pan
  if (e.button === 2 || e.button === 1) {
    isPanning.value = true;
    lastPanX.value = e.clientX;
    lastPanY.value = e.clientY;
    canvasRef.value!.style.cursor = 'grabbing';
    return;
  }
  
  // Left click
  if (e.button === 0) {
    // Check if clicking on a hexagon
    const hex = spatialIndex.queryPoint(worldPos.x, worldPos.y, hexMath);
    
    if (hex) {
      // Clicked on hex - handle selection
      if (ctrlHeld.value) {
        // Toggle selection (add/remove)
        const newIds = new Set(store.selectedIds);
        if (newIds.has(hex.id)) {
          newIds.delete(hex.id);
        } else {
          newIds.add(hex.id);
        }
        emit('selectionChange', newIds, true);
      } else {
        // Single select
        emit('hexSelect', hex);
      }
      isDragging.value = true;
      dragHexes.value = hex ? [hex] : [];
      canvasRef.value!.style.cursor = 'move';
    } else {
      // Clicked on empty space - start box selection
      if (!ctrlHeld.value) {
        // Clear selection if not holding Ctrl
        store.clearSelection();
      }
      
      isSelecting.value = true;
      selectStartScreen.value = { x: screenX, y: screenY };
      selectStartWorld.value = worldPos;
      selectEndScreen.value = { x: screenX, y: screenY };
      selectEndWorld.value = worldPos;
      canvasRef.value!.style.cursor = 'crosshair';
    }
  }
}

function onMouseMove(e: MouseEvent) {
  if (!renderer || !spatialIndex || !hexMath) return;
  
  const canvasRect = getCanvasRect();
  if (!canvasRect) return;
  
  const screenX = e.clientX - canvasRect.left;
  const screenY = e.clientY - canvasRect.top;
  const worldPos = renderer.screenToWorld(screenX, screenY);
  
  // Update mouse world position
  mouseWorldPos.value = worldPos;
  
  // Panning
  if (isPanning.value) {
    const dx = e.clientX - lastPanX.value;
    const dy = e.clientY - lastPanY.value;
    lastPanX.value = e.clientX;
    lastPanY.value = e.clientY;
    
    const vp = renderer.getViewport();
    renderer.setViewport({
      x: vp.x + dx,
      y: vp.y + dy,
      zoom: vp.zoom
    });
    emit('viewportChange', vp.x + dx, vp.y + dy, vp.zoom);
    return;
  }
  
  // Box selection
  if (isSelecting.value) {
    selectEndScreen.value = { x: screenX, y: screenY };
    selectEndWorld.value = worldPos;
    
    // Calculate selection count in real-time
    const selectedHexes = spatialIndex.queryRect(
      selectStartWorld.value.x, selectStartWorld.value.y,
      selectEndWorld.value.x, selectEndWorld.value.y,
      hexMath
    );
    selectionCount.value = selectedHexes.length;
    
    // Draw selection rectangle
    if (renderer) {
      // Temporarily render selection rect
      renderer.renderHexagons(store.hexagons, store.selectedIds);
      renderer.renderSelectionRect(
        selectStartWorld.value.x, selectStartWorld.value.y,
        selectEndWorld.value.x, selectEndWorld.value.y
      );
    }
    return;
  }
  
  // Default cursor
  if (!isDragging.value) {
    if (store.toolMode === 'pan') {
      canvasRef.value!.style.cursor = 'grab';
    } else {
      const hex = spatialIndex.queryPoint(worldPos.x, worldPos.y, hexMath);
      canvasRef.value!.style.cursor = hex ? 'pointer' : 'default';
    }
  }
}

function onMouseUp(e: MouseEvent) {
  if (!renderer || !spatialIndex || !hexMath) return;
  
  // End panning
  if (isPanning.value) {
    isPanning.value = false;
    canvasRef.value!.style.cursor = 'default';
    return;
  }
  
  // End dragging
  if (isDragging.value) {
    isDragging.value = false;
    dragHexes.value = [];
    canvasRef.value!.style.cursor = 'default';
    return;
  }
  
  // End box selection
  if (isSelecting.value) {
    isSelecting.value = false;
    
    // Only process if selection rect is large enough
    if (selectionRect.value.width > 5 || selectionRect.value.height > 5) {
      const selectedHexes = spatialIndex.queryRect(
        selectStartWorld.value.x, selectStartWorld.value.y,
        selectEndWorld.value.x, selectEndWorld.value.y,
        hexMath
      );
      
      const selectedIds = new Set(selectedHexes.map(h => h.id));
      
      if (ctrlHeld.value) {
        // Inverse selection: items in the rect become deselected, items outside become selected
        const newIds = new Set<string>();
        for (const [id, hex] of store.hexagons.entries()) {
          if (selectedIds.has(id)) {
            // Not selected - keep as is
            if (store.selectedIds.has(id)) {
              // Was selected, now in rect - remove from selection
            } else {
              // Was not selected - keep not selected
            }
          } else {
            // Not in rect - should be selected
            if (!store.selectedIds.has(id)) {
              newIds.add(id);
            } else {
              newIds.add(id); // Keep selected
            }
          }
        }
        // Simpler: invert the relationship between selected and in-rect
        // Items in rect that were selected -> unselected
        // Items in rect that were not selected -> remain unselected
        // Items outside rect that were selected -> remain selected
        // Items outside rect that were not selected -> remain unselected
        
        // What user probably wants: items INSIDE rect become selected (or toggled)
        // But ctrl+box = add to selection
        const finalIds = new Set(store.selectedIds);
        for (const id of selectedIds) {
          finalIds.add(id);
        }
        emit('selectionChange', finalIds, true);
      } else {
        // Normal box selection - replace selection
        emit('selectionChange', selectedIds, false);
      }
    }
    
    // Re-render to clear selection rect
    render();
  }
}

function onWheel(e: WheelEvent) {
  if (!renderer) return;
  
  e.preventDefault();
  
  const canvasRect = getCanvasRect();
  if (!canvasRect) return;
  
  const vp = renderer.getViewport();
  const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
  const newZoom = Math.max(0.1, Math.min(10, vp.zoom * zoomFactor));
  
  // Zoom towards mouse position
  const mouseX = e.clientX - canvasRect.left;
  const mouseY = e.clientY - canvasRect.top;
  
  const newX = mouseX - (mouseX - vp.x) * (newZoom / vp.zoom);
  const newY = mouseY - (mouseY - vp.y) * (newZoom / vp.zoom);
  
  zoom.value = newZoom;
  renderer.setViewport({ x: newX, y: newY, zoom: newZoom });
  emit('viewportChange', newX, newY, newZoom);
  
  // Show zoom hint briefly
  showZoomHint.value = true;
  setTimeout(() => { showZoomHint.value = false; }, 1000);
}

// Handle key events for Ctrl
function onKeyDown(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey) {
    ctrlHeld.value = true;
  }
}

function onKeyUp(e: KeyboardEvent) {
  if (!e.ctrlKey && !e.metaKey) {
    ctrlHeld.value = false;
  }
}

// Expose methods
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
  
  // Add global key listeners
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
});

onUnmounted(() => {
  if (renderer) {
    renderer.stopRenderLoop();
  }
  
  // Remove global key listeners
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
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

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>