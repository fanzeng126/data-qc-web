<template>
  <div class="expression-tree">
    <div v-if="!components || components.length === 0" class="empty-tree">
      <Icon icon="ep:tree" class="empty-icon" />
      <p>暂无表达式结构</p>
    </div>

    <div v-else class="tree-container">
      <!-- 树形视图模式切换 -->
      <div class="tree-controls">
        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button label="horizontal">水平布局</el-radio-button>
          <el-radio-button label="vertical">垂直布局</el-radio-button>
          <el-radio-button label="radial">放射布局</el-radio-button>
        </el-radio-group>

        <div class="control-actions">
          <el-button size="small" text @click="expandAll">
            <Icon icon="ep:expand" class="mr-5px" />
            展开全部
          </el-button>
          <el-button size="small" text @click="collapseAll">
            <Icon icon="ep:fold" class="mr-5px" />
            收起全部
          </el-button>
          <el-button size="small" text @click="resetView">
            <Icon icon="ep:refresh" class="mr-5px" />
            重置视图
          </el-button>
        </div>
      </div>

      <!-- 树形结构渲染区 -->
      <div class="tree-render-area" ref="treeContainer">
        <!-- 水平布局 -->
        <div v-if="viewMode === 'horizontal'" class="horizontal-tree">
          <div class="tree-nodes">
            <TreeNode
              v-for="(component, index) in components"
              :key="index"
              :node="component"
              :level="0"
              :index="index"
              :view-mode="viewMode"
              @node-click="handleNodeClick"
              @node-expand="handleNodeExpand"
            />
          </div>
        </div>

        <!-- 垂直布局 -->
        <div v-else-if="viewMode === 'vertical'" class="vertical-tree">
          <div class="tree-layers">
            <div
              v-for="(layer, layerIndex) in treeLayers"
              :key="layerIndex"
              class="tree-layer"
              :style="{ top: `${layerIndex * 80}px` }"
            >
              <TreeNode
                v-for="(node, nodeIndex) in layer"
                :key="`${layerIndex}-${nodeIndex}`"
                :node="node"
                :level="layerIndex"
                :index="nodeIndex"
                :view-mode="viewMode"
                @node-click="handleNodeClick"
                @node-expand="handleNodeExpand"
              />
            </div>
          </div>

          <!-- 连接线 -->
          <svg class="connection-lines" :style="svgStyle">
            <g v-for="connection in connections" :key="connection.id">
              <path
                :d="connection.path"
                stroke="#409eff"
                stroke-width="2"
                fill="none"
                :stroke-dasharray="connection.dashed ? '5,5' : ''"
              />
            </g>
          </svg>
        </div>

        <!-- 放射布局 -->
        <div v-else-if="viewMode === 'radial'" class="radial-tree">
          <div class="radial-center">
            <div class="center-node">
              <Icon icon="ep:data-analysis" class="center-icon" />
              <span>Expression</span>
            </div>
          </div>

          <div class="radial-nodes">
            <div
              v-for="(component, index) in components"
              :key="index"
              class="radial-node"
              :style="getRadialNodeStyle(index, components.length)"
            >
              <TreeNode
                :node="component"
                :level="1"
                :index="index"
                :view-mode="viewMode"
                @node-click="handleNodeClick"
                @node-expand="handleNodeExpand"
              />
            </div>
          </div>

          <!-- 放射连接线 -->
          <svg class="radial-lines" :style="radialSvgStyle">
            <g v-for="(component, index) in components" :key="index">
              <line
                :x1="centerX"
                :y1="centerY"
                :x2="getRadialPosition(index, components.length).x"
                :y2="getRadialPosition(index, components.length).y"
                stroke="#409eff"
                stroke-width="2"
                opacity="0.6"
              />
            </g>
          </svg>
        </div>
      </div>

      <!-- 节点详情面板 -->
      <div v-if="selectedNode" class="node-detail-panel">
        <div class="panel-header">
          <Icon :icon="getNodeIcon(selectedNode.type)" class="panel-icon" />
          <span class="panel-title">{{ getNodeTitle(selectedNode) }}</span>
          <el-button size="small" text @click="closeNodeDetail">
            <Icon icon="ep:close" />
          </el-button>
        </div>

        <div class="panel-content">
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="类型">
              <el-tag :type="getNodeTypeColor(selectedNode.type)" size="small">
                {{ getNodeTypeName(selectedNode.type) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="值">
              <code class="node-value">{{ selectedNode.value }}</code>
            </el-descriptions-item>
            <el-descriptions-item v-if="selectedNode.label" label="标签">
              {{ selectedNode.label }}
            </el-descriptions-item>
            <el-descriptions-item v-if="selectedNode.dataType" label="数据类型">
              {{ selectedNode.dataType }}
            </el-descriptions-item>
            <el-descriptions-item v-if="selectedNode.parameters?.length" label="参数数量">
              {{ selectedNode.parameters.length }}
            </el-descriptions-item>
            <el-descriptions-item v-if="selectedNode.components?.length" label="子组件">
              {{ selectedNode.components.length }}
            </el-descriptions-item>
          </el-descriptions>

          <!-- 参数详情 -->
          <div v-if="selectedNode.parameters?.length" class="node-parameters">
            <div class="params-header">参数列表</div>
            <div class="params-list">
              <div
                v-for="(param, index) in selectedNode.parameters"
                :key="index"
                class="param-item"
              >
                <span class="param-index">{{ index + 1 }}.</span>
                <span class="param-type">{{ param.type }}</span>
                <span class="param-value">{{ param.value }}</span>
              </div>
            </div>
          </div>

          <!-- 使用统计 -->
          <div class="node-stats">
            <div class="stats-header">统计信息</div>
            <div class="stats-content">
              <div class="stat-item">
                <span class="stat-label">深度层级：</span>
                <span class="stat-value">{{ getNodeDepth(selectedNode) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">复杂度：</span>
                <span class="stat-value">{{ getNodeComplexity(selectedNode) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import TreeNode from './TreeNode.vue'

interface ExpressionComponent {
  type: 'field' | 'function' | 'operator' | 'constant' | 'group'
  value: any
  label?: string
  dataType?: string
  parameters?: any[]
  components?: ExpressionComponent[]
  operator?: string
  config?: any
  expanded?: boolean
}

interface Props {
  components: ExpressionComponent[]
}

const props = defineProps<Props>()

// 组件引用
const treeContainer = ref()

// 视图状态
const viewMode = ref('horizontal')
const selectedNode = ref<ExpressionComponent | null>(null)

// 树形结构状态
const nodeStates = ref(new Map())

// 计算属性
const treeLayers = computed(() => {
  if (viewMode.value !== 'vertical') return []

  const layers: ExpressionComponent[][] = []

  const buildLayers = (components: ExpressionComponent[], level: number = 0) => {
    if (!layers[level]) {
      layers[level] = []
    }

    components.forEach((component) => {
      layers[level].push(component)

      if (component.parameters?.length) {
        buildLayers(component.parameters, level + 1)
      }

      if (component.components?.length) {
        buildLayers(component.components, level + 1)
      }
    })
  }

  buildLayers(props.components)
  return layers
})

const connections = computed(() => {
  if (viewMode.value !== 'vertical') return []

  const conns: any[] = []
  let connectionId = 0

  const buildConnections = (
    components: ExpressionComponent[],
    level: number = 0,
    parentIndex: number = 0
  ) => {
    components.forEach((component, index) => {
      if (level > 0) {
        // 创建从父节点到子节点的连接
        const startX = parentIndex * 150 + 75
        const startY = (level - 1) * 80 + 40
        const endX = index * 150 + 75
        const endY = level * 80 + 20

        conns.push({
          id: connectionId++,
          path: `M ${startX} ${startY} Q ${startX} ${startY + 20} ${endX} ${endY}`,
          dashed: component.type === 'operator'
        })
      }

      if (component.parameters?.length) {
        buildConnections(component.parameters, level + 1, index)
      }

      if (component.components?.length) {
        buildConnections(component.components, level + 1, index)
      }
    })
  }

  buildConnections(props.components)
  return conns
})

const svgStyle = computed(() => {
  const maxLayer = treeLayers.value.length
  const maxWidth = Math.max(...treeLayers.value.map((layer) => layer.length)) * 150

  return {
    width: `${maxWidth}px`,
    height: `${maxLayer * 80}px`,
    position: 'absolute',
    top: '0',
    left: '0',
    'pointer-events': 'none',
    'z-index': 1
  }
})

const radialSvgStyle = computed(() => {
  return {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: '0',
    left: '0',
    'pointer-events': 'none'
  }
})

const centerX = ref(200)
const centerY = ref(200)

// 监听视图模式变化
watch(viewMode, () => {
  nextTick(() => {
    if (viewMode.value === 'radial') {
      updateRadialCenter()
    }
  })
})

// 生命周期
onMounted(() => {
  updateRadialCenter()
})

// 方法
const getRadialNodeStyle = (index: number, total: number) => {
  const position = getRadialPosition(index, total)
  return {
    position: 'absolute',
    left: `${position.x - 40}px`,
    top: `${position.y - 20}px`,
    'z-index': 2
  }
}

const getRadialPosition = (index: number, total: number) => {
  const angle = (index / total) * 2 * Math.PI
  const radius = 120
  const x = centerX.value + radius * Math.cos(angle)
  const y = centerY.value + radius * Math.sin(angle)
  return { x, y }
}

const updateRadialCenter = () => {
  if (treeContainer.value) {
    const rect = treeContainer.value.getBoundingClientRect()
    centerX.value = rect.width / 2
    centerY.value = rect.height / 2
  }
}

const getNodeIcon = (type: string) => {
  const icons: Record<string, string> = {
    field: 'ep:key',
    function: 'ep:cpu',
    operator: 'ep:sort',
    constant: 'ep:price-tag',
    group: 'ep:collection'
  }
  return icons[type] || 'ep:document'
}

const getNodeTitle = (node: ExpressionComponent) => {
  return node.label || node.value || '未命名节点'
}

const getNodeTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    field: 'primary',
    function: 'warning',
    operator: 'success',
    constant: 'info',
    group: 'danger'
  }
  return colors[type] || ''
}

const getNodeTypeName = (type: string) => {
  const names: Record<string, string> = {
    field: '字段',
    function: '函数',
    operator: '操作符',
    constant: '常量',
    group: '分组'
  }
  return names[type] || type
}

const getNodeDepth = (node: ExpressionComponent) => {
  let maxDepth = 0

  const calculateDepth = (component: ExpressionComponent, currentDepth: number = 0): number => {
    let depth = currentDepth

    if (component.parameters?.length) {
      component.parameters.forEach((param) => {
        depth = Math.max(depth, calculateDepth(param, currentDepth + 1))
      })
    }

    if (component.components?.length) {
      component.components.forEach((comp) => {
        depth = Math.max(depth, calculateDepth(comp, currentDepth + 1))
      })
    }

    return depth
  }

  return calculateDepth(node)
}

const getNodeComplexity = (node: ExpressionComponent) => {
  let complexity = 1

  const calculateComplexity = (component: ExpressionComponent): number => {
    let comp = 1

    if (component.parameters?.length) {
      comp += component.parameters.reduce((sum, param) => sum + calculateComplexity(param), 0)
    }

    if (component.components?.length) {
      comp += component.components.reduce((sum, comp) => sum + calculateComplexity(comp), 0)
    }

    return comp
  }

  return calculateComplexity(node)
}

// 事件处理
const handleNodeClick = (node: ExpressionComponent) => {
  selectedNode.value = node
}

const handleNodeExpand = (node: ExpressionComponent, expanded: boolean) => {
  // 更新节点展开状态
  const nodeId = getNodeId(node)
  nodeStates.value.set(nodeId, { ...nodeStates.value.get(nodeId), expanded })
}

const closeNodeDetail = () => {
  selectedNode.value = null
}

const expandAll = () => {
  const expandNodes = (components: ExpressionComponent[]) => {
    components.forEach((component) => {
      const nodeId = getNodeId(component)
      nodeStates.value.set(nodeId, { ...nodeStates.value.get(nodeId), expanded: true })

      if (component.parameters?.length) {
        expandNodes(component.parameters)
      }

      if (component.components?.length) {
        expandNodes(component.components)
      }
    })
  }

  expandNodes(props.components)
}

const collapseAll = () => {
  const collapseNodes = (components: ExpressionComponent[]) => {
    components.forEach((component) => {
      const nodeId = getNodeId(component)
      nodeStates.value.set(nodeId, { ...nodeStates.value.get(nodeId), expanded: false })

      if (component.parameters?.length) {
        collapseNodes(component.parameters)
      }

      if (component.components?.length) {
        collapseNodes(component.components)
      }
    })
  }

  collapseNodes(props.components)
}

const resetView = () => {
  selectedNode.value = null
  nodeStates.value.clear()

  if (viewMode.value === 'radial') {
    updateRadialCenter()
  }
}

const getNodeId = (node: ExpressionComponent) => {
  return `${node.type}-${node.value}-${JSON.stringify(node.parameters || [])}`
}
</script>

<style lang="scss" scoped>
.expression-tree {
  width: 100%;
  height: 100%;
  min-height: 400px;
  position: relative;

  .empty-tree {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 300px;
    color: #909399;

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
  }

  .tree-container {
    height: 100%;
    display: flex;
    flex-direction: column;

    .tree-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #f8f9fa;
      border-bottom: 1px solid #e4e7ed;
      margin-bottom: 16px;

      .control-actions {
        display: flex;
        gap: 8px;
      }
    }

    .tree-render-area {
      flex: 1;
      position: relative;
      overflow: auto;
      border: 1px solid #e4e7ed;
      border-radius: 6px;
      background: #fafafa;

      .horizontal-tree {
        padding: 20px;

        .tree-nodes {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
      }

      .vertical-tree {
        position: relative;
        padding: 20px;
        min-height: 100%;

        .tree-layers {
          position: relative;
          z-index: 2;

          .tree-layer {
            position: absolute;
            left: 0;
            right: 0;
            display: flex;
            gap: 20px;
            align-items: center;
          }
        }

        .connection-lines {
          position: absolute;
          top: 0;
          left: 0;
          z-index: 1;
        }
      }

      .radial-tree {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 400px;

        .radial-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 3;

          .center-node {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 80px;
            height: 80px;
            background: #409eff;
            color: white;
            border-radius: 50%;
            font-size: 12px;
            font-weight: 500;

            .center-icon {
              font-size: 24px;
              margin-bottom: 4px;
            }
          }
        }

        .radial-nodes {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .radial-lines {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
        }
      }
    }

    .node-detail-panel {
      position: absolute;
      right: 16px;
      top: 80px;
      width: 300px;
      background: white;
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      z-index: 10;

      .panel-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background: #f8f9fa;
        border-bottom: 1px solid #e4e7ed;
        border-radius: 8px 8px 0 0;

        .panel-icon {
          color: #409eff;
        }

        .panel-title {
          flex: 1;
          font-weight: 500;
        }
      }

      .panel-content {
        padding: 16px;
        max-height: 400px;
        overflow-y: auto;

        .node-value {
          background: #f5f5f5;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Fira Code', Consolas, monospace;
        }

        .node-parameters {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e4e7ed;

          .params-header {
            font-weight: 500;
            margin-bottom: 8px;
            color: #606266;
          }

          .params-list {
            .param-item {
              display: flex;
              align-items: center;
              gap: 6px;
              margin-bottom: 6px;
              font-size: 12px;

              .param-index {
                color: #909399;
                width: 20px;
              }

              .param-type {
                background: #e7f3ff;
                color: #409eff;
                padding: 2px 6px;
                border-radius: 3px;
                font-weight: 500;
              }

              .param-value {
                flex: 1;
                font-family: 'Fira Code', Consolas, monospace;
                color: #303133;
              }
            }
          }
        }

        .node-stats {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e4e7ed;

          .stats-header {
            font-weight: 500;
            margin-bottom: 8px;
            color: #606266;
          }

          .stats-content {
            .stat-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 6px;
              font-size: 13px;

              .stat-label {
                color: #606266;
              }

              .stat-value {
                color: #303133;
                font-weight: 500;
              }
            }
          }
        }
      }
    }
  }
}

// 响应式调整
@media (max-width: 768px) {
  .expression-tree {
    .tree-container {
      .tree-controls {
        flex-direction: column;
        gap: 8px;
        align-items: stretch;
      }

      .node-detail-panel {
        position: fixed;
        right: 8px;
        top: 60px;
        width: calc(100vw - 32px);
        max-width: 300px;
      }
    }
  }
}
</style>
