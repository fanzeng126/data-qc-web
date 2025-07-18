<template>
  <div class="tree-node" :class="[node.type, { expanded: isExpanded }]">
    <!-- 节点内容 -->
    <div class="node-content" @click="handleNodeClick">
      <!-- 展开/折叠按钮 -->
      <div v-if="hasChildren" class="expand-toggle" @click.stop="toggleExpand">
        <Icon :icon="isExpanded ? 'ep:arrow-down' : 'ep:arrow-right'" />
      </div>
      <div v-else class="expand-placeholder"></div>

      <!-- 节点图标 -->
      <Icon :icon="getNodeIcon()" class="node-icon" />

      <!-- 节点标签 -->
      <span class="node-label">{{ node.label || node.value }}</span>

      <!-- 节点标记 -->
      <div class="node-badges">
        <!-- 类型标记 -->
        <el-tag v-if="showTypeBadge" :type="getTypeColor()" size="small" class="type-badge">
          {{ getTypeName() }}
        </el-tag>

        <!-- 数据类型 -->
        <span v-if="node.dataType" class="data-type">
          {{ node.dataType }}
        </span>

        <!-- 必填标记 -->
        <el-tag v-if="node.isRequired" type="danger" size="small" class="required-badge">
          必填
        </el-tag>

        <!-- 参数数量 -->
        <span v-if="node.parameters?.length" class="param-count">
          {{ node.parameters.length }}个参数
        </span>

        <!-- 子组件数量 -->
        <span v-if="node.components?.length" class="component-count">
          {{ node.components.length }}个组件
        </span>
      </div>

      <!-- 操作按钮 -->
      <div class="node-actions" v-if="showActions">
        <el-button size="small" text @click.stop="$emit('node-edit', node)" v-if="canEdit">
          <Icon icon="ep:edit" />
        </el-button>
        <el-button size="small" text @click.stop="$emit('node-delete', node)" v-if="canDelete">
          <Icon icon="ep:delete" />
        </el-button>
      </div>
    </div>

    <!-- 子节点 -->
    <div v-if="isExpanded && hasChildren" class="child-nodes">
      <div class="connection-line" v-if="viewMode === 'vertical'"></div>

      <!-- 参数子节点 -->
      <div v-if="node.parameters?.length" class="parameter-nodes">
        <div class="child-label">参数：</div>
        <TreeNode
          v-for="(param, index) in node.parameters"
          :key="`param-${index}`"
          :node="param"
          :level="level + 1"
          :index="index"
          :view-mode="viewMode"
          :show-actions="showActions"
          @node-click="$emit('node-click', $event)"
          @node-expand="$emit('node-expand', $event)"
          @node-edit="$emit('node-edit', $event)"
          @node-delete="$emit('node-delete', $event)"
        />
      </div>

      <!-- 组件子节点 -->
      <div v-if="node.components?.length" class="component-nodes">
        <div class="child-label">子组件：</div>
        <TreeNode
          v-for="(component, index) in node.components"
          :key="`comp-${index}`"
          :node="component"
          :level="level + 1"
          :index="index"
          :view-mode="viewMode"
          :show-actions="showActions"
          @node-click="$emit('node-click', $event)"
          @node-expand="$emit('node-expand', $event)"
          @node-edit="$emit('node-edit', $event)"
          @node-delete="$emit('node-delete', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface TreeNodeData {
  type: 'field' | 'function' | 'operator' | 'constant' | 'group'
  value: any
  label?: string
  dataType?: string
  parameters?: TreeNodeData[]
  components?: TreeNodeData[]
  isRequired?: boolean
  expanded?: boolean
}

interface Props {
  node: TreeNodeData
  level: number
  index: number
  viewMode?: 'horizontal' | 'vertical' | 'radial'
  showActions?: boolean
  showTypeBadge?: boolean
}

interface Emits {
  (e: 'node-click', node: TreeNodeData): void
  (e: 'node-expand', node: TreeNodeData, expanded: boolean): void
  (e: 'node-edit', node: TreeNodeData): void
  (e: 'node-delete', node: TreeNodeData): void
}

const props = withDefaults(defineProps<Props>(), {
  viewMode: 'horizontal',
  showActions: false,
  showTypeBadge: true
})

const emit = defineEmits<Emits>()

// 展开状态
const isExpanded = ref(props.node.expanded ?? false)

// 计算属性
const hasChildren = computed(() => {
  return (props.node.parameters?.length || 0) + (props.node.components?.length || 0) > 0
})

const canEdit = computed(() => {
  return ['function', 'constant', 'group'].includes(props.node.type)
})

const canDelete = computed(() => {
  return props.level > 0 // 根节点不能删除
})

// 方法
const getNodeIcon = () => {
  const icons: Record<string, string> = {
    field: 'ep:key',
    function: 'ep:cpu',
    operator: 'ep:sort',
    constant: 'ep:price-tag',
    group: 'ep:collection',
    table: 'ep:grid',
    category: 'ep:folder'
  }
  return icons[props.node.type] || 'ep:document'
}

const getTypeColor = () => {
  const colors: Record<string, string> = {
    field: 'primary',
    function: 'warning',
    operator: 'success',
    constant: 'info',
    group: 'danger'
  }
  return colors[props.node.type] || ''
}

const getTypeName = () => {
  const names: Record<string, string> = {
    field: '字段',
    function: '函数',
    operator: '操作符',
    constant: '常量',
    group: '分组'
  }
  return names[props.node.type] || props.node.type
}

const handleNodeClick = () => {
  emit('node-click', props.node)
}

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
  emit('node-expand', props.node, isExpanded.value)
}
</script>

<style lang="scss" scoped>
.tree-node {
  position: relative;
  user-select: none;

  .node-content {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border: 1px solid transparent;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s;
    background: white;

    &:hover {
      border-color: #c0c4cc;
      background: #f5f7fa;
    }

    .expand-toggle {
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #606266;

      &:hover {
        color: #409eff;
        background: rgba(64, 158, 255, 0.1);
        border-radius: 2px;
      }
    }

    .expand-placeholder {
      width: 16px;
      height: 16px;
    }

    .node-icon {
      flex-shrink: 0;
      font-size: 16px;
    }

    .node-label {
      flex: 1;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .node-badges {
      display: flex;
      align-items: center;
      gap: 4px;

      .type-badge,
      .required-badge {
        flex-shrink: 0;
      }

      .data-type,
      .param-count,
      .component-count {
        font-size: 11px;
        color: #909399;
        background: #f0f0f0;
        padding: 1px 4px;
        border-radius: 2px;
        white-space: nowrap;
      }
    }

    .node-actions {
      display: flex;
      gap: 2px;
      opacity: 0;
      transition: opacity 0.3s;
    }

    &:hover .node-actions {
      opacity: 1;
    }
  }

  .child-nodes {
    margin-left: 20px;
    position: relative;

    .connection-line {
      position: absolute;
      left: -10px;
      top: 0;
      bottom: 0;
      width: 1px;
      background: #e4e7ed;
    }

    .parameter-nodes,
    .component-nodes {
      margin-top: 8px;

      .child-label {
        font-size: 12px;
        color: #909399;
        margin-bottom: 4px;
        padding-left: 8px;
      }
    }
  }

  // 不同类型的样式
  &.field {
    .node-content {
      border-left: 3px solid #409eff;

      .node-icon {
        color: #409eff;
      }
    }

    &:hover .node-content {
      border-color: #409eff;
      background: rgba(64, 158, 255, 0.05);
    }
  }

  &.function {
    .node-content {
      border-left: 3px solid #e6a23c;

      .node-icon {
        color: #e6a23c;
      }
    }

    &:hover .node-content {
      border-color: #e6a23c;
      background: rgba(230, 162, 60, 0.05);
    }
  }

  &.operator {
    .node-content {
      border-left: 3px solid #67c23a;

      .node-icon {
        color: #67c23a;
      }
    }

    &:hover .node-content {
      border-color: #67c23a;
      background: rgba(103, 194, 58, 0.05);
    }
  }

  &.constant {
    .node-content {
      border-left: 3px solid #909399;

      .node-icon {
        color: #909399;
      }
    }

    &:hover .node-content {
      border-color: #909399;
      background: rgba(144, 147, 153, 0.05);
    }
  }

  &.group {
    .node-content {
      border-left: 3px solid #f56c6c;

      .node-icon {
        color: #f56c6c;
      }
    }

    &:hover .node-content {
      border-color: #f56c6c;
      background: rgba(245, 108, 108, 0.05);
    }
  }

  // 展开状态
  &.expanded {
    .node-content .expand-toggle {
      transform: rotate(90deg);
    }
  }
}

// 不同视图模式的样式调整
.tree-node[data-view-mode='vertical'] {
  .child-nodes {
    margin-left: 0;
    margin-top: 20px;
    display: flex;
    gap: 20px;

    .connection-line {
      display: none;
    }
  }
}

.tree-node[data-view-mode='radial'] {
  .child-nodes {
    margin-left: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;

    .connection-line {
      display: none;
    }
  }
}

// 响应式调整
@media (max-width: 768px) {
  .tree-node {
    .node-content {
      padding: 6px 8px;

      .node-badges {
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;
      }

      .node-actions {
        flex-direction: column;
      }
    }

    .child-nodes {
      margin-left: 12px;
    }
  }
}
</style>
