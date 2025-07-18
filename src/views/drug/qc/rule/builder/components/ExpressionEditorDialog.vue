<template>
  <el-dialog
    v-model="dialogVisible"
    title="表达式编辑器"
    width="85%"
    :before-close="handleClose"
    destroy-on-close
    class="expression-editor-dialog"
  >
    <div class="editor-container">
      <el-row :gutter="20">
        <!-- 左侧工具栏 -->
        <el-col :span="6">
          <div class="editor-sidebar">
            <el-tabs v-model="activeToolTab" class="sidebar-tabs">
              <!-- 数据源 -->
              <el-tab-pane label="数据源" name="datasource">
                <div class="tool-panel">
                  <div class="panel-search">
                    <el-input
                      v-model="datasourceFilter"
                      placeholder="搜索表或字段"
                      clearable
                      size="small"
                    >
                      <template #prefix>
                        <Icon icon="ep:search" />
                      </template>
                    </el-input>
                  </div>

                  <el-tree
                    ref="datasourceTreeRef"
                    :data="datasourceTree"
                    :props="treeProps"
                    :filter-node-method="filterDatasourceNode"
                    node-key="id"
                    :default-expand-all="false"
                    draggable
                    @node-drag-start="handleDatasourceDragStart"
                    class="datasource-tree"
                  >
                    <template #default="{ node, data }">
                      <div class="tree-node" :class="data.type">
                        <Icon :icon="getNodeIcon(data)" class="node-icon" />
                        <span class="node-label">{{ node.label }}</span>
                        <span v-if="data.type === 'field'" class="field-type">{{
                          data.dataType
                        }}</span>
                      </div>
                    </template>
                  </el-tree>
                </div>
              </el-tab-pane>

              <!-- 函数库 -->
              <el-tab-pane label="函数" name="functions">
                <div class="tool-panel">
                  <div class="panel-search">
                    <el-input
                      v-model="functionFilter"
                      placeholder="搜索函数"
                      clearable
                      size="small"
                    >
                      <template #prefix>
                        <Icon icon="ep:search" />
                      </template>
                    </el-input>
                  </div>

                  <el-collapse v-model="activeFunctionCategories">
                    <el-collapse-item
                      v-for="category in filteredFunctionCategories"
                      :key="category.name"
                      :title="category.name"
                      :name="category.name"
                    >
                      <div class="function-list">
                        <div
                          v-for="func in category.functions"
                          :key="func.id"
                          class="function-item"
                          draggable
                          @dragstart="handleFunctionDragStart($event, func)"
                          @click="insertFunction(func)"
                        >
                          <div class="function-header">
                            <span class="function-name">{{ func.functionName }}</span>
                            <el-tag size="small" :type="getFunctionLevelType(func.functionLevel)">
                              {{ getFunctionLevelText(func.functionLevel) }}
                            </el-tag>
                          </div>
                          <div class="function-desc">{{ func.chineseName }}</div>
                          <div class="function-usage">{{ func.usageExample }}</div>
                        </div>
                      </div>
                    </el-collapse-item>
                  </el-collapse>
                </div>
              </el-tab-pane>

              <!-- 操作符 -->
              <el-tab-pane label="操作符" name="operators">
                <div class="tool-panel">
                  <el-collapse v-model="activeOperatorCategories">
                    <el-collapse-item
                      v-for="category in operatorCategories"
                      :key="category.name"
                      :title="category.name"
                      :name="category.name"
                    >
                      <div class="operator-list">
                        <div
                          v-for="operator in category.operators"
                          :key="operator.id"
                          class="operator-item"
                          @click="insertOperator(operator)"
                        >
                          <div class="operator-symbol">{{ operator.operatorSymbol }}</div>
                          <div class="operator-name">{{ operator.chineseName }}</div>
                        </div>
                      </div>
                    </el-collapse-item>
                  </el-collapse>
                </div>
              </el-tab-pane>

              <!-- 模板 -->
              <el-tab-pane label="模板" name="templates">
                <div class="tool-panel">
                  <div class="template-list">
                    <div
                      v-for="template in expressionTemplates"
                      :key="template.id"
                      class="template-item"
                      @click="applyTemplate(template)"
                    >
                      <div class="template-header">
                        <Icon :icon="template.icon" class="template-icon" />
                        <span class="template-name">{{ template.name }}</span>
                      </div>
                      <div class="template-desc">{{ template.description }}</div>
                      <div class="template-example">{{ template.example }}</div>
                    </div>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </el-col>

        <!-- 中间编辑区 -->
        <el-col :span="12">
          <div class="editor-main">
            <!-- 编辑器工具栏 -->
            <div class="editor-toolbar">
              <div class="toolbar-left">
                <el-button-group>
                  <el-button size="small" @click="handleUndo" :disabled="!canUndo">
                    <Icon icon="ep:back" />
                    撤销
                  </el-button>
                  <el-button size="small" @click="handleRedo" :disabled="!canRedo">
                    <Icon icon="ep:right" />
                    重做
                  </el-button>
                </el-button-group>

                <el-button-group>
                  <el-button size="small" @click="clearExpression">
                    <Icon icon="ep:delete" />
                    清空
                  </el-button>
                  <el-button size="small" @click="formatExpression">
                    <Icon icon="ep:magic-stick" />
                    格式化
                  </el-button>
                </el-button-group>
              </div>

              <div class="toolbar-right">
                <el-button size="small" @click="validateExpression" :loading="validating">
                  <Icon icon="ep:check" />
                  验证
                </el-button>
                <el-button
                  size="small"
                  type="primary"
                  @click="compileExpression"
                  :loading="compiling"
                >
                  <Icon icon="ep:cpu" />
                  编译
                </el-button>
              </div>
            </div>

            <!-- 可视化编辑器 -->
            <div class="visual-editor">
              <div
                class="editor-canvas"
                @drop="handleDrop"
                @dragover="handleDragOver"
                @dragleave="handleDragLeave"
              >
                <div v-if="!expressionComponents.length" class="empty-canvas">
                  <Icon icon="ep:edit" class="empty-icon" />
                  <p>拖拽字段、函数或操作符到此处开始构建表达式</p>
                  <p class="empty-tip">或从右侧选择模板快速开始</p>
                </div>

                <div v-else class="expression-workspace">
                  <ExpressionComponent
                    v-for="(component, index) in expressionComponents"
                    :key="`comp-${index}`"
                    :component="component"
                    :index="index"
                    @update="updateComponent(index, $event)"
                    @remove="removeComponent(index)"
                    @insert="insertComponent(index, $event)"
                  />
                </div>
              </div>
            </div>

            <!-- 文本编辑器 -->
            <div class="text-editor">
              <div class="editor-header">
                <span>文本模式</span>
                <el-switch
                  v-model="textModeEnabled"
                  @change="handleTextModeToggle"
                  active-text="启用"
                  inactive-text="禁用"
                />
              </div>

              <el-input
                v-if="textModeEnabled"
                v-model="expressionText"
                type="textarea"
                :rows="4"
                placeholder="输入表达式文本"
                @input="handleTextInput"
                class="text-input"
              />
            </div>

            <!-- 表达式预览 -->
            <div class="expression-preview">
              <div class="preview-header">
                <span>表达式预览</span>
                <el-button size="small" text @click="copyExpression">
                  <Icon icon="ep:document-copy" />
                  复制
                </el-button>
              </div>
              <div class="preview-content">
                <code class="expression-code">{{ generateExpressionText() }}</code>
              </div>
            </div>
          </div>
        </el-col>

        <!-- 右侧属性面板 -->
        <el-col :span="6">
          <div class="editor-properties">
            <!-- 组件属性 -->
            <div class="property-panel">
              <div class="panel-header">
                <Icon icon="ep:setting" class="header-icon" />
                <span>组件属性</span>
              </div>

              <div v-if="selectedComponent" class="panel-content">
                <ComponentProperties
                  :component="selectedComponent"
                  :index="selectedComponentIndex"
                  @update="updateSelectedComponent"
                />
              </div>

              <div v-else class="empty-properties">
                <Icon icon="ep:box" class="empty-icon" />
                <p>请选择一个组件</p>
              </div>
            </div>

            <!-- 验证结果 -->
            <div class="validation-panel">
              <div class="panel-header">
                <Icon icon="ep:check" class="header-icon" />
                <span>验证结果</span>
              </div>

              <div v-if="validationResult" class="panel-content">
                <el-alert
                  :type="validationResult.isValid ? 'success' : 'error'"
                  :title="validationResult.isValid ? '表达式有效' : '表达式无效'"
                  show-icon
                  :closable="false"
                />

                <div
                  v-if="!validationResult.isValid && validationResult.errors?.length"
                  class="error-list"
                >
                  <div class="error-title">错误详情：</div>
                  <ul>
                    <li v-for="error in validationResult.errors" :key="error" class="error-item">
                      {{ error }}
                    </li>
                  </ul>
                </div>

                <div v-if="validationResult.warnings?.length" class="warning-list">
                  <div class="warning-title">警告信息：</div>
                  <ul>
                    <li
                      v-for="warning in validationResult.warnings"
                      :key="warning"
                      class="warning-item"
                    >
                      {{ warning }}
                    </li>
                  </ul>
                </div>

                <div v-if="validationResult.suggestions?.length" class="suggestion-list">
                  <div class="suggestion-title">优化建议：</div>
                  <ul>
                    <li
                      v-for="suggestion in validationResult.suggestions"
                      :key="suggestion"
                      class="suggestion-item"
                    >
                      {{ suggestion }}
                    </li>
                  </ul>
                </div>
              </div>

              <div v-else class="empty-validation">
                <Icon icon="ep:compass" class="empty-icon" />
                <p>暂无验证结果</p>
              </div>
            </div>

            <!-- 编译结果 -->
            <div class="compilation-panel">
              <div class="panel-header">
                <Icon icon="ep:cpu" class="header-icon" />
                <span>编译结果</span>
              </div>

              <div v-if="compilationResult" class="panel-content">
                <el-alert
                  :type="compilationResult.isValid ? 'success' : 'error'"
                  :title="compilationResult.isValid ? '编译成功' : '编译失败'"
                  show-icon
                  :closable="false"
                />

                <div
                  v-if="compilationResult.isValid && compilationResult.sqlExpression"
                  class="sql-result"
                >
                  <div class="sql-title">生成的SQL：</div>
                  <div class="sql-content">
                    <pre><code>{{ formatSQL(compilationResult.sqlExpression) }}</code></pre>
                  </div>
                  <el-button size="small" text @click="copySQL">
                    <Icon icon="ep:document-copy" />
                    复制SQL
                  </el-button>
                </div>

                <div v-if="compilationResult.usedTables?.length" class="used-resources">
                  <div class="resource-title">使用的表：</div>
                  <div class="resource-tags">
                    <el-tag v-for="table in compilationResult.usedTables" :key="table" size="small">
                      {{ table }}
                    </el-tag>
                  </div>
                </div>

                <div v-if="compilationResult.usedFields?.length" class="used-resources">
                  <div class="resource-title">使用的字段：</div>
                  <div class="resource-tags">
                    <el-tag
                      v-for="field in compilationResult.usedFields"
                      :key="field"
                      size="small"
                      type="primary"
                    >
                      {{ field }}
                    </el-tag>
                  </div>
                </div>
              </div>

              <div v-else class="empty-compilation">
                <Icon icon="ep:data-analysis" class="empty-icon" />
                <p>暂无编译结果</p>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-left">
          <el-button @click="saveAsTemplate">
            <Icon icon="ep:collection-tag" class="mr-5px" />
            保存为模板
          </el-button>
        </div>
        <div class="footer-right">
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" @click="handleConfirm" :disabled="!expressionComponents.length">
            <Icon icon="ep:check" class="mr-5px" />
            确定
          </el-button>
        </div>
      </div>
    </template>

    <!-- 保存模板对话框 -->
    <SaveTemplateDialog
      v-model="showSaveTemplate"
      :expression="currentExpression"
      @confirm="handleTemplateSaved"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import ExpressionComponent from './ExpressionComponent.vue'
import ComponentProperties from './ComponentProperties.vue'
import SaveTemplateDialog from './SaveTemplateDialog.vue'
import {
  getDataSourceTree,
  getFunctionCategories,
  getOperatorCategories,
  validateExpression,
  compileRuleExpression
} from '@/api/drug/qc/rule/builder'

interface Props {
  modelValue: boolean
  expression: any
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', expression: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 对话框状态
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 组件引用
const datasourceTreeRef = ref()

// 侧边栏状态
const activeToolTab = ref('datasource')
const datasourceFilter = ref('')
const functionFilter = ref('')
const activeFunctionCategories = ref(['STATISTICS'])
const activeOperatorCategories = ref(['COMPARISON'])

// 编辑器状态
const expressionComponents = ref([])
const expressionText = ref('')
const textModeEnabled = ref(false)
const selectedComponent = ref(null)
const selectedComponentIndex = ref(-1)

// 历史记录
const history = ref([])
const historyIndex = ref(-1)

// 验证和编译状态
const validating = ref(false)
const compiling = ref(false)
const validationResult = ref(null)
const compilationResult = ref(null)

// 数据源
const datasourceTree = ref([])
const functionCategories = ref([])
const operatorCategories = ref([])

// 对话框状态
const showSaveTemplate = ref(false)

// 树形配置
const treeProps = {
  children: 'children',
  label: 'label'
}

// 表达式模板
const expressionTemplates = ref([
  {
    id: 'basic_comparison',
    name: '基础比较',
    icon: 'ep:sort',
    description: '字段与常量的基础比较',
    example: 'field = value',
    template: [
      { type: 'field', value: '', label: '选择字段' },
      { type: 'operator', value: '=', label: '等于' },
      { type: 'constant', value: '', label: '常量值' }
    ]
  },
  {
    id: 'function_call',
    name: '函数调用',
    icon: 'ep:cpu',
    description: '函数调用表达式',
    example: 'COUNT(field) > 0',
    template: [
      {
        type: 'function',
        value: 'COUNT',
        label: '计数',
        parameters: [{ type: 'field', value: '', label: '字段' }]
      },
      { type: 'operator', value: '>', label: '大于' },
      { type: 'constant', value: 0, label: '0' }
    ]
  },
  {
    id: 'null_check',
    name: '空值检查',
    icon: 'ep:warning',
    description: '检查字段是否为空',
    example: 'field IS NULL',
    template: [
      { type: 'field', value: '', label: '选择字段' },
      { type: 'operator', value: 'IS NULL', label: '为空' }
    ]
  },
  {
    id: 'range_check',
    name: '范围检查',
    icon: 'ep:scale-to-original',
    description: '检查值是否在指定范围内',
    example: 'field BETWEEN min AND max',
    template: [
      { type: 'field', value: '', label: '选择字段' },
      { type: 'operator', value: 'BETWEEN', label: '在范围内' },
      { type: 'constant', value: '', label: '最小值' },
      { type: 'operator', value: 'AND', label: '并且' },
      { type: 'constant', value: '', label: '最大值' }
    ]
  },
  {
    id: 'logical_and',
    name: '逻辑与',
    icon: 'ep:connection',
    description: '多个条件的逻辑与组合',
    example: 'condition1 AND condition2',
    template: [
      {
        type: 'group',
        operator: 'AND',
        components: [
          { type: 'field', value: '', label: '字段1' },
          { type: 'operator', value: '=', label: '等于' },
          { type: 'constant', value: '', label: '值1' }
        ]
      },
      { type: 'operator', value: 'AND', label: '并且' },
      {
        type: 'group',
        operator: 'AND',
        components: [
          { type: 'field', value: '', label: '字段2' },
          { type: 'operator', value: '=', label: '等于' },
          { type: 'constant', value: '', label: '值2' }
        ]
      }
    ]
  }
])

// 计算属性
const filteredFunctionCategories = computed(() => {
  if (!functionFilter.value) return functionCategories.value

  return functionCategories.value
    .map((category) => ({
      ...category,
      functions: category.functions.filter(
        (func: any) =>
          func.functionName.toLowerCase().includes(functionFilter.value.toLowerCase()) ||
          func.chineseName.includes(functionFilter.value)
      )
    }))
    .filter((category) => category.functions.length > 0)
})

const canUndo = computed(() => historyIndex.value > 0)
const canRedo = computed(() => historyIndex.value < history.value.length - 1)

const currentExpression = computed(() => ({
  components: expressionComponents.value,
  text: generateExpressionText()
}))

// 监听对话框打开
watch(dialogVisible, async (visible) => {
  if (visible) {
    await loadData()
    if (props.expression) {
      loadExpression(props.expression)
    }
    saveToHistory()
  }
})

// 监听数据源过滤
watch(datasourceFilter, (val) => {
  nextTick(() => {
    if (datasourceTreeRef.value) {
      datasourceTreeRef.value.filter(val)
    }
  })
})

// 初始化
onMounted(() => {
  if (dialogVisible.value) {
    loadData()
  }
})

// 数据加载
const loadData = async () => {
  try {
    const [datasourceData, functionData, operatorData] = await Promise.all([
      getDataSourceTree(),
      getFunctionCategories(),
      getOperatorCategories()
    ])

    datasourceTree.value = datasourceData.data
    functionCategories.value = functionData.data
    operatorCategories.value = operatorData.data
  } catch (error) {
    ElMessage.error('加载数据失败')
  }
}

// 表达式操作
const loadExpression = (expression: any) => {
  if (expression.components) {
    expressionComponents.value = expression.components
  }
  if (expression.text) {
    expressionText.value = expression.text
  }
}

const generateExpressionText = () => {
  return expressionComponents.value
    .map((comp) => {
      if (comp.type === 'function') {
        const params = comp.parameters ? comp.parameters.map((p: any) => p.value).join(', ') : ''
        return `${comp.value}(${params})`
      }
      return comp.value
    })
    .join(' ')
}

const clearExpression = () => {
  expressionComponents.value = []
  expressionText.value = ''
  saveToHistory()
}

const formatExpression = () => {
  // 格式化表达式逻辑
  const formatted = generateExpressionText()
  expressionText.value = formatted
}

// 历史记录管理
const saveToHistory = () => {
  const state = {
    components: JSON.parse(JSON.stringify(expressionComponents.value)),
    text: expressionText.value
  }

  history.value.splice(historyIndex.value + 1)
  history.value.push(state)
  historyIndex.value = history.value.length - 1

  // 限制历史记录数量
  if (history.value.length > 50) {
    history.value.shift()
    historyIndex.value--
  }
}

const handleUndo = () => {
  if (canUndo.value) {
    historyIndex.value--
    const state = history.value[historyIndex.value]
    expressionComponents.value = JSON.parse(JSON.stringify(state.components))
    expressionText.value = state.text
  }
}

const handleRedo = () => {
  if (canRedo.value) {
    historyIndex.value++
    const state = history.value[historyIndex.value]
    expressionComponents.value = JSON.parse(JSON.stringify(state.components))
    expressionText.value = state.text
  }
}

// 拖拽处理
const handleDatasourceDragStart = (event: DragEvent, node: any) => {
  event.dataTransfer?.setData(
    'application/json',
    JSON.stringify({
      type: 'datasource',
      nodeType: node.data.type,
      data: node.data
    })
  )
}

const handleFunctionDragStart = (event: DragEvent, func: any) => {
  event.dataTransfer?.setData(
    'application/json',
    JSON.stringify({
      type: 'function',
      data: func
    })
  )
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()

  try {
    const dragData = JSON.parse(event.dataTransfer?.getData('application/json') || '{}')
    let component = null

    switch (dragData.type) {
      case 'datasource':
        if (dragData.nodeType === 'field') {
          component = {
            type: 'field',
            value: `${dragData.data.tableName}.${dragData.data.fieldName}`,
            label: dragData.data.label,
            dataType: dragData.data.dataType,
            fieldName: dragData.data.fieldName,
            tableName: dragData.data.tableName
          }
        }
        break

      case 'function':
        component = {
          type: 'function',
          value: dragData.data.functionName,
          label: dragData.data.chineseName,
          parameters: [],
          config: dragData.data
        }
        break
    }

    if (component) {
      expressionComponents.value.push(component)
      saveToHistory()
    }
  } catch (error) {
    console.error('拖拽数据解析失败:', error)
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  event.currentTarget?.classList.add('drag-over')
}

const handleDragLeave = (event: DragEvent) => {
  event.currentTarget?.classList.remove('drag-over')
}

// 组件操作
const updateComponent = (index: number, component: any) => {
  expressionComponents.value[index] = component
  saveToHistory()
}

const removeComponent = (index: number) => {
  expressionComponents.value.splice(index, 1)
  saveToHistory()
}

const insertComponent = (index: number, component: any) => {
  expressionComponents.value.splice(index + 1, 0, component)
  saveToHistory()
}

// 插入操作
const insertFunction = (func: any) => {
  const component = {
    type: 'function',
    value: func.functionName,
    label: func.chineseName,
    parameters: [],
    config: func
  }
  expressionComponents.value.push(component)
  saveToHistory()
}

const insertOperator = (operator: any) => {
  const component = {
    type: 'operator',
    value: operator.operatorSymbol,
    label: operator.chineseName,
    config: operator
  }
  expressionComponents.value.push(component)
  saveToHistory()
}

const applyTemplate = (template: any) => {
  expressionComponents.value = JSON.parse(JSON.stringify(template.template))
  saveToHistory()
  ElMessage.success(`已应用模板"${template.name}"`)
}

// 文本模式处理
const handleTextModeToggle = (enabled: boolean) => {
  if (enabled) {
    expressionText.value = generateExpressionText()
  } else {
    // 从文本模式切换回可视化模式时，解析文本为组件
    parseTextToComponents()
  }
}

const handleTextInput = (text: string) => {
  // 实时解析文本为组件（简化处理）
  // 在实际应用中需要更复杂的解析逻辑
}

const parseTextToComponents = () => {
  // 简化的文本解析逻辑
  // 在实际应用中需要实现完整的表达式解析器
}

// 验证和编译
const validateExpression = async () => {
  try {
    validating.value = true

    const expressionJson = {
      type: 'expression',
      components: expressionComponents.value
    }

    const { data } = await validateExpression(expressionJson)
    validationResult.value = data

    if (data.isValid) {
      ElMessage.success('表达式验证通过')
    } else {
      ElMessage.error('表达式验证失败')
    }
  } catch (error: any) {
    ElMessage.error('验证失败: ' + error.message)
  } finally {
    validating.value = false
  }
}

const compileExpression = async () => {
  try {
    compiling.value = true

    const expressionJson = {
      type: 'expression',
      components: expressionComponents.value
    }

    const { data } = await compileRuleExpression({
      expressionJson,
      tableName: 'temp_table'
    })

    compilationResult.value = data

    if (data.isValid) {
      ElMessage.success('表达式编译成功')
    } else {
      ElMessage.error('表达式编译失败')
    }
  } catch (error: any) {
    ElMessage.error('编译失败: ' + error.message)
  } finally {
    compiling.value = false
  }
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

const getFunctionLevelType = (level: number) => {
  const types = { 1: '', 2: 'warning', 3: 'danger' }
  return types[level] || ''
}

const getFunctionLevelText = (level: number) => {
  const texts = { 1: '基础', 2: '高级', 3: '专家' }
  return texts[level] || ''
}

const filterDatasourceNode = (value: string, data: any) => {
  if (!value) return true
  return data.label.toLowerCase().includes(value.toLowerCase())
}

const formatSQL = (sql: string) => {
  return sql
    .replace(/SELECT/gi, 'SELECT')
    .replace(/FROM/gi, '\nFROM')
    .replace(/WHERE/gi, '\nWHERE')
    .replace(/AND/gi, '\n  AND')
    .replace(/OR/gi, '\n  OR')
}

const copyExpression = async () => {
  try {
    await navigator.clipboard.writeText(generateExpressionText())
    ElMessage.success('表达式已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const copySQL = async () => {
  if (compilationResult.value?.sqlExpression) {
    try {
      await navigator.clipboard.writeText(compilationResult.value.sqlExpression)
      ElMessage.success('SQL已复制到剪贴板')
    } catch (error) {
      ElMessage.error('复制失败')
    }
  }
}

// 模板操作
const saveAsTemplate = () => {
  if (expressionComponents.value.length === 0) {
    ElMessage.warning('请先构建一个表达式')
    return
  }
  showSaveTemplate.value = true
}

const handleTemplateSaved = (templateInfo: any) => {
  ElMessage.success(`模板"${templateInfo.name}"保存成功`)
  // 这里可以更新本地模板列表
}

// 组件属性
const updateSelectedComponent = (component: any) => {
  if (selectedComponentIndex.value >= 0) {
    expressionComponents.value[selectedComponentIndex.value] = component
    saveToHistory()
  }
}

// 事件处理
const handleClose = () => {
  dialogVisible.value = false
}

const handleConfirm = () => {
  const expression = {
    components: expressionComponents.value,
    text: generateExpressionText(),
    json: {
      type: 'expression',
      components: expressionComponents.value
    }
  }

  emit('confirm', expression)
  handleClose()
}
</script>

<style lang="scss" scoped>
.expression-editor-dialog {
  .editor-container {
    height: 70vh;
    display: flex;
    flex-direction: column;

    .editor-sidebar {
      height: 100%;
      border: 1px solid #e4e7ed;
      border-radius: 8px;

      .sidebar-tabs {
        height: 100%;
        display: flex;
        flex-direction: column;

        :deep(.el-tabs__content) {
          flex: 1;
          overflow: hidden;
        }

        :deep(.el-tab-pane) {
          height: 100%;
        }
      }

      .tool-panel {
        height: 100%;
        display: flex;
        flex-direction: column;

        .panel-search {
          padding: 12px;
          border-bottom: 1px solid #e4e7ed;
        }

        .datasource-tree {
          flex: 1;
          padding: 12px;
          overflow-y: auto;

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
            }

            .field-type {
              font-size: 10px;
              background: #f0f0f0;
              padding: 2px 4px;
              border-radius: 2px;
            }
          }
        }

        .function-list,
        .operator-list,
        .template-list {
          padding: 12px;
          overflow-y: auto;
        }

        .function-item {
          padding: 8px;
          border: 1px solid #e4e7ed;
          border-radius: 4px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            border-color: #409eff;
            background: rgba(64, 158, 255, 0.05);
          }

          .function-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 4px;
          }

          .function-name {
            font-weight: 500;
            font-family: 'Fira Code', Consolas, monospace;
          }

          .function-desc {
            font-size: 12px;
            color: #606266;
            margin-bottom: 4px;
          }

          .function-usage {
            font-size: 11px;
            color: #909399;
            font-family: 'Fira Code', Consolas, monospace;
            background: #f5f5f5;
            padding: 2px 4px;
            border-radius: 2px;
          }
        }

        .operator-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
          gap: 8px;

          .operator-item {
            padding: 8px 4px;
            border: 1px solid #e4e7ed;
            border-radius: 4px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;

            &:hover {
              border-color: #409eff;
              background: rgba(64, 158, 255, 0.05);
            }

            .operator-symbol {
              font-weight: 600;
              font-family: 'Fira Code', Consolas, monospace;
              margin-bottom: 2px;
            }

            .operator-name {
              font-size: 10px;
              color: #606266;
            }
          }
        }

        .template-item {
          padding: 12px;
          border: 1px solid #e4e7ed;
          border-radius: 6px;
          margin-bottom: 12px;
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            border-color: #409eff;
            background: rgba(64, 158, 255, 0.05);
          }

          .template-header {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 6px;

            .template-icon {
              color: #409eff;
            }

            .template-name {
              font-weight: 500;
            }
          }

          .template-desc {
            font-size: 12px;
            color: #606266;
            margin-bottom: 4px;
          }

          .template-example {
            font-size: 11px;
            color: #909399;
            font-family: 'Fira Code', Consolas, monospace;
            background: #f5f5f5;
            padding: 4px 6px;
            border-radius: 3px;
          }
        }
      }
    }

    .editor-main {
      height: 100%;
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      display: flex;
      flex-direction: column;

      .editor-toolbar {
        padding: 12px 16px;
        border-bottom: 1px solid #e4e7ed;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .toolbar-left,
        .toolbar-right {
          display: flex;
          gap: 8px;
        }
      }

      .visual-editor {
        flex: 1;
        min-height: 200px;

        .editor-canvas {
          height: 100%;
          padding: 16px;
          border: 2px dashed transparent;
          transition: all 0.3s;
          overflow-y: auto;

          &.drag-over {
            border-color: #409eff;
            background: rgba(64, 158, 255, 0.05);
          }

          .empty-canvas {
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

          .expression-workspace {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            align-items: center;
            min-height: 100px;
          }
        }
      }

      .text-editor {
        border-top: 1px solid #e4e7ed;

        .editor-header {
          padding: 8px 16px;
          background: #f8f9fa;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          font-weight: 500;
        }

        .text-input {
          :deep(.el-textarea__inner) {
            border: none;
            border-radius: 0;
            font-family: 'Fira Code', Consolas, monospace;
          }
        }
      }

      .expression-preview {
        border-top: 1px solid #e4e7ed;
        background: #f8f9fa;

        .preview-header {
          padding: 8px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          font-weight: 500;
        }

        .preview-content {
          padding: 8px 16px;

          .expression-code {
            font-family: 'Fira Code', Consolas, monospace;
            background: #2d3748;
            color: #e2e8f0;
            padding: 8px 12px;
            border-radius: 4px;
            display: block;
            overflow-x: auto;
          }
        }
      }
    }

    .editor-properties {
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 16px;

      .property-panel,
      .validation-panel,
      .compilation-panel {
        border: 1px solid #e4e7ed;
        border-radius: 8px;
        background: white;

        .panel-header {
          padding: 12px 16px;
          background: #f8f9fa;
          border-bottom: 1px solid #e4e7ed;
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;

          .header-icon {
            color: #409eff;
          }
        }

        .panel-content {
          padding: 16px;
          max-height: 300px;
          overflow-y: auto;
        }

        .empty-properties,
        .empty-validation,
        .empty-compilation {
          padding: 40px 16px;
          text-align: center;
          color: #909399;

          .empty-icon {
            font-size: 32px;
            margin-bottom: 8px;
          }
        }
      }

      .validation-panel {
        .error-list,
        .warning-list,
        .suggestion-list {
          margin-top: 12px;

          .error-title,
          .warning-title,
          .suggestion-title {
            font-weight: 500;
            margin-bottom: 6px;
          }

          ul {
            margin: 0;
            padding-left: 16px;

            .error-item {
              color: #f56c6c;
              margin: 4px 0;
            }

            .warning-item {
              color: #e6a23c;
              margin: 4px 0;
            }

            .suggestion-item {
              color: #409eff;
              margin: 4px 0;
            }
          }
        }
      }

      .compilation-panel {
        .sql-result {
          margin-top: 12px;

          .sql-title {
            font-weight: 500;
            margin-bottom: 8px;
          }

          .sql-content {
            background: #2d3748;
            border-radius: 4px;
            padding: 12px;
            margin-bottom: 8px;

            pre code {
              color: #e2e8f0;
              font-family: 'Fira Code', Consolas, monospace;
              line-height: 1.4;
            }
          }
        }

        .used-resources {
          margin-top: 12px;

          .resource-title {
            font-weight: 500;
            margin-bottom: 6px;
          }

          .resource-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
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
      flex: 1;
    }

    .footer-right {
      display: flex;
      gap: 12px;
    }
  }
}

// 响应式调整
@media (max-width: 768px) {
  .expression-editor-dialog {
    .editor-container {
      height: 60vh;

      .el-row .el-col {
        margin-bottom: 16px;
      }

      .editor-main {
        .editor-toolbar {
          flex-direction: column;
          gap: 8px;
          align-items: stretch;
        }

        .visual-editor .editor-canvas {
          padding: 12px;
        }
      }

      .editor-properties {
        .property-panel,
        .validation-panel,
        .compilation-panel {
          .panel-content {
            max-height: 200px;
          }
        }
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
