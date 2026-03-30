# Hex Editor - 六边形编辑器

一个基于 Vue3 + TypeScript + Vite + Tauri 的高性能六边形编辑器，支持渲染 20 万+ 六边形。

## 功能特性

- 🔷 **海量渲染**：支持最多 20 万个六边形同时渲染
- 🖱️ **自由拖拽**：画布拖拽、单个/批量六边形拖拽
- 📐 **区域选择**：支持框选、反选、Ctrl 多选
- 🎨 **属性编辑**：支持编辑任意自定义数据
- 📥 **保存加载**：支持 JSON 格式保存/加载
- 📷 **图片导出**：支持导出 PNG 格式图片
- 🔄 **平移缩放**：支持画布平移和缩放操作

## 技术栈

- **前端框架**：Vue 3 + TypeScript
- **构建工具**：Vite
- **桌面打包**：Tauri 2.x
- **状态管理**：Pinia
- **渲染方式**：Canvas 2D

## 核心模块

### HexMath (六边形数学引擎)
- axial coordinates (q, r) 坐标系统
- flat-top / pointy-top 两种朝向
- 坐标转换、邻居查询、距离计算

### SpatialIndex (空间索引)
- Grid Hash Map 结构
- O(1) 单点查询
- O(n) 矩形范围查询

### Renderer (渲染器)
- 视口裁剪优化
- 同色批量绘制
- 60fps 流畅渲染

### InteractionManager (交互管理)
- 鼠标事件处理
- 选择框操作
- 拖拽吸附逻辑

## 项目结构

```
hex-editor/
├── src/
│   ├── core/           # 核心模块
│   │   ├── HexMath.ts       # 六边形数学
│   │   ├── SpatialIndex.ts  # 空间索引
│   │   ├── Renderer.ts      # 渲染器
│   │   ├── Interaction.ts   # 交互管理
│   │   └── types.ts         # 类型定义
│   ├── components/     # Vue 组件
│   │   ├── HexCanvas.vue      # 主画布
│   │   ├── Toolbar.vue        # 工具栏
│   │   └── PropertyEditor.vue # 属性编辑器
│   └── stores/         # 状态管理
│       └── editorStore.ts
├── src-tauri/         # Tauri 后端
└── dist/              # 构建输出
```

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build

# 打包桌面应用 (需要 Tauri 环境)
npx tauri build
```

## 使用说明

1. **初始化**：启动后自动生成 20 万个六边形
2. **拖拽画布**：右键拖拽或按住空格拖拽
3. **选择六边形**：左键单击选中，Ctrl+单击多选
4. **框选**：左键拖拽空白区域
5. **缩放**：鼠标滚轮缩放
6. **编辑属性**：选中六边形后在右侧面板编辑

## 性能优化

- 空间索引：Grid Hash Map 实现 O(1) 查询
- 视口裁剪：只渲染可见区域内的六边形
- 批量绘制：同色六边形合并路径减少 draw call
- RAF 循环：requestAnimationFrame 保证流畅帧率

## License

MIT