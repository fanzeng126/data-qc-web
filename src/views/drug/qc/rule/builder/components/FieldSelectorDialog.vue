<template>
  <el-dialog
    v-model="dialogVisible"
    title="选择字段"
    width="70%"
    :before-close="handleClose"
    destroy-on-close
    class="field-selector-dialog"
  >
    <div class="selector-container">
      <!-- 搜索和过滤区 -->
      <div class="search-section">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索表或字段名称"
              clearable
              prefix-icon="ep:search"
              @input="handleSearch"
            />
          </el-col>
          <el-col :span="6">
            <el-select
              v-model="selectedCategory"
              placeholder="选择分类"
              clearable
              @change="handleCategoryChange"
            >
              <el-option
                v-for="category in categories"
                :key="category.id"
                :label="category.categoryName"
                :value="category.id"
              />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-select
              v-model="fieldTypeFilter"
              placeholder="字段类型"
              clearable
              @change="handleTypeFilter"
            >
              <el-option label="全部类型" value="" />
              <el-option label="字符串" value="VARCHAR" />
              <el-option label="数字" value="DECIMAL" />
              <el-option label="整数" value="INTEGER" />
              <el-option label="日期" value="DATE" />
              <el-option label="时间" value="DATETIME" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-checkbox v-model="requiredFieldsOnly" @change="handleRequiredFilter">
              仅必填字段
            </el-checkbox>
          </el-col>
        </el-row>
      </div>

      <!-- 主要选择区域 -->
      <div class="selection-area">
        <el-row :gutter="16">
          <!-- 左侧：可选字段树 -->
          <el-col :span="12">
            <div class="available-fields">
              <div class="panel-header">
                <div class="header-left">
                  <Icon icon="ep:collection" class="header-icon" />
                  <span class="header-title">可选字段</span>
                  <el-tag size="small" type="info">{{ filteredFieldCount }} 个字段</el-tag>
                </div>
                <div class="header-actions">
                  <el-button size="small" text @click="expandAllTables">
                    <Icon icon="ep:expand" class="mr-5px" />
                    展开全部
                  </el-button>
                  <el-button size="small" text @click="collapseAllTables">
                    <Icon icon="ep:fold" class="mr-5px" />
                    收起全部
                  </el-button>
                </div>
              </div>

              <div class="panel-body">
                <el-tree
                  ref="fieldTreeRef"
                  :data="filteredFieldsTree"
                  :props="treeProps"
                  :filter-node-method="filterFieldNode"
                  node-key="id"
                  :default-expand-all="false"
                  :expand-on-click-node="false"
                  :show-checkbox="true"
                  :check-strictly="false"
                  @check="handleFieldCheck"
                  class="field-tree"
                >
                  <template #default="{ node, data }">
                    <div class="tree-node" :class="data.type">
                      <Icon :icon="getNodeIcon(data)" class="node-icon" />
                      <span class="node-label">{{ node.label }}</span>

                      <!-- 字段额外信息 -->
                      <div v-if="data.type === 'field'" class="field-info">
                        <el-tag
                          size="small"
                          :type="getDataTypeColor(data.dataType)"
                          class="data-type-tag"
                        >
                          {{ data.dataType }}
                        </el-tag>
                        <el-tag
                          v-if="data.isRequired"
                          size="small"
                          type="danger"
                          class="required-tag"
                        >
                          必填
                        </el-tag>
                      </div>

                      <!-- 表额外信息 -->
                      <div v-if="data.type === 'table'" class="table-info">
                        <span class="field-count">{{ data.fieldCount || 0 }} 个字段</span>
                      </div>
                    </div>
                  </template>
                </el-tree>
              </div>
            </div>
          </el-col>

          <!-- 右侧：已选字段列表 -->
          <el-col :span="12">
            <div class="selected-fields">
              <div class="panel-header">
                <div class="header-left">
                  <Icon icon="ep:check" class="header-icon" />
                  <span class="header-title">已选字段</span>
                  <el-tag size="small" type="success"
                    >{{ currentSelectedFields.length }} 个字段</el-tag
                  >
                </div>
                <div class="header-actions">
                  <el-button
                    size="small"
                    text
                    @click="clearAllSelected"
                    :disabled="currentSelectedFields.length === 0"
                  >
                    <Icon icon="ep:delete" class="mr-5px" />
                    清空
                  </el-button>
                  <el-button
                    size="small"
                    text
                    @click="sortSelectedFields"
                    :disabled="currentSelectedFields.length === 0"
                  >
                    <Icon icon="ep:sort" class="mr-5px" />
                    排序
                  </el-button>
                </div>
              </div>

              <div class="panel-body">
                <div v-if="currentSelectedFields.length === 0" class="empty-selection">
                  <Icon icon="ep:box" class="empty-icon" />
                  <p>暂未选择任何字段</p>
                  <p class="empty-tip">请从左侧树中选择需要的字段</p>
                </div>

                <draggable
                  v-else
                  v-model="currentSelectedFields"
                  item-key="id"
                  handle=".drag-handle"
                  ghost-class="ghost-item"
                  class="selected-list"
                >
                  <template #item="{ element, index }">
                    <div class="selected-item">
                      <div class="item-content">
                        <Icon icon="ep:rank" class="drag-handle" />
                        <div class="field-details">
                          <div class="field-primary">
                            <Icon :icon="getNodeIcon(element)" class="field-icon" />
                            <span class="field-name">{{ element.label }}</span>
                            <el-tag
                              size="small"
                              :type="getDataTypeColor(element.dataType)"
                              class="data-type-tag"
                            >
                              {{ element.dataType }}
                            </el-tag>
                          </div>
                          <div class="field-secondary">
                            <span class="table-name">{{ element.tableName }}</span>
                            <span v-if="element.isRequired" class="required-indicator">必填</span>
                          </div>
                        </div>
                      </div>
                      <div class="item-actions">
                        <el-button
                          size="small"
                          text
                          @click="moveFieldUp(index)"
                          :disabled="index === 0"
                        >
                          <Icon icon="ep:arrow-up" />
                        </el-button>
                        <el-button
                          size="small"
                          text
                          @click="moveFieldDown(index)"
                          :disabled="index === currentSelectedFields.length - 1"
                        >
                          <Icon icon="ep:arrow-down" />
                        </el-button>
                        <el-button
                          size="small"
                          text
                          type="danger"
                          @click="removeSelectedField(index)"
                        >
                          <Icon icon="ep:delete" />
                        </el-button>
                      </div>
                    </div>
                  </template>
                </draggable>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 快速选择区 -->
      <div class="quick-selection">
        <div class="quick-header">
          <Icon icon="ep:lightning" class="header-icon" />
          <span class="header-title">快速选择</span>
        </div>
        <div class="quick-actions">
          <el-button-group>
            <el-button size="small" @click="selectRequiredFields">
              <Icon icon="ep:star" class="mr-5px" />
              选择必填字段
            </el-button>
            <el-button size="small" @click="selectCommonFields">
              <Icon icon="ep:hot-water" class="mr-5px" />
              选择常用字段
            </el-button>
            <el-button size="small" @click="selectByPattern">
              <Icon icon="ep:search" class="mr-5px" />
              按模式选择
            </el-button>
          </el-button-group>
        </div>
      </div>

      <!-- 预设字段组 -->
      <div class="preset-groups">
        <div class="preset-header">
          <Icon icon="ep:collection-tag" class="header-icon" />
          <span class="header-title">预设字段组</span>
        </div>
        <div class="preset-list">
          <el-tag
            v-for="preset in presetGroups"
            :key="preset.id"
            class="preset-tag"
            :type="preset.type"
            @click="selectPresetGroup(preset)"
          >
            <Icon :icon="preset.icon" class="mr-5px" />
            {{ preset.name }} ({{ preset.fields.length }})
          </el-tag>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-left">
          <span class="selection-summary">
            已选择 <strong>{{ currentSelectedFields.length }}</strong> 个字段
          </span>
        </div>
        <div class="footer-right">
          <el-button @click="handleClose">取消</el-button>
          <el-button
            type="primary"
            @click="handleConfirm"
            :disabled="currentSelectedFields.length === 0"
          >
            <Icon icon="ep:check" class="mr-5px" />
            确定选择
          </el-button>
        </div>
      </div>
    </template>

    <!-- 模式选择对话框 -->
    <PatternSelectionDialog v-model="showPatternDialog" @confirm="handlePatternSelection" />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import draggable from 'vuedraggable'
import { getDataSourceTree } from '@/api/drug/qc/rule/builder'
import PatternSelectionDialog from './PatternSelectionDialog.vue'

interface Props {
  modelValue: boolean
  selectedFields: any[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', fields: any[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 对话框状态
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 组件引用
const fieldTreeRef = ref()

// 搜索和过滤状态
const searchKeyword = ref('')
const selectedCategory = ref('')
const fieldTypeFilter = ref('')
const requiredFieldsOnly = ref(false)

// 数据状态
const categories = ref([])
const fieldsTree = ref([])
const currentSelectedFields = ref([]) // 重命名以避免与props冲突
const showPatternDialog = ref(false)

// 树形配置
const treeProps = {
  children: 'children',
  label: 'label'
}

// 预设字段组
const presetGroups = ref([
  {
    id: 'drug_basic',
    name: '药品基础信息',
    type: 'primary',
    icon: 'ep:pills',
    fields: ['ypid', 'drug_name', 'manufacturer', 'specification']
  },
  {
    id: 'drug_financial',
    name: '药品财务信息',
    type: 'success',
    icon: 'ep:money',
    fields: ['amount', 'quantity', 'unit_price']
  },
  {
    id: 'drug_time',
    name: '时间相关字段',
    type: 'warning',
    icon: 'ep:clock',
    fields: ['create_time', 'update_time', 'inbound_date', 'outbound_date']
  },
  {
    id: 'drug_quality',
    name: '质控相关字段',
    type: 'info',
    icon: 'ep:shield',
    fields: ['batch_no', 'expiry_date', 'quality_status']
  }
])

// 计算属性
const filteredFieldsTree = computed(() => {
  let tree = fieldsTree.value

  // 分类过滤
  if (selectedCategory.value) {
    tree = tree.filter((category) => category.id === `category_${selectedCategory.value}`)
  }

  // 关键词搜索
  if (searchKeyword.value) {
    tree = filterTreeByKeyword(tree, searchKeyword.value)
  }

  // 字段类型过滤
  if (fieldTypeFilter.value) {
    tree = filterTreeByFieldType(tree, fieldTypeFilter.value)
  }

  // 必填字段过滤
  if (requiredFieldsOnly.value) {
    tree = filterTreeByRequired(tree)
  }

  return tree
})

const filteredFieldCount = computed(() => {
  return countFieldsInTree(filteredFieldsTree.value)
})

// 监听对话框打开
watch(dialogVisible, async (visible) => {
  if (visible) {
    await loadFieldsData()
    currentSelectedFields.value = [...props.selectedFields]
    updateTreeCheckedState()
  }
})

// 监听搜索关键词
watch(searchKeyword, (keyword) => {
  nextTick(() => {
    if (fieldTreeRef.value) {
      fieldTreeRef.value.filter(keyword)
    }
  })
})

// 初始化数据
onMounted(() => {
  if (dialogVisible.value) {
    loadFieldsData()
  }
})

// 加载字段数据
const loadFieldsData = async () => {
  try {
    const { data: treeData } = await getDataSourceTree()
    fieldsTree.value = treeData

    // 提取分类信息
    categories.value = treeData.map((category) => ({
      id: category.id.replace('category_', ''),
      categoryName: category.label
    }))
  } catch (error) {
    ElMessage.error('加载字段数据失败')
  }
}

// 过滤方法
const filterTreeByKeyword = (tree: any[], keyword: string) => {
  const result: any[] = []

  tree.forEach((category) => {
    const filteredCategory = { ...category, children: [] }

    category.children?.forEach((table: any) => {
      const filteredTable = { ...table, children: [] }

      table.children?.forEach((field: any) => {
        if (
          field.label.toLowerCase().includes(keyword.toLowerCase()) ||
          field.fieldName?.toLowerCase().includes(keyword.toLowerCase()) ||
          table.label.toLowerCase().includes(keyword.toLowerCase())
        ) {
          filteredTable.children.push(field)
        }
      })

      if (
        filteredTable.children.length > 0 ||
        table.label.toLowerCase().includes(keyword.toLowerCase())
      ) {
        if (filteredTable.children.length === 0) {
          filteredTable.children = table.children || []
        }
        filteredCategory.children.push(filteredTable)
      }
    })

    if (
      filteredCategory.children.length > 0 ||
      category.label.toLowerCase().includes(keyword.toLowerCase())
    ) {
      if (filteredCategory.children.length === 0) {
        filteredCategory.children = category.children || []
      }
      result.push(filteredCategory)
    }
  })

  return result
}

const filterTreeByFieldType = (tree: any[], fieldType: string) => {
  return tree
    .map((category) => ({
      ...category,
      children:
        category.children
          ?.map((table: any) => ({
            ...table,
            children: table.children?.filter((field: any) => field.dataType === fieldType) || []
          }))
          .filter((table: any) => table.children.length > 0) || []
    }))
    .filter((category) => category.children.length > 0)
}

const filterTreeByRequired = (tree: any[]) => {
  return tree
    .map((category) => ({
      ...category,
      children:
        category.children
          ?.map((table: any) => ({
            ...table,
            children: table.children?.filter((field: any) => field.isRequired) || []
          }))
          .filter((table: any) => table.children.length > 0) || []
    }))
    .filter((category) => category.children.length > 0)
}

const filterFieldNode = (value: string, data: any) => {
  if (!value) return true
  return data.label.toLowerCase().includes(value.toLowerCase())
}

const countFieldsInTree = (tree: any[]) => {
  let count = 0
  tree.forEach((category) => {
    category.children?.forEach((table: any) => {
      count += table.children?.length || 0
    })
  })
  return count
}

// 树形操作方法
const expandAllTables = () => {
  nextTick(() => {
    if (fieldTreeRef.value) {
      // 展开所有分类和表节点
      const expandKeys: string[] = []
      filteredFieldsTree.value.forEach((category) => {
        expandKeys.push(category.id)
        category.children?.forEach((table: any) => {
          expandKeys.push(table.id)
        })
      })
      fieldTreeRef.value.setExpandedKeys(expandKeys)
    }
  })
}

const collapseAllTables = () => {
  nextTick(() => {
    if (fieldTreeRef.value) {
      fieldTreeRef.value.setExpandedKeys([])
    }
  })
}

// 字段选择处理
const handleFieldCheck = (data: any, { checkedKeys, checkedNodes }: any) => {
  // 过滤出字段类型的节点
  const fieldNodes = checkedNodes.filter((node: any) => node.type === 'field')
  currentSelectedFields.value = fieldNodes.map((node: any) => ({
    id: node.id,
    label: node.label,
    fieldName: node.fieldName,
    tableName: node.tableName,
    dataType: node.dataType,
    isRequired: node.isRequired,
    type: 'field'
  }))
}

const updateTreeCheckedState = () => {
  nextTick(() => {
    if (fieldTreeRef.value) {
      const checkedKeys = currentSelectedFields.value.map((field) => field.id)
      fieldTreeRef.value.setCheckedKeys(checkedKeys)
    }
  })
}

// 已选字段操作
const removeSelectedField = (index: number) => {
  const removedField = currentSelectedFields.value[index]
  currentSelectedFields.value.splice(index, 1)

  // 更新树状态
  if (fieldTreeRef.value) {
    fieldTreeRef.value.setChecked(removedField.id, false)
  }
}

const clearAllSelected = () => {
  currentSelectedFields.value = []
  if (fieldTreeRef.value) {
    fieldTreeRef.value.setCheckedKeys([])
  }
}

const moveFieldUp = (index: number) => {
  if (index > 0) {
    const temp = currentSelectedFields.value[index]
    currentSelectedFields.value[index] = currentSelectedFields.value[index - 1]
    currentSelectedFields.value[index - 1] = temp
  }
}

const moveFieldDown = (index: number) => {
  if (index < currentSelectedFields.value.length - 1) {
    const temp = currentSelectedFields.value[index]
    currentSelectedFields.value[index] = currentSelectedFields.value[index + 1]
    currentSelectedFields.value[index + 1] = temp
  }
}

const sortSelectedFields = () => {
  currentSelectedFields.value.sort((a, b) => {
    // 先按表名排序，再按字段名排序
    if (a.tableName !== b.tableName) {
      return a.tableName.localeCompare(b.tableName)
    }
    return a.fieldName.localeCompare(b.fieldName)
  })
}

// 快速选择方法
const selectRequiredFields = () => {
  const requiredFields: any[] = []

  fieldsTree.value.forEach((category) => {
    category.children?.forEach((table: any) => {
      table.children?.forEach((field: any) => {
        if (field.isRequired && !currentSelectedFields.value.find((f) => f.id === field.id)) {
          requiredFields.push({
            id: field.id,
            label: field.label,
            fieldName: field.fieldName,
            tableName: field.tableName,
            dataType: field.dataType,
            isRequired: field.isRequired,
            type: 'field'
          })
        }
      })
    })
  })

  currentSelectedFields.value.push(...requiredFields)
  updateTreeCheckedState()

  ElMessage.success(`已添加 ${requiredFields.length} 个必填字段`)
}

const selectCommonFields = () => {
  const commonFieldNames = ['ypid', 'drug_name', 'manufacturer', 'amount', 'quantity']
  const commonFields: any[] = []

  fieldsTree.value.forEach((category) => {
    category.children?.forEach((table: any) => {
      table.children?.forEach((field: any) => {
        if (
          commonFieldNames.includes(field.fieldName) &&
          !currentSelectedFields.value.find((f) => f.id === field.id)
        ) {
          commonFields.push({
            id: field.id,
            label: field.label,
            fieldName: field.fieldName,
            tableName: field.tableName,
            dataType: field.dataType,
            isRequired: field.isRequired,
            type: 'field'
          })
        }
      })
    })
  })

  currentSelectedFields.value.push(...commonFields)
  updateTreeCheckedState()

  ElMessage.success(`已添加 ${commonFields.length} 个常用字段`)
}

const selectByPattern = () => {
  showPatternDialog.value = true
}

const handlePatternSelection = (pattern: string) => {
  const regex = new RegExp(pattern, 'i')
  const matchedFields: any[] = []

  fieldsTree.value.forEach((category) => {
    category.children?.forEach((table: any) => {
      table.children?.forEach((field: any) => {
        if (
          (regex.test(field.fieldName) || regex.test(field.label)) &&
          !currentSelectedFields.value.find((f) => f.id === field.id)
        ) {
          matchedFields.push({
            id: field.id,
            label: field.label,
            fieldName: field.fieldName,
            tableName: field.tableName,
            dataType: field.dataType,
            isRequired: field.isRequired,
            type: 'field'
          })
        }
      })
    })
  })

  currentSelectedFields.value.push(...matchedFields)
  updateTreeCheckedState()

  ElMessage.success(`已添加 ${matchedFields.length} 个匹配字段`)
}

const selectPresetGroup = (preset: any) => {
  const presetFields: any[] = []

  fieldsTree.value.forEach((category) => {
    category.children?.forEach((table: any) => {
      table.children?.forEach((field: any) => {
        if (
          preset.fields.includes(field.fieldName) &&
          !currentSelectedFields.value.find((f) => f.id === field.id)
        ) {
          presetFields.push({
            id: field.id,
            label: field.label,
            fieldName: field.fieldName,
            tableName: field.tableName,
            dataType: field.dataType,
            isRequired: field.isRequired,
            type: 'field'
          })
        }
      })
    })
  })

  currentSelectedFields.value.push(...presetFields)
  updateTreeCheckedState()

  ElMessage.success(`已添加预设字段组"${preset.name}" ${presetFields.length} 个字段`)
}

// 工具方法
const getNodeIcon = (data: any) => {
  switch (data.type) {
    case 'category':
      return 'ep:folder'
    case 'table':
      return 'ep:grid'
    case 'field':
      return 'ep:key'
    default:
      return 'ep:document'
  }
}

const getDataTypeColor = (dataType: string) => {
  const colorMap: Record<string, string> = {
    VARCHAR: '',
    TEXT: '',
    INTEGER: 'success',
    DECIMAL: 'warning',
    DATE: 'info',
    DATETIME: 'info',
    BOOLEAN: 'danger'
  }
  return colorMap[dataType] || ''
}

// 过滤事件处理
const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
}

const handleCategoryChange = () => {
  // 分类过滤逻辑已在计算属性中处理
}

const handleTypeFilter = () => {
  // 类型过滤逻辑已在计算属性中处理
}

const handleRequiredFilter = () => {
  // 必填过滤逻辑已在计算属性中处理
}

// 事件处理
const handleClose = () => {
  dialogVisible.value = false
}

const handleConfirm = () => {
  emit('confirm', currentSelectedFields.value)
  handleClose()
}
</script>

<style lang="scss" scoped>
.field-selector-dialog {
  .selector-container {
    max-height: 70vh;
    display: flex;
    flex-direction: column;
    gap: 20px;

    .search-section {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #e4e7ed;
    }

    .selection-area {
      flex: 1;
      min-height: 400px;
    }

    .available-fields,
    .selected-fields {
      height: 500px;
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      display: flex;
      flex-direction: column;

      .panel-header {
        padding: 12px 16px;
        background: #f8f9fa;
        border-bottom: 1px solid #e4e7ed;
        display: flex;
        align-items: center;
        justify-content: space-between;

        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;

          .header-icon {
            color: #409eff;
          }

          .header-title {
            font-weight: 500;
          }
        }

        .header-actions {
          display: flex;
          gap: 4px;
        }
      }

      .panel-body {
        flex: 1;
        padding: 12px;
        overflow-y: auto;
      }
    }

    .field-tree {
      .tree-node {
        display: flex;
        align-items: center;
        width: 100%;
        gap: 6px;

        .node-icon {
          flex-shrink: 0;
        }

        .node-label {
          flex: 1;
          margin-right: 8px;
        }

        .field-info,
        .table-info {
          display: flex;
          align-items: center;
          gap: 4px;

          .data-type-tag,
          .required-tag {
            font-size: 10px;
            height: 16px;
            line-height: 16px;
          }

          .field-count {
            font-size: 12px;
            color: #909399;
          }
        }

        &.field {
          font-size: 14px;
        }

        &.table {
          font-weight: 500;
        }

        &.category {
          font-weight: 600;
        }
      }
    }

    .empty-selection {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #909399;

      .empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }

      .empty-tip {
        font-size: 12px;
        margin-top: 4px;
      }
    }

    .selected-list {
      .selected-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        margin-bottom: 8px;
        background: white;
        border: 1px solid #e4e7ed;
        border-radius: 6px;
        transition: all 0.3s;

        &:hover {
          border-color: #409eff;
          background: rgba(64, 158, 255, 0.05);
        }

        .item-content {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;

          .drag-handle {
            color: #c0c4cc;
            cursor: move;

            &:hover {
              color: #409eff;
            }
          }

          .field-details {
            flex: 1;

            .field-primary {
              display: flex;
              align-items: center;
              gap: 6px;
              margin-bottom: 2px;

              .field-icon {
                color: #409eff;
              }

              .field-name {
                font-weight: 500;
              }

              .data-type-tag {
                font-size: 10px;
                height: 16px;
                line-height: 16px;
              }
            }

            .field-secondary {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 12px;
              color: #909399;

              .required-indicator {
                color: #f56c6c;
                font-weight: 500;
              }
            }
          }
        }

        .item-actions {
          display: flex;
          gap: 4px;
        }
      }

      .ghost-item {
        opacity: 0.5;
        background: #409eff;
        color: white;
      }
    }

    .quick-selection,
    .preset-groups {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #e4e7ed;

      .quick-header,
      .preset-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;

        .header-icon {
          color: #409eff;
        }

        .header-title {
          font-weight: 500;
        }
      }

      .quick-actions {
        display: flex;
        gap: 8px;
      }

      .preset-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .preset-tag {
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .footer-left {
      .selection-summary {
        color: #606266;
        font-size: 14px;

        strong {
          color: #409eff;
        }
      }
    }

    .footer-right {
      display: flex;
      gap: 12px;
    }
  }
}

// 响应式调整
@media (max-width: 768px) {
  .field-selector-dialog {
    .selector-container {
      .selection-area {
        .el-row .el-col {
          margin-bottom: 16px;
        }
      }

      .available-fields,
      .selected-fields {
        height: 300px;
      }

      .quick-selection .quick-actions {
        flex-direction: column;
      }

      .preset-groups .preset-list {
        justify-content: center;
      }
    }

    .dialog-footer {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;

      .footer-left,
      .footer-right {
        justify-content: center;
      }
    }
  }
}
</style>
