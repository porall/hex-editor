<template>
  <div class="property-editor glass" v-if="selectedHex">
    <!-- Header -->
    <div class="editor-header">
      <div class="header-title">
        <svg class="header-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 3v18"/>
          <path d="M3 12h18"/>
          <circle cx="12" cy="12" r="9" stroke-dasharray="4 2"/>
        </svg>
        <span>属性编辑器</span>
      </div>
      <button class="close-btn" @click="emit('close')" title="关闭">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <div class="editor-content">
      <!-- Position Section -->
      <div class="property-section">
        <div class="section-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v8M8 12h8"/>
          </svg>
          <span>位置信息</span>
        </div>
        <div class="property-grid">
          <div class="property-field">
            <label>Q</label>
            <div class="input-wrapper">
              <input 
                type="number" 
                :value="selectedHex.q" 
                @change="updateQ" 
                class="input"
              />
            </div>
          </div>
          <div class="property-field">
            <label>R</label>
            <div class="input-wrapper">
              <input 
                type="number" 
                :value="selectedHex.r" 
                @change="updateR" 
                class="input"
              />
            </div>
          </div>
        </div>
        <div class="id-display">
          <span class="id-label">ID</span>
          <code class="id-value">{{ selectedHex.id }}</code>
        </div>
      </div>

      <!-- Style Section -->
      <div class="property-section">
        <div class="section-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="9"/>
            <circle cx="12" cy="12" r="5"/>
          </svg>
          <span>样式</span>
        </div>
        <div class="color-row">
          <div class="color-preview" :style="{ backgroundColor: selectedHex.data.color || '#e8e8e8' }"></div>
          <input 
            type="color" 
            :value="selectedHex.data.color || '#e8e8e8'" 
            @change="updateColor"
            class="color-picker"
          />
          <input 
            type="text" 
            class="input color-input"
            :value="selectedHex.data.color || '#e8e8e8'" 
            @change="updateColor"
          />
        </div>
      </div>

      <!-- Custom Properties Section -->
      <div class="property-section">
        <div class="section-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <path d="M14 2v6h6M16 13H8M16 17H8"/>
          </svg>
          <span>自定义属性</span>
        </div>
        
        <div class="properties-list" v-if="Object.keys(customProperties).length > 0">
          <div 
            v-for="(value, key) in customProperties" 
            :key="key"
            class="property-item"
          >
            <span class="property-key">{{ key }}</span>
            <input 
              type="text" 
              :value="value" 
              @change="(e) => updateCustomProperty(key as string, (e.target as HTMLInputElement).value)"
              class="input property-value"
            />
            <button class="delete-btn" @click="deleteCustomProperty(key as string)" title="删除">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="add-property">
          <input 
            v-model="newPropertyKey" 
            placeholder="属性名" 
            class="input add-key"
          />
          <input 
            v-model="newPropertyValue" 
            placeholder="属性值" 
            class="input add-value"
          />
          <button 
            @click="addCustomProperty" 
            :disabled="!newPropertyKey"
            class="add-btn"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Batch Edit Section -->
      <div class="property-section" v-if="selectedCount > 1">
        <div class="section-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
          </svg>
          <span>批量操作</span>
        </div>
        <div class="batch-info">
          <span class="batch-count">{{ selectedCount }}</span>
          <span class="batch-label">个六边形已选中</span>
        </div>
        <div class="batch-actions">
          <button class="batch-btn" @click="emit('batchUpdate', { color: '#00d4ff' })">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="9"/>
            </svg>
            青色
          </button>
          <button class="batch-btn" @click="emit('batchUpdate', { color: '#ffa500' })">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="9"/>
            </svg>
            橙色
          </button>
          <button class="batch-btn" @click="emit('batchUpdate', { color: '#00ff88' })">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="9"/>
            </svg>
            绿色
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Hexagon } from '../core/types';

const props = defineProps<{
  selectedHex: Hexagon | null;
  selectedCount: number;
}>();

const emit = defineEmits<{
  (e: 'updateHex', id: string, data: Record<string, any>): void;
  (e: 'close'): void;
  (e: 'batchUpdate', data: Record<string, any>): void;
}>();

const newPropertyKey = ref('');
const newPropertyValue = ref('');

const customProperties = computed(() => {
  if (!props.selectedHex) return {};
  const { color, ...rest } = props.selectedHex.data;
  return rest;
});

function updateQ(e: Event) {
  if (!props.selectedHex) return;
  const value = parseInt((e.target as HTMLInputElement).value);
  emit('updateHex', props.selectedHex.id, { q: value });
}

function updateR(e: Event) {
  if (!props.selectedHex) return;
  const value = parseInt((e.target as HTMLInputElement).value);
  emit('updateHex', props.selectedHex.id, { r: value });
}

function updateColor(e: Event) {
  if (!props.selectedHex) return;
  const value = (e.target as HTMLInputElement).value;
  emit('updateHex', props.selectedHex.id, { color: value });
}

function updateCustomProperty(key: string, value: string) {
  if (!props.selectedHex) return;
  const newData = { ...props.selectedHex.data, [key]: value };
  emit('updateHex', props.selectedHex.id, newData);
}

function deleteCustomProperty(key: string) {
  if (!props.selectedHex) return;
  const newData = { ...props.selectedHex.data };
  delete newData[key];
  emit('updateHex', props.selectedHex.id, newData);
}

function addCustomProperty() {
  if (!props.selectedHex || !newPropertyKey.value) return;
  const newData = { ...props.selectedHex.data, [newPropertyKey.value]: newPropertyValue.value };
  emit('updateHex', props.selectedHex.id, newData);
  newPropertyKey.value = '';
  newPropertyValue.value = '';
}
</script>

<style scoped>
.property-editor {
  width: 300px;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--border-default);
  animation: slide-in 0.3s ease;
}

.editor-header {
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

.header-icon {
  color: var(--accent-cyan);
}

.close-btn {
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

.close-btn:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-default);
  color: var(--accent-red);
}

.editor-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.property-section {
  margin-bottom: 24px;
}

.property-section:last-child {
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

.property-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.property-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.property-field label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
}

.input-wrapper {
  position: relative;
}

.input {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-primary);
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.input:focus {
  outline: none;
  border-color: var(--accent-cyan);
  box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.15);
}

.id-display {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  padding: 10px 12px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
}

.id-label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
}

.id-value {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-secondary);
}

.color-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-preview {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  border: 2px solid var(--border-default);
  transition: border-color var(--transition-fast);
}

.color-picker {
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  background: transparent;
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker::-webkit-color-swatch {
  border: 2px solid var(--border-default);
  border-radius: var(--radius-md);
}

.color-input {
  flex: 1;
}

.properties-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.property-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
}

.property-key {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  min-width: 60px;
}

.property-value {
  flex: 1;
  height: 32px;
  font-size: 12px;
}

.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-muted);
  transition: all var(--transition-fast);
}

.delete-btn:hover {
  background: rgba(255, 71, 87, 0.15);
  color: var(--accent-red);
}

.add-property {
  display: flex;
  gap: 8px;
}

.add-key {
  width: 80px;
}

.add-value {
  flex: 1;
}

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--accent-cyan);
  background: rgba(0, 212, 255, 0.1);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--accent-cyan);
  transition: all var(--transition-fast);
}

.add-btn:hover:not(:disabled) {
  background: rgba(0, 212, 255, 0.2);
  box-shadow: 0 0 12px rgba(0, 212, 255, 0.3);
}

.add-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.batch-info {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
  padding: 12px;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(255, 165, 0, 0.05));
  border-radius: var(--radius-md);
  border: 1px solid rgba(0, 212, 255, 0.2);
}

.batch-count {
  font-family: var(--font-mono);
  font-size: 24px;
  font-weight: 600;
  color: var(--accent-cyan);
}

.batch-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.batch-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.batch-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.batch-btn:hover {
  border-color: var(--accent-cyan);
  box-shadow: 0 0 12px rgba(0, 212, 255, 0.2);
}

.batch-btn:nth-child(1):hover { border-color: #00d4ff; color: #00d4ff; }
.batch-btn:nth-child(2):hover { border-color: #ffa500; color: #ffa500; }
.batch-btn:nth-child(3):hover { border-color: #00ff88; color: #00ff88; }

@keyframes slide-in {
  from { 
    opacity: 0; 
    transform: translateX(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateX(0); 
  }
}
</style>