<template>
  <div class="property-editor" v-if="selectedHex">
    <div class="editor-header">
      <h3>属性编辑器</h3>
      <button class="close-btn" @click="emit('close')">×</button>
    </div>
    
    <div class="editor-content">
      <div class="property-section">
        <h4>位置信息</h4>
        <div class="property-row">
          <label>Q:</label>
          <input type="number" :value="selectedHex.q" @change="updateQ" />
        </div>
        <div class="property-row">
          <label>R:</label>
          <input type="number" :value="selectedHex.r" @change="updateR" />
        </div>
        <div class="property-row">
          <label>ID:</label>
          <span class="readonly">{{ selectedHex.id }}</span>
        </div>
      </div>

      <div class="property-section">
        <h4>样式</h4>
        <div class="property-row">
          <label>颜色:</label>
          <input 
            type="color" 
            :value="selectedHex.data.color || '#e8e8e8'" 
            @change="updateColor"
          />
          <input 
            type="text" 
            class="color-input"
            :value="selectedHex.data.color || '#e8e8e8'" 
            @change="updateColor"
          />
        </div>
      </div>

      <div class="property-section">
        <h4>自定义属性</h4>
        <div 
          v-for="(value, key) in customProperties" 
          :key="key"
          class="property-row"
        >
          <label>{{ key }}:</label>
          <input 
            type="text" 
            :value="value" 
            @change="(e) => updateCustomProperty(key as string, (e.target as HTMLInputElement).value)"
          />
          <button class="delete-btn" @click="deleteCustomProperty(key as string)">×</button>
        </div>
        
        <div class="add-property">
          <input 
            v-model="newPropertyKey" 
            placeholder="属性名" 
            class="prop-key-input"
          />
          <input 
            v-model="newPropertyValue" 
            placeholder="属性值" 
            class="prop-value-input"
          />
          <button @click="addCustomProperty" :disabled="!newPropertyKey">添加</button>
        </div>
      </div>

      <div class="property-section" v-if="selectedCount > 1">
        <h4>批量编辑</h4>
        <p class="batch-info">已选中 {{ selectedCount }} 个六边形</p>
        <button class="batch-btn" @click="emit('batchUpdate', { color: '#ffcc00' })">
          批量设置颜色
        </button>
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
  width: 280px;
  background: #fff;
  border-left: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
}

.editor-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.close-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
  border-radius: 4px;
}

.close-btn:hover {
  background: #f0f0f0;
}

.editor-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
}

.property-section {
  margin-bottom: 20px;
}

.property-section h4 {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #999;
  text-transform: uppercase;
}

.property-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.property-row label {
  width: 50px;
  font-size: 13px;
  color: #666;
}

.property-row input[type="number"],
.property-row input[type="text"] {
  flex: 1;
  height: 28px;
  padding: 0 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
}

.property-row input[type="color"] {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.color-input {
  width: 80px !important;
}

.readonly {
  font-size: 12px;
  color: #999;
}

.delete-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: #ffebee;
  color: #d32f2f;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.add-property {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.prop-key-input {
  width: 80px;
}

.prop-value-input {
  flex: 1;
}

.add-property button {
  padding: 0 12px;
  height: 28px;
  border: 1px solid #ddd;
  background: #f5f5f5;
  border-radius: 4px;
  cursor: pointer;
}

.add-property button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.batch-info {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.batch-btn {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
}

.batch-btn:hover {
  background: #f5f5f5;
}
</style>