<template>
  <div class="json-node">
    <div class="node-line" @click="toggleExpanded">
      <div class="node-indent">
        <span v-for="i in level" :key="i" class="indent-space"></span>
        <div v-if="isComplex" class="expand-button" :class="{ expanded: expanded }">
          <el-icon>
            <CaretRight />
          </el-icon>
        </div>
        <div v-else class="expand-button"></div>
      </div>

      <div class="node-content">
        <span v-if="!isRoot" class="node-key" :class="{ 'array-index': isArrayIndex }">
          {{ keyName }}
        </span>
        <span v-if="!isRoot" class="colon">:</span>

        <span v-if="!isComplex" :class="valueClass">{{ displayValue }}</span>
        <span v-else class="data-summary">{{ dataSummary }}</span>

        <el-icon v-if="isComplex" class="type-icon">
          <component :is="getTypeIcon()" />
        </el-icon>
      </div>

      <div class="copy-button" @click.stop="copyData">
        <el-icon><CopyDocument /></el-icon>
      </div>
    </div>

    <transition name="collapse">
      <div v-show="expanded && isComplex" class="node-children">
        <JsonNode
          v-for="child in children"
          :key="child.key"
          :data="child.value"
          :key-name="child.key"
          :level="level + 1"
          :is-last="child.isLast"
          @copy="$emit('copy', $event)"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { CaretRight, CopyDocument, Document, List, Key } from '@element-plus/icons-vue'

interface Props {
  data: any // 当前节点的数据
  keyName: string // 当前节点的键名
  level: number // 缩进层级
  isRoot?: boolean // 是否为根节点
  isLast?: boolean // 是否为最后一个子节点
}

const props = withDefaults(defineProps<Props>(), {
  isRoot: false,
  isLast: false
})

const emit = defineEmits<{
  copy: [data: any, path: string]
}>()

// 展开/折叠状态
const expanded = ref(props.level < 2) // 默认展开前两层

// ========================= 计算属性 =========================

/** 数据类型判断 */
const dataType = computed(() => {
  if (props.data === null) return 'null'
  if (props.data === undefined) return 'undefined'
  if (Array.isArray(props.data)) return 'array'
  return typeof props.data
})

/** 是否为复杂类型 */
const isComplex = computed(() => {
  return dataType.value === 'object' || dataType.value === 'array'
})

/** 是否为数组索引 */
const isArrayIndex = computed(() => {
  return /^\d+$/.test(props.keyName)
})

/** 子节点列表 */
const children = computed(() => {
  if (!isComplex.value) return []

  if (dataType.value === 'array') {
    return props.data.map((item: any, index: number) => ({
      key: index.toString(),
      value: item,
      isLast: index === props.data.length - 1
    }))
  } else {
    const keys = Object.keys(props.data)
    return keys.map((key, index) => ({
      key,
      value: props.data[key],
      isLast: index === keys.length - 1
    }))
  }
})

/** 数据摘要 */
const dataSummary = computed(() => {
  if (dataType.value === 'array') {
    return `Array[${props.data.length}]`
  } else if (dataType.value === 'object') {
    const keys = Object.keys(props.data)
    return `Object{${keys.length}}`
  }
  return ''
})

/** 值的显示文本 */
const displayValue = computed(() => {
  switch (dataType.value) {
    case 'string':
      return `"${props.data}"`
    case 'number':
      return props.data.toString()
    case 'boolean':
      return props.data.toString()
    case 'null':
      return 'null'
    case 'undefined':
      return 'undefined'
    default:
      return ''
  }
})

/** 值的样式类 */
const valueClass = computed(() => {
  return `json-value json-${dataType.value}`
})

/** 当前节点路径 */
const nodePath = computed(() => {
  if (props.isRoot) return props.keyName
  return props.keyName
})

// ========================= 方法 =========================

/** 切换展开状态 */
const toggleExpanded = () => {
  if (isComplex.value) {
    expanded.value = !expanded.value
  }
}

/** 复制当前节点数据 */
const copyData = () => {
  emit('copy', props.data, nodePath.value)
}

/** 获取类型图标 */
const getTypeIcon = () => {
  switch (dataType.value) {
    case 'object':
      return Key
    case 'array':
      return List
    default:
      return Document
  }
}
</script>

<style lang="scss" scoped>
.json-node {
  .node-line {
    display: flex;
    align-items: center;
    min-height: 24px;
    padding: 2px 0;
    border-radius: 4px;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: rgba(0, 122, 255, 0.1);

      .copy-button {
        opacity: 1;
      }
    }

    .node-indent {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .indent-space {
      width: 20px;
      height: 1px;
    }

    .expand-button {
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: 2px;
      transition: all 0.2s ease;
      color: #8e8e93;

      &:hover {
        background-color: rgba(0, 122, 255, 0.2);
        color: #007aff;
      }

      &.expanded {
        transform: rotate(90deg);
      }
    }

    .node-content {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;

      .node-key {
        color: #af52de;
        font-weight: 500;

        &.array-index {
          color: #8e8e93;
          font-style: italic;
        }
      }

      .colon {
        color: #8e8e93;
      }

      .json-value {
        &.json-string {
          color: #007aff;
        }

        &.json-number {
          color: #ff9500;
        }

        &.json-boolean {
          color: #34c759;
          font-weight: 500;
        }

        &.json-null,
        &.json-undefined {
          color: #8e8e93;
          font-style: italic;
        }
      }

      .data-summary {
        color: #8e8e93;
        font-style: italic;
        margin-left: 8px;
      }

      .type-icon {
        color: #8e8e93;
        font-size: 12px;
      }
    }

    .copy-button {
      opacity: 0;
      transition: opacity 0.2s ease;
      color: #8e8e93;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;

      &:hover {
        background-color: rgba(0, 122, 255, 0.2);
        color: #007aff;
      }
    }
  }

  .node-children {
    margin-left: 20px;
    border-left: 1px solid #e1e5e9;
    padding-left: 8px;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      left: -1px;
      top: 0;
      bottom: 0;
      width: 1px;
      background-color: transparent;
      transition: background-color 0.2s ease;
    }

    &:hover::before {
      background-color: rgba(0, 122, 255, 0.3);
    }
  }

  // 展开/折叠动画
  .collapse-enter-active,
  .collapse-leave-active {
    transition: all 0.3s ease;
    overflow: hidden;
  }

  .collapse-enter-from,
  .collapse-leave-to {
    opacity: 0;
    max-height: 0;
  }

  .collapse-enter-to,
  .collapse-leave-from {
    opacity: 1;
    max-height: 500px;
  }
}
</style>
