<template>
  <Transition name="slide">
    <div class="control-panel glass" v-if="isOpen">
      <!-- Header -->
      <div class="panel-header">
        <div class="header-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <span>控制面板</span>
        </div>
        <button class="collapse-btn" @click="emit('close')" title="收起面板">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>

      <div class="panel-content">
        <!-- Zoom Control Section -->
        <div class="section">
          <div class="section-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
              <path d="M11 8v6M8 11h6"/>
            </svg>
            <span>画布缩放</span>
          </div>
          
          <div class="zoom-display">
            <span class="zoom-value">{{ Math.round(currentZoom * 100) }}</span>
            <span class="zoom-unit">%</span>
          </div>
          
          <div class="slider-container">
            <input 
              type="range" 
              min="0.1" 
              max="5" 
              step="0.05"
              :value="currentZoom"
              @input="onZoomChange"
              class="zoom-slider"
            />
            <div class="slider-labels">
              <span>10%</span>
              <span>500%</span>
            </div>
          </div>
          
          <div class="zoom-actions">
            <button class="action-btn" @click="resetZoom">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
              重置
            </button>
            <button class="action-btn" @click="fitToScreen">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3"/>
                <path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
                <path d="M3 16v3a2 2 0 0 0 2 2h3"/>
                <path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
              </svg>
              适应屏幕
            </button>
          </div>
        </div>

        <!-- Init Config Section -->
        <div class="section">
          <div class="section-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
            <span>初始化配置</span>
          </div>
          
          <div class="config-form">
            <div class="config-field">
              <label>六边形数量</label>
              <div class="input-group">
                <input 
                  type="number" 
                  v-model.number="configForm.count"
                  min="100"
                  max="500000"
                  step="1000"
                  class="config-input"
                />
                <span class="input-suffix">个</span>
              </div>
            </div>
            
            <div class="config-field">
              <label>六边形大小</label>
              <div class="input-group">
                <input 
                  type="number" 
                  v-model.number="configForm.size"
                  min="4"
                  max="50"
                  step="1"
                  class="config-input"
                />
                <span class="input-suffix">px</span>
              </div>
            </div>
            
            <button class="apply-btn" @click="applyConfig" :disabled="isApplying">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {{ isApplying ? '应用中...' : '应用配置' }}
            </button>
          </div>
        </div>

        <!-- Documentation Section -->
        <div class="section">
          <div class="section-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            <span>说明文档</span>
          </div>
          
          <div class="doc-tabs">
            <button 
              v-for="tab in docTabs" 
              :key="tab.id"
              class="doc-tab"
              :class="{ active: activeTab === tab.id }"
              @click="activeTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </div>
          
          <div class="doc-content">
            <!-- Shortcuts Tab -->
            <div v-if="activeTab === 'shortcuts'" class="doc-section">
              <div class="shortcut-item">
                <kbd>左键</kbd>
                <span>选中六边形 / 开始框选</span>
              </div>
              <div class="shortcut-item">
                <kbd>右键拖拽</kbd>
                <span>平移画布</span>
              </div>
              <div class="shortcut-item">
                <kbd>滚轮</kbd>
                <span>缩放画布</span>
              </div>
              <div class="shortcut-item">
                <kbd>Ctrl + 左键</kbd>
                <span>追加选择</span>
              </div>
              <div class="shortcut-item">
                <kbd>Ctrl + 框选</kbd>
                <span>追加到选择</span>
              </div>
              <div class="shortcut-item">
                <kbd>Ctrl + Z</kbd>
                <span>撤销</span>
              </div>
              <div class="shortcut-item">
                <kbd>Ctrl + Y</kbd>
                <span>重做</span>
              </div>
              <div class="shortcut-item">
                <kbd>Ctrl + S</kbd>
                <span>保存项目</span>
              </div>
              <div class="shortcut-item">
                <kbd>Escape</kbd>
                <span>取消选择</span>
              </div>
            </div>
            
            <!-- Operations Tab -->
            <div v-if="activeTab === 'operations'" class="doc-section">
              <h4>区域选中</h4>
              <p>在空白区域按住左键拖拽，可以框选多个六边形。被选中的六边形会高亮显示。</p>
              
              <h4>属性编辑</h4>
              <p>选中一个六边形后，右侧会出现属性面板，可以修改颜色和自定义属性。</p>
              
              <h4>保存加载</h4>
              <p>使用工具栏的保存/加载按钮可以导出/导入 JSON 格式的项目文件。</p>
              
              <h4>图片导出</h4>
              <p>点击导出按钮可以将当前画布内容导出为 PNG 图片。</p>
            </div>
            
            <!-- Technical Tab -->
            <div v-if="activeTab === 'technical'" class="doc-section">
              <h4>架构设计</h4>
              <ul>
                <li>使用 Canvas 2D 进行渲染</li>
                <li>Grid Hash Map 空间索引实现 O(1) 查询</li>
                <li>Axial Coordinates (q, r) 存储六边形位置</li>
                <li>视口裁剪只渲染可见区域</li>
              </ul>
              
              <h4>性能优化</h4>
              <ul>
                <li>批量绘制同色六边形</li>
                <li>requestAnimationFrame 渲染循环</li>
                <li>viewport culling 视口裁剪</li>
              </ul>
              
              <h4>技术栈</h4>
              <div class="tech-tags">
                <span class="tech-tag">Vue 3</span>
                <span class="tech-tag">TypeScript</span>
                <span class="tech-tag">Vite</span>
                <span class="tech-tag">Tauri</span>
                <span class="tech-tag">Pinia</span>
                <span class="tech-tag">Canvas 2D</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Stats Section -->
        <div class="section stats-section">
          <div class="stat-row">
            <span class="stat-label">六边形数量</span>
            <span class="stat-value">{{ formatNumber(hexCount) }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">已选数量</span>
            <span class="stat-value highlight">{{ selectedCount }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">六边形大小</span>
            <span class="stat-value">{{ hexSize }}px</span>
          </div>
        </div>
      </div>
    </div>
  </Transition>
  
  <!-- Toggle Button (when panel is closed) -->
  <Transition name="fade">
    <button 
      v-if="!isOpen" 
      class="panel-toggle" 
      @click="emit('open')"
      title="打开控制面板"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    </button>
  </Transition>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useEditorStore } from '../stores/editorStore';

const props = defineProps<{
  isOpen: boolean;
  currentZoom: number;
}>();

const emit = defineEmits<{
  (e: 'open'): void;
  (e: 'close'): void;
  (e: 'zoomChange', zoom: number): void;
  (e: 'resetZoom'): void;
  (e: 'fitToScreen'): void;
  (e: 'applyConfig', config: { count: number; size: number }): void;
}>();

const store = useEditorStore();

// Form state
const configForm = reactive({
  count: 200000,
  size: 8
});

const isApplying = ref(false);

// Doc tabs
const docTabs = [
  { id: 'shortcuts', label: '快捷键' },
  { id: 'operations', label: '操作' },
  { id: 'technical', label: '技术' }
];
const activeTab = ref('shortcuts');

// Computed
const hexCount = computed(() => store.hexagonCount);
const selectedCount = computed(() => store.selectedCount);
const hexSize = computed(() => store.hexMath.size);

// Methods
function onZoomChange(e: Event) {
  const value = parseFloat((e.target as HTMLInputElement).value);
  emit('zoomChange', value);
}

function resetZoom() {
  emit('resetZoom');
}

function fitToScreen() {
  emit('fitToScreen');
}

function applyConfig() {
  isApplying.value = true;
  emit('applyConfig', {
    count: configForm.count,
    size: configForm.size
  });
  setTimeout(() => {
    isApplying.value = false;
  }, 500);
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}
</script>

<style scoped>
.control-panel {
  width: 320px;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--border-default);
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-default);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.header-title svg {
  color: var(--accent-cyan);
}

.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid transparent;
  background: transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.collapse-btn:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-default);
  color: var(--text-primary);
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.section {
  margin-bottom: 24px;
}

.section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--accent-cyan);
  opacity: 0.8;
}

/* Zoom Control */
.zoom-display {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 12px;
  padding: 16px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
}

.zoom-value {
  font-family: var(--font-mono);
  font-size: 32px;
  font-weight: 600;
  color: var(--accent-cyan);
}

.zoom-unit {
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--text-muted);
}

.slider-container {
  margin-bottom: 12px;
}

.zoom-slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--bg-tertiary);
  border-radius: 3px;
  cursor: pointer;
}

.zoom-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--accent-cyan);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
  transition: transform var(--transition-fast);
}

.zoom-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.zoom-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: var(--accent-cyan);
  border: none;
  border-radius: 50%;
  cursor: pointer;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-muted);
}

.zoom-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.action-btn:hover {
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
}

/* Config Form */
.config-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.config-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.config-field label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
}

.input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.config-input {
  flex: 1;
  height: 36px;
  padding: 0 12px;
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--text-primary);
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.config-input:focus {
  outline: none;
  border-color: var(--accent-cyan);
  box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.15);
}

.input-suffix {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-muted);
}

.apply-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(0, 212, 255, 0.1));
  border: 1px solid var(--accent-cyan);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--accent-cyan);
  transition: all var(--transition-fast);
}

.apply-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.3), rgba(0, 212, 255, 0.2));
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
}

.apply-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Documentation */
.doc-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
}

.doc-tab {
  flex: 1;
  padding: 8px 12px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.doc-tab:hover {
  color: var(--text-primary);
}

.doc-tab.active {
  background: rgba(0, 212, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.3);
  color: var(--accent-cyan);
}

.doc-content {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 16px;
  max-height: 200px;
  overflow-y: auto;
}

.doc-section h4 {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.doc-section h4:not(:first-child) {
  margin-top: 16px;
}

.doc-section p {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 8px;
}

.doc-section ul {
  margin: 0;
  padding-left: 20px;
}

.doc-section li {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.8;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
}

.shortcut-item kbd {
  min-width: 80px;
  padding: 4px 8px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  color: var(--accent-cyan);
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  text-align: center;
}

.shortcut-item span {
  font-size: 12px;
  color: var(--text-secondary);
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tech-tag {
  padding: 4px 10px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
}

/* Stats */
.stats-section {
  padding: 16px;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.05), rgba(255, 165, 0, 0.02));
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.stat-row:not(:last-child) {
  border-bottom: 1px solid var(--border-default);
}

.stat-label {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
}

.stat-value {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-value.highlight {
  color: var(--accent-cyan);
}

/* Toggle Button */
.panel-toggle {
  position: fixed;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--accent-cyan);
  transition: all var(--transition-fast);
  z-index: 100;
  box-shadow: var(--shadow-panel);
}

.panel-toggle:hover {
  background: var(--bg-tertiary);
  border-color: var(--accent-cyan);
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
}

/* Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>