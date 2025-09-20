<template>
  <div class="area-org-selector">
    <el-row :gutter="12">
      <!-- 左侧：区域树 -->
      <el-col :span="10">
        <el-card shadow="never" class="selector-card">
          <template #header>
            <div class="card-header">
              <span>选择区域</span>
              <el-input
                v-model="areaSearchText"
                placeholder="搜索区域"
                size="small"
                clearable
                class="search-input"
                @input="filterAreaTree"
              >
                <template #prefix>
                  <Icon icon="ep:search" />
                </template>
              </el-input>
            </div>
          </template>
          <el-tree
            ref="areaTreeRef"
            :data="areaTreeData"
            :props="areaTreeProps"
            :filter-node-method="filterAreaNode"
            node-key="code"
            highlight-current
            default-expand-all
            @node-click="handleAreaNodeClick"
          >
            <template #default="{ node, data }">
              <span class="tree-node">
                <Icon :icon="getAreaIcon(data.level)" class="node-icon" />
                <span>{{ node.label }}</span>
                <el-tag size="small" class="org-count-tag" v-if="data.orgCount > 0">
                  {{ data.orgCount }}
                </el-tag>
              </span>
            </template>
          </el-tree>
        </el-card>
      </el-col>

      <!-- 右侧：机构列表 -->
      <el-col :span="14">
        <el-card shadow="never" class="selector-card">
          <template #header>
            <div class="card-header">
              <span>选择机构</span>
              <div class="header-actions">
                <el-checkbox
                  v-model="includeOrgs"
                  @change="handleIncludeOrgsChange"
                >
                  包含机构
                </el-checkbox>
                <el-checkbox
                  v-model="selectAllOrgs"
                  @change="handleSelectAllOrgs"
                  :disabled="!includeOrgs"
                >
                  全选
                </el-checkbox>
              </div>
            </div>
          </template>

          <div v-if="!includeOrgs" class="empty-state">
            <Icon icon="ep:office-building" class="empty-icon" />
            <p>仅按区域统计，不包含具体机构</p>
          </div>

          <div v-else-if="!selectedArea" class="empty-state">
            <Icon icon="ep:pointer" class="empty-icon" />
            <p>请先选择左侧区域</p>
          </div>

          <div v-else-if="orgLoading" class="loading-state">
            <el-skeleton :rows="5" animated />
          </div>

          <div v-else-if="orgList.length === 0" class="empty-state">
            <Icon icon="ep:document-delete" class="empty-icon" />
            <p>该区域暂无机构</p>
          </div>

          <el-checkbox-group
            v-else
            v-model="selectedOrgIds"
            class="org-list"
          >
            <el-checkbox
              v-for="org in orgList"
              :key="org.id"
              :value="org.id"
              class="org-item"
            >
              <div class="org-info">
                <span class="org-name">{{ org.name }}</span>
                <dict-tag :type="DICT_TYPE.INSTITUTION_LEVEL" :value="org.orgType" />
                <el-tag
                  v-if="org.hasReported"
                  size="small"
                  type="success"
                  class="report-tag"
                >
                  已填报
                </el-tag>
              </div>
            </el-checkbox>
          </el-checkbox-group>
        </el-card>
      </el-col>
    </el-row>

    <!-- 已选择信息 -->
    <div class="selection-summary" v-if="selectedArea || selectedOrgIds.length > 0">
      <span class="summary-label">已选择：</span>
      <el-tag
        v-if="selectedArea"
        :closable="selectedArea.code !== defaultAreaCode"
        @close="clearAreaSelection"
      >
        {{ selectedArea.name }}
      </el-tag>
      <el-tag
        v-if="includeOrgs && selectedOrgIds.length > 0"
        type="success"
        class="ml-2"
      >
        {{ selectedOrgIds.length }} 个机构
      </el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Icon } from '@/components/Icon'
import type { TreeNode } from 'element-plus/es/components/tree/src/tree.type'
import {DICT_TYPE} from "@/utils/dict";

export interface AreaNode {
  code: string
  name: string
  level: number // 1-省 2-市 3-区
  children?: AreaNode[]
  orgCount?: number
}

export interface OrgItem {
  id: number
  name: string
  areaCode: string
  parentName?: string
  hasReported?: boolean
}

interface Props {
  modelValue?: {
    areaCode?: string
    orgIds?: number[]
  }
  // 获取区域树数据的方法
  fetchAreaTree?: () => Promise<AreaNode[]>
  // 获取机构列表的方法
  fetchOrgList?: (areaCode: string) => Promise<OrgItem[]>
  // 默认区域代码
  defaultAreaCode?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({ areaCode: '', orgIds: [] }),
  defaultAreaCode: '610000' // 陕西省代码
})

const emit = defineEmits<{
  'update:modelValue': [value: { areaCode?: string; orgIds?: number[]; areaName?: string }]
  'change': [value: { areaCode?: string; orgIds?: number[]; areaName?: string }]
}>()

// 区域树相关
const areaTreeRef = ref()
const areaTreeData = ref<AreaNode[]>([])
const areaSearchText = ref('')
const selectedArea = ref<AreaNode | null>(null)

const areaTreeProps = {
  label: 'name',
  children: 'children'
}

// 机构列表相关
const includeOrgs = ref(false)
const selectAllOrgs = ref(false)
const orgList = ref<OrgItem[]>([])
const selectedOrgIds = ref<number[]>([])
const orgLoading = ref(false)

// 获取区域图标
const getAreaIcon = (level: number) => {
  const icons = {
    1: 'ep:location',     // 省
    2: 'ep:map-location', // 市
    3: 'ep:place'         // 区
  }
  return icons[level] || 'ep:location'
}

// 过滤区域树
const filterAreaNode = (value: string, data: AreaNode) => {
  if (!value) return true
  return data.name.includes(value)
}

const filterAreaTree = (value: string) => {
  areaTreeRef.value?.filter(value)
}

// 处理区域节点点击
const handleAreaNodeClick = async (data: AreaNode) => {
  selectedArea.value = data

  // 切换区域时，重置机构相关状态
  selectedOrgIds.value = []
  selectAllOrgs.value = false

  if (includeOrgs.value) {
    await loadOrgList(data.code)
  } else {
    orgList.value = []
  }

  emitChange()
}

// 加载机构列表
const loadOrgList = async (areaCode: string, keepSelection: boolean = false) => {
  if (!props.fetchOrgList) {
    console.warn('fetchOrgList method not provided')
    return
  }

  orgLoading.value = true
  try {
    const newOrgList = await props.fetchOrgList(areaCode)
    orgList.value = newOrgList

    // 如果不保留选择，清空之前的选择
    if (!keepSelection) {
      selectedOrgIds.value = []
      selectAllOrgs.value = false
    } else {
      // 保留选择时，过滤掉不存在的机构
      const validIds = newOrgList.map(org => org.id)
      selectedOrgIds.value = selectedOrgIds.value.filter(id => validIds.includes(id))
    }
  } finally {
    orgLoading.value = false
  }
}

// 处理包含机构开关变化
const handleIncludeOrgsChange = async (value: boolean) => {
  isInternalChange = true

  if (value && selectedArea.value) {
    await loadOrgList(selectedArea.value.code)
  } else {
    selectedOrgIds.value = []
    orgList.value = []
  }

  await nextTick()
  isInternalChange = false
  emitChange()
}

// 处理全选机构
const handleSelectAllOrgs = (value: boolean) => {
  isInternalChange = true

  if (value) {
    selectedOrgIds.value = orgList.value.map(org => org.id)
  } else {
    selectedOrgIds.value = []
  }

  nextTick(() => {
    isInternalChange = false
    emitChange()
  })
}

// 清除区域选择
const clearAreaSelection = () => {
  // 如果是默认区域（陕西省），不允许清除
  if (selectedArea.value?.code === props.defaultAreaCode) {
    return
  }

  // 如果清空的不是默认区域，则恢复到默认区域
  const defaultNode = findAreaNode(areaTreeData.value, props.defaultAreaCode)
  if (defaultNode) {
    selectedArea.value = defaultNode
    nextTick(() => {
      areaTreeRef.value?.setCurrentKey(props.defaultAreaCode)
    })
  } else {
    selectedArea.value = null
  }

  selectedOrgIds.value = []
  orgList.value = []
  includeOrgs.value = false
  emitChange()
}

// 防抖标记，避免循环触发
let isInternalChange = false

// 触发变更事件
const emitChange = () => {
  if (isInternalChange) return

  const value = {
    areaCode: selectedArea.value?.code,
    orgIds: includeOrgs.value ? selectedOrgIds.value : [],
    areaName: selectedArea.value?.name // 添加区域名称
  }

  isInternalChange = true
  emit('update:modelValue', value)
  emit('change', value)

  nextTick(() => {
    isInternalChange = false
  })
}

// 监听选中的机构变化 - 使用 getter 函数避免 ESLint 错误
watch(() => selectedOrgIds.value.length, (newLength) => {
  // 更新全选状态
  if (orgList.value.length > 0) {
    selectAllOrgs.value = newLength === orgList.value.length
  }

  // 只在不是内部变化时触发
  if (!isInternalChange) {
    emitChange()
  }
})

// 监听 modelValue 变化以更新内部状态
watch(() => props.modelValue, async (newVal) => {
  if (!newVal || isInternalChange) return

  // 防止初始化时的重复处理
  if (!areaTreeData.value.length) return

  isInternalChange = true

  try {
    // 如果外部传入的值与当前值不同，更新内部状态
    if (newVal.areaCode && newVal.areaCode !== selectedArea.value?.code) {
      const node = findAreaNode(areaTreeData.value, newVal.areaCode)
      if (node) {
        selectedArea.value = node
        await nextTick()
        areaTreeRef.value?.setCurrentKey(newVal.areaCode)
      }
    }

    // 更新机构选择状态 - 只在值真正改变时更新
    const hasOrgIds = newVal.orgIds && newVal.orgIds.length > 0
    const currentOrgIds = JSON.stringify(selectedOrgIds.value)
    const newOrgIds = JSON.stringify(newVal.orgIds || [])

    if (hasOrgIds) {
      if (!includeOrgs.value) {
        includeOrgs.value = true
        // 如果需要加载机构列表
        if (selectedArea.value && orgList.value.length === 0) {
          await loadOrgList(selectedArea.value.code, true)
        }
      }
      // 等待机构列表加载完成后再设置选中状态
      await nextTick()
      if (currentOrgIds !== newOrgIds) {
        selectedOrgIds.value = [...(newVal.orgIds || [])]
      }
    } else {
      // 只在明确没有机构ID时重置，而不是因为其他原因
      if (includeOrgs.value && newVal.orgIds !== undefined) {
        includeOrgs.value = false
        selectedOrgIds.value = []
      }
    }
  } finally {
    await nextTick()
    isInternalChange = false
  }
}, { deep: true })

// 根据区域代码查找节点
const findAreaNode = (nodes: AreaNode[], code: string): AreaNode | null => {
  for (const node of nodes) {
    if (node.code === code) {
      return node
    }
    if (node.children) {
      const found = findAreaNode(node.children, code)
      if (found) return found
    }
  }
  return null
}

// 初始化加载区域树
const init = async () => {
  if (props.fetchAreaTree) {
    try {
      areaTreeData.value = await props.fetchAreaTree()

      isInternalChange = true // 防止初始化时触发循环

      // 初始化回显数据
      if (props.modelValue?.areaCode) {
        const node = findAreaNode(areaTreeData.value, props.modelValue.areaCode)
        if (node) {
          selectedArea.value = node
          // 高亮选中的节点
          await nextTick()
          areaTreeRef.value?.setCurrentKey(props.modelValue.areaCode)

          // 如果有选中的机构，加载机构列表
          if (props.modelValue.orgIds && props.modelValue.orgIds.length > 0) {
            includeOrgs.value = true
            await loadOrgList(props.modelValue.areaCode, true)
            selectedOrgIds.value = [...props.modelValue.orgIds]
            // 检查是否全选
            selectAllOrgs.value = orgList.value.length > 0 &&
              selectedOrgIds.value.length === orgList.value.length
          }
        }
      } else if (props.defaultAreaCode) {
        // 设置默认区域
        const defaultNode = findAreaNode(areaTreeData.value, props.defaultAreaCode)
        if (defaultNode) {
          selectedArea.value = defaultNode
          await nextTick()
          areaTreeRef.value?.setCurrentKey(props.defaultAreaCode)
        }
      }

      await nextTick()
      isInternalChange = false

      // 初始化完成后触发一次change
      emitChange()
    } catch (error) {
      console.error('Failed to load area tree:', error)
    }
  }
}

// 暴露方法
defineExpose({
  init,
  clearAreaSelection
})

onMounted(() => {
  init()
})

// 导入 nextTick
import { ref, computed, watch, onMounted, nextTick } from 'vue'
</script>

<style scoped lang="scss">
.area-org-selector {
  .selector-card {
    height: 400px;
    display: flex;
    flex-direction: column;

    :deep(.el-card__header) {
      padding: 12px 16px;
      border-bottom: 1px solid var(--el-border-color-lighter);
    }

    :deep(.el-card__body) {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .search-input {
      width: 180px;
    }

    .header-actions {
      display: flex;
      gap: 16px;
    }
  }

  .tree-node {
    display: flex;
    align-items: center;
    flex: 1;

    .node-icon {
      margin-right: 6px;
      color: var(--el-color-primary);
    }

    .org-count-tag {
      margin-left: auto;
      margin-right: 8px;
    }
  }

  .org-list {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .org-item {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 4px;
      transition: all 0.3s;

      &:hover {
        background-color: var(--el-fill-color-light);
        border-color: var(--el-color-primary-light-7);
      }

      :deep(.el-checkbox__label) {
        width: 100%;
      }
    }

    .org-info {
      display: flex;
      align-items: center;
      gap: 8px;

      .org-name {
        font-weight: 500;
      }

      .report-tag {
        margin-left: auto;
      }
    }
  }

  .empty-state,
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 300px;
    color: var(--el-text-color-secondary);

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
      color: var(--el-border-color-darker);
    }

    p {
      margin: 0;
      font-size: 14px;
    }
  }

  .selection-summary {
    margin-top: 16px;
    padding: 12px;
    background-color: var(--el-fill-color-lighter);
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 8px;

    .summary-label {
      font-weight: 500;
      color: var(--el-text-color-regular);
    }
  }
}
</style>
