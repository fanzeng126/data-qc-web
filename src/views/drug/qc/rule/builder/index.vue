<template>
  <div class="qc-rule-builder">
    <!-- 顶部导航栏 -->
    <div class="builder-header">
      <div class="header-left">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item to="/drug/qc-rules">质控规则管理</el-breadcrumb-item>
          <el-breadcrumb-item>{{ isEdit ? '编辑规则' : '新建规则' }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="header-right">
        <el-button @click="handlePreview" :disabled="!hasExpression">
          <Icon icon="ep:view" class="mr-5px" />
          预览表达式
        </el-button>
        <el-button @click="handleTest" :disabled="!hasExpression">
          <Icon icon="ep:cpu" class="mr-5px" />
          测试规则
        </el-button>
        <el-button @click="handleSaveDraft" :loading="saving">
          <Icon icon="ep:document" class="mr-5px" />
          保存草稿
        </el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          <Icon icon="ep:check" class="mr-5px" />
          保存规则
        </el-button>
      </div>
    </div>

    <div class="builder-body">
      <!-- 左侧工具栏 -->
      <div class="builder-sidebar">
        <el-tabs v-model="activeTab" class="sidebar-tabs">
          <!-- 数据源面板 -->
          <el-tab-pane label="数据源" name="datasource">
            <div class="tool-panel">
              <div class="panel-body">
                <!-- 搜索栏和刷新按钮放在一行 -->
                <div class="search-row">
                  <el-input
                    v-model="dataSourceFilter"
                    placeholder="搜索表或字段"
                    clearable
                    size="small"
                    class="search-input"
                  >
                    <template #prefix>
                      <Icon icon="ep:search" />
                    </template>
                  </el-input>
                  <el-button
                    size="small"
                    text
                    @click="refreshDataSource"
                    :loading="loadingDataSource"
                    class="refresh-btn"
                  >
                    <Icon icon="ep:refresh" />
                  </el-button>
                </div>

                <div class="tree-container">
                  <el-tree
                    ref="dataSourceTreeRef"
                    :data="dataSourceTreeData"
                    :props="treeProps"
                    :filter-node-method="filterDataSourceNode"
                    node-key="id"
                    :default-expand-all="false"
                    :expand-on-click-node="false"
                    draggable
                    @node-drag-start="handleDragStart"
                  >
                    <template #default="{ node, data }">
                      <div v-if="node && data" class="tree-node" :class="data.type">
                        <Icon :icon="getNodeIcon(data)" class="node-icon" />
                        <div class="node-content">
                          <span class="node-label">{{ node.label }}</span>
                          <!-- 显示英文名称 -->
                          <span v-if="data.tableName || data.fieldName" class="english-name">
                            {{ data.tableName || data.fieldName }}
                          </span>
                          <!-- 字段类型 -->
                          <span v-if="data.type === 'field'" class="field-type">{{
                            data.dataType || data.fieldType
                          }}</span>
                        </div>
                      </div>
                    </template>
                  </el-tree>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 函数库面板 -->
          <el-tab-pane label="函数库" name="functions">
            <div class="tool-panel">
              <div class="panel-body">
                <!-- 搜索栏和刷新按钮放在一行 -->
                <div class="search-row">
                  <el-input
                    v-model="functionFilter"
                    placeholder="搜索函数"
                    clearable
                    size="small"
                    class="search-input"
                  >
                    <template #prefix>
                      <Icon icon="ep:search" />
                    </template>
                  </el-input>
                  <el-button size="small" text @click="refreshFunctions" class="refresh-btn">
                    <Icon icon="ep:refresh" />
                  </el-button>
                </div>

                <div class="function-container">
                  <el-collapse v-model="activeFunctionCategories" accordion>
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
                          @click="handleFunctionClick(func)"
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
              </div>
            </div>
          </el-tab-pane>

          <!-- 操作符面板 -->
          <el-tab-pane label="操作符" name="operators">
            <div class="tool-panel">
              <div class="panel-body">
                <div class="operator-container">
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
                          draggable
                          @dragstart="handleOperatorDragStart($event, operator)"
                          @click="handleOperatorClick(operator)"
                        >
                          <div class="operator-symbol">{{ operator.operatorSymbol }}</div>
                          <div class="operator-name">{{ operator.chineseName }}</div>
                          <!-- 近似等于操作符的特殊处理 -->
                          <div
                            v-if="
                              operator.operatorSymbol === '≈' || operator.operatorSymbol === '≉'
                            "
                            class="tolerance-hint"
                          >
                            支持误差范围
                          </div>
                        </div>
                      </div>
                    </el-collapse-item>
                  </el-collapse>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- 中间工作区 -->
      <div class="builder-main">
        <!-- 规则基本信息 -->
        <div class="rule-basic-info">
          <el-form :model="ruleForm" :rules="ruleRules" ref="ruleFormRef" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="规则编码" prop="ruleCode">
                  <el-input v-model="ruleForm.ruleCode" placeholder="自动生成或手动输入" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="规则名称" prop="ruleName">
                  <el-input v-model="ruleForm.ruleName" placeholder="请输入规则名称" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="规则类型" prop="ruleType">
                  <el-select v-model="ruleForm.ruleType" placeholder="请选择">
                    <el-option label="前置质控" :value="1" />
                    <el-option label="后置质控" :value="2" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="检查维度" prop="checkDimension">
                  <el-select v-model="ruleForm.checkDimension" placeholder="请选择">
                    <el-option label="全局维度" value="GLOBAL" />
                    <el-option label="机构维度" value="ORGANIZATION" />
                    <el-option label="记录维度" value="RECORD" />
                    <el-option label="省份维度" value="PROVINCE" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="优先级" prop="priority">
                  <el-input-number v-model="ruleForm.priority" :min="1" :max="999" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <!-- 条件组构建区 -->
        <div class="condition-groups-builder">
          <div class="section-header">
            <span>条件组配置</span>
            <el-button type="primary" size="small" @click="addConditionGroup">
              <Icon icon="ep:plus" class="mr-5px" />
              添加条件组
            </el-button>
          </div>

          <div class="condition-groups">
            <div
              v-for="(group, index) in conditionGroups"
              :key="group.id"
              class="condition-group"
              :class="{ active: activeGroupIndex === index }"
              @click="setActiveGroup(index)"
            >
              <div class="group-header">
                <div class="group-title">
                  <span>{{ group.groupName || `条件组 ${index + 1}` }}</span>
                  <el-tag size="small" :type="getActionType(group.executeAction)">
                    {{ getActionText(group.executeAction) }}
                  </el-tag>
                </div>
                <div class="group-actions">
                  <el-button size="small" text @click.stop="duplicateGroup(index)">
                    <Icon icon="ep:document-copy" />
                  </el-button>
                  <el-button size="small" text @click.stop="removeGroup(index)">
                    <Icon icon="ep:delete" />
                  </el-button>
                </div>
              </div>

              <!-- 表达式构建画布 -->
              <div
                class="expression-canvas"
                @drop="handleDrop($event, group.id)"
                @dragover="handleDragOver"
                @dragleave="handleDragLeave"
              >
                <div
                  v-if="!group.expressionComponents || !group.expressionComponents.length"
                  class="empty-canvas"
                >
                  <Icon icon="ep:mouse" class="empty-icon" />
                  <p>拖拽字段、函数或操作符到此处开始构建表达式</p>
                </div>

                <div v-else class="expression-components">
                  <!-- 表达式组件显示 -->
                  <div
                    v-for="(component, compIndex) in group.expressionComponents"
                    :key="`${group.id}-${compIndex}`"
                    class="expression-component"
                    :class="component.type"
                  >
                    <div class="component-content">
                      <Icon :icon="getComponentIcon(component)" class="component-icon" />
                      <span class="component-label">{{ component.label || component.value }}</span>

                      <!-- 近似等于操作符的误差范围配置 -->
                      <div
                        v-if="
                          (component.value === '≈' || component.value === '≉') &&
                          component.showTolerance
                        "
                        class="tolerance-config"
                      >
                        <el-input
                          v-model="component.tolerance"
                          placeholder="±0.1"
                          size="small"
                          style="width: 80px; margin-left: 8px"
                          @click.stop
                        />
                      </div>
                    </div>

                    <div class="component-actions">
                      <el-button
                        size="small"
                        text
                        type="primary"
                        @click.stop="editComponent(group.id, compIndex)"
                      >
                        <Icon icon="ep:edit" />
                      </el-button>
                      <el-button
                        size="small"
                        text
                        type="danger"
                        @click.stop="removeComponent(group.id, compIndex)"
                      >
                        <Icon icon="ep:close" />
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 表达式预览 -->
              <div
                v-if="group.expressionComponents && group.expressionComponents.length"
                class="expression-preview"
              >
                <div class="preview-header">
                  <span>表达式预览：</span>
                  <el-button size="small" text @click="compileExpression(group)">
                    <Icon icon="ep:cpu" class="mr-5px" />
                    编译检查
                  </el-button>
                </div>
                <div class="preview-content">
                  <code>{{ generateExpressionText(group.expressionComponents) }}</code>
                </div>
                <div v-if="group.compilationResult" class="compilation-result">
                  <el-alert
                    :type="group.compilationResult.isValid ? 'success' : 'error'"
                    :title="group.compilationResult.isValid ? '表达式语法正确' : '表达式语法错误'"
                    :description="group.compilationResult.message"
                    show-icon
                    :closable="false"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧配置面板 -->
      <div class="builder-aside">
        <div v-if="activeGroup" class="config-panel">
          <div class="panel-header">
            <span>条件组配置</span>
          </div>
          <div class="panel-body">
            <el-form :model="activeGroup" label-width="80px" size="small">
              <el-form-item label="组名称">
                <el-input v-model="activeGroup.groupName" placeholder="请输入条件组名称" />
              </el-form-item>

              <el-form-item label="优先级">
                <el-input-number
                  v-model="activeGroup.priority"
                  :min="1"
                  :max="999"
                  controls-position="right"
                />
              </el-form-item>

              <el-form-item label="执行动作">
                <el-select v-model="activeGroup.executeAction" placeholder="请选择">
                  <el-option label="记录错误，统一返回" value="RECORD_ERROR" />
                  <el-option label="直接中断，立即退回" value="INTERRUPT" />
                  <el-option label="标记异常数据" value="MARK_ANOMALY" />
                  <el-option label="警告标记" value="WARNING" />
                  <el-option label="跳过检查" value="SKIP" />
                </el-select>
              </el-form-item>

              <el-form-item label="错误信息">
                <el-input
                  v-model="activeGroup.errorMessageTemplate"
                  type="textarea"
                  :rows="3"
                  placeholder="支持变量模板，如：${tableName}的字段${fieldName}不能为空"
                />
                <div class="template-help">
                  <el-popover placement="top" :width="300" trigger="click">
                    <template #reference>
                      <el-button text size="small" class="mt-5px">
                        <Icon icon="ep:question-filled" class="mr-5px" />
                        变量说明
                      </el-button>
                    </template>
                    <div class="variable-help">
                      <p><strong>可用变量：</strong></p>
                      <ul>
                        <li><code>${tableName}</code> - 表名</li>
                        <li><code>${fieldName}</code> - 字段名</li>
                        <li><code>${functionName.result}</code> - 函数返回值</li>
                        <li><code>${COUNT.result}</code> - 计数结果</li>
                        <li><code>${HAS_NULL_FIELDS.nullFieldsList}</code> - 空值字段列表</li>
                      </ul>
                    </div>
                  </el-popover>
                </div>
              </el-form-item>

              <el-form-item label="描述">
                <el-input
                  v-model="activeGroup.description"
                  type="textarea"
                  :rows="2"
                  placeholder="条件组的详细描述"
                />
              </el-form-item>
            </el-form>
          </div>
        </div>

        <div v-else class="empty-config">
          <Icon icon="ep:setting" class="empty-icon" />
          <p>请选择一个条件组进行配置</p>
        </div>
      </div>
    </div>

    <!-- 表达式预览对话框 -->
    <!-- 暂时注释掉对话框组件，避免组件引用问题 -->
    <!--
    <ExpressionPreviewDialog
      v-model="showPreviewDialog"
      :rule-form="ruleForm"
      :condition-groups="conditionGroups"
    />

    <RuleTestDialog
      v-model="showTestDialog"
      :rule-form="ruleForm"
      :condition-groups="conditionGroups"
    />
    -->
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'

// 暂时注释掉可能导致问题的组件导入
// import ExpressionComponent from './components/ExpressionComponent.vue'
// import ExpressionPreviewDialog from './components/ExpressionPreviewDialog.vue'
// import RuleTestDialog from './components/RuleTestDialog.vue'

import {
  getDataSourceCategories,
  createQcRule,
  updateQcRule,
  getQcRule
} from '@/api/drug/qc/rule/builder'

import { QcFunctionConfigApi, QcOperatorConfigApi, QcExpressionApi } from '@/api/drug/qc/builder'

// 路由和基础状态
const route = useRoute()
const isEdit = computed(() => !!route.params.id)
const saving = ref(false)

// 侧边栏状态
const activeTab = ref('datasource')
const loadingDataSource = ref(false)
const dataSourceFilter = ref('')
const functionFilter = ref('')
const activeFunctionCategories = ref(['STATISTICS'])
const activeOperatorCategories = ref(['COMPARISON'])

// 组件引用
const dataSourceTreeRef = ref()
const ruleFormRef = ref()

// 规则表单
const ruleForm = reactive({
  id: null,
  ruleCode: '',
  ruleName: '',
  ruleType: 1,
  checkDimension: 'RECORD',
  ruleCategory: 'FIELD',
  priority: 1,
  executeAction: 'RECORD_ERROR',
  enabled: 1
})

const ruleRules = {
  ruleName: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  ruleType: [{ required: true, message: '请选择规则类型', trigger: 'change' }],
  checkDimension: [{ required: true, message: '请选择检查维度', trigger: 'change' }]
}

// 条件组数据
const conditionGroups = ref([])
const activeGroupIndex = ref(-1)

const activeGroup = computed(() => {
  return activeGroupIndex.value >= 0 && conditionGroups.value[activeGroupIndex.value]
    ? conditionGroups.value[activeGroupIndex.value]
    : null
})

const hasExpression = computed(() => {
  return conditionGroups.value.some(
    (group) => group.expressionComponents && group.expressionComponents.length > 0
  )
})

// 数据源树数据
const dataSourceTreeData = ref([])
const treeProps = {
  children: 'children',
  label: 'label'
}

// 函数库数据
const functionCategories = ref([])
const filteredFunctionCategories = computed(() => {
  if (!functionFilter.value) return functionCategories.value

  return functionCategories.value
    .map((category) => ({
      ...category,
      functions: category.functions.filter(
        (func) =>
          func.functionName.toLowerCase().includes(functionFilter.value.toLowerCase()) ||
          func.chineseName.includes(functionFilter.value)
      )
    }))
    .filter((category) => category.functions.length > 0)
})

// 操作符数据 - 添加近似等于操作符
const operatorCategories = ref([])

// 对话框状态
const showPreviewDialog = ref(false)
const showTestDialog = ref(false)

// 初始化
onMounted(async () => {
  try {
    await Promise.all([loadDataSource(), loadFunctions(), loadOperators()])

    if (isEdit.value) {
      await loadRuleData(route.params.id)
    } else {
      addConditionGroup()
    }
  } catch (error) {
    console.error('初始化失败:', error)
    ElMessage.error('页面初始化失败')
  }
})

// 数据加载方法 - 优化版，直接使用树形数据
const loadDataSource = async () => {
  try {
    loadingDataSource.value = true
    const { treeData: response } = await getDataSourceCategories()

    // 直接使用返回的树形数据，但需要转换字段名以符合组件需求
    const treeData = processTreeData(response || [])

    dataSourceTreeData.value = treeData
    console.log(dataSourceTreeData.value)
  } catch (error) {
    console.error('加载数据源失败:', error)
    ElMessage.error('加载数据源失败')
  } finally {
    loadingDataSource.value = false
  }
}

// 处理树形数据，转换字段名并添加必要属性
const processTreeData = (treeData) => {
  return treeData.map((node) => {
    const processedNode = {
      id: node.id,
      label: node.label,
      type: node.type,
      icon: node.icon,
      description: node.description,
      isActive: node.isActive,
      sortOrder: node.sortOrder,
      // 保留原有字段
      categoryCode: node.categoryCode,
      tableName: node.tableName,
      fieldName: node.fieldName,
      fieldType: node.fieldType,
      // 为了兼容现有逻辑，添加一些字段映射
      dataType: node.fieldType, // 字段类型映射
      isRequired: node.fieldName ? true : undefined // 字段是否必填，这里可以根据实际情况调整
    }

    // 递归处理子节点
    if (node.children && node.children.length > 0) {
      processedNode.children = processTreeData(node.children)
    }

    return processedNode
  })
}

const loadFunctions = async () => {
  try {
    const data = await QcFunctionConfigApi.getFunctionConfigs()

    // 按分类分组
    const categoryMap = new Map()
    if (data && Array.isArray(data)) {
      data.forEach((func) => {
        if (!categoryMap.has(func.functionCategory)) {
          categoryMap.set(func.functionCategory, {
            name: getCategoryName(func.functionCategory),
            functions: []
          })
        }
        categoryMap.get(func.functionCategory).functions.push(func)
      })
    }

    functionCategories.value = Array.from(categoryMap.values())
  } catch (error) {
    console.error('加载函数库失败:', error)
    ElMessage.error('加载函数库失败')
  }
}

const loadOperators = async () => {
  try {
    const data = await QcOperatorConfigApi.getOperatorConfigs()

    // 按分类分组
    const categoryMap = new Map()
    if (data && Array.isArray(data)) {
      data.forEach((operator) => {
        if (!categoryMap.has(operator.operatorCategory)) {
          categoryMap.set(operator.operatorCategory, {
            name: getCategoryName(operator.operatorCategory),
            operators: []
          })
        }
        categoryMap.get(operator.operatorCategory).operators.push(operator)
      })
    }

    // 添加近似等于操作符
    if (!categoryMap.has('APPROXIMATION')) {
      categoryMap.set('APPROXIMATION', {
        name: '近似比较',
        operators: []
      })
    }

    const approximationCategory = categoryMap.get('APPROXIMATION')
    approximationCategory.operators.push(
      {
        id: 'approx_equal',
        operatorSymbol: '≈',
        chineseName: '近似等于',
        operatorCategory: 'APPROXIMATION',
        supportsTolerance: true
      },
      {
        id: 'not_approx_equal',
        operatorSymbol: '≉',
        chineseName: '不近似等于',
        operatorCategory: 'APPROXIMATION',
        supportsTolerance: true
      }
    )

    operatorCategories.value = Array.from(categoryMap.values())
  } catch (error) {
    console.error('加载操作符失败:', error)
    ElMessage.error('加载操作符失败')
  }
}

const loadRuleData = async (ruleId) => {
  try {
    const { data } = await getQcRule(ruleId)
    Object.assign(ruleForm, data)

    if (data.conditionGroups && data.conditionGroups.length > 0) {
      conditionGroups.value = data.conditionGroups.map((group) => ({
        ...group,
        expressionComponents: parseExpressionJson(group.expressionJson) || []
      }))
      activeGroupIndex.value = 0
    }
  } catch (error) {
    console.error('加载规则数据失败:', error)
    ElMessage.error('加载规则数据失败')
    // router.push('/drug/qc-rules')
  }
}

// 条件组操作
const addConditionGroup = () => {
  const newGroup = {
    id: Date.now(),
    groupName: `条件组 ${conditionGroups.value.length + 1}`,
    priority: conditionGroups.value.length + 1,
    executeAction: 'RECORD_ERROR',
    errorMessageTemplate: '',
    description: '',
    expressionComponents: [],
    compilationResult: null
  }

  conditionGroups.value.push(newGroup)
  activeGroupIndex.value = conditionGroups.value.length - 1
}

const removeGroup = (index) => {
  if (conditionGroups.value.length === 1) {
    ElMessage.warning('至少需要保留一个条件组')
    return
  }

  conditionGroups.value.splice(index, 1)
  if (activeGroupIndex.value >= index) {
    activeGroupIndex.value = Math.max(0, activeGroupIndex.value - 1)
  }
}

const duplicateGroup = (index) => {
  const originalGroup = conditionGroups.value[index]
  if (!originalGroup) return

  const newGroup = {
    ...originalGroup,
    id: Date.now(),
    groupName: `${originalGroup.groupName} (副本)`,
    expressionComponents: JSON.parse(JSON.stringify(originalGroup.expressionComponents || []))
  }

  conditionGroups.value.splice(index + 1, 0, newGroup)
  activeGroupIndex.value = index + 1
}

const setActiveGroup = (index) => {
  activeGroupIndex.value = index
}

// 判断节点是否可拖拽
const isDraggableNode = (node) => {
  if (!node || !node.data) return false
  const nodeType = node.data.type
  // 只允许表、字段拖拽，分类不允许拖拽
  return nodeType === 'table' || nodeType === 'field'
}

// 拖拽处理
const handleDragStart = (event, node) => {
  if (!node || !node.data) return

  // 检查是否允许拖拽
  if (!isDraggableNode(node)) {
    event.preventDefault()
    return
  }

  event.dataTransfer.setData(
    'application/json',
    JSON.stringify({
      type: 'datasource',
      nodeType: node.data.type,
      data: node.data
    })
  )
}

const handleFunctionDragStart = (event, func) => {
  event.dataTransfer.setData(
    'application/json',
    JSON.stringify({
      type: 'function',
      data: func
    })
  )
  // 设置拖拽效果
  event.dataTransfer.effectAllowed = 'copy'
}

const handleOperatorDragStart = (event, operator) => {
  event.dataTransfer.setData(
    'application/json',
    JSON.stringify({
      type: 'operator',
      data: operator
    })
  )
  // 设置拖拽效果
  event.dataTransfer.effectAllowed = 'copy'
}

const handleDrop = (event, groupId) => {
  event.preventDefault()
  event.currentTarget.classList.remove('drag-over')

  try {
    const dragDataString = event.dataTransfer.getData('application/json')

    // 检查是否有有效的拖拽数据
    if (!dragDataString || dragDataString.trim() === '') {
      console.warn('拖拽数据为空')
      return
    }

    const dragData = JSON.parse(dragDataString)
    const group = conditionGroups.value.find((g) => g.id === groupId)

    if (!group) {
      console.warn('未找到目标条件组')
      return
    }

    // 确保 expressionComponents 存在
    if (!group.expressionComponents) {
      group.expressionComponents = []
    }

    let component = null

    switch (dragData.type) {
      case 'datasource':
        if (dragData.nodeType === 'field') {
          component = {
            type: 'field',
            value: `${dragData.data.tableName || ''}.${dragData.data.fieldName || ''}`,
            label: dragData.data.label || '',
            dataType: dragData.data.dataType || dragData.data.fieldType || ''
          }
        } else if (dragData.nodeType === 'table') {
          component = {
            type: 'table',
            value: dragData.data.tableName || '',
            label: dragData.data.label || ''
          }
        }
        break

      case 'function':
        component = {
          type: 'function',
          value: dragData.data.functionName || '',
          label: dragData.data.chineseName || dragData.data.displayName || '',
          parameters: [],
          config: dragData.data
        }
        break

      case 'operator':
        component = {
          type: 'operator',
          value: dragData.data.operatorSymbol || '',
          label: dragData.data.chineseName || dragData.data.displayName || '',
          config: dragData.data,
          // 近似等于操作符的特殊处理
          showTolerance: dragData.data.supportsTolerance || false,
          tolerance: dragData.data.supportsTolerance ? '±0.1' : undefined
        }
        break

      default:
        console.warn('未知的拖拽类型:', dragData.type)
        return
    }

    if (component && component.value) {
      group.expressionComponents.push(component)
      console.log('成功添加组件:', component)
      ElMessage.success(`已添加${component.label || component.value}`)
    } else {
      console.warn('创建组件失败，数据不完整:', dragData)
      ElMessage.warning('拖拽失败：数据不完整')
    }
  } catch (error) {
    console.error('拖拽数据解析失败:', error)
    ElMessage.error('拖拽失败：数据解析错误')
  }
}

const handleDragOver = (event) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'copy'
  event.currentTarget.classList.add('drag-over')
}

const handleDragLeave = (event) => {
  // 只有当鼠标真正离开容器时才移除样式
  if (!event.currentTarget.contains(event.relatedTarget)) {
    event.currentTarget.classList.remove('drag-over')
  }
}

// 工具方法
const getNodeIcon = (data) => {
  if (!data) return 'ep:document'

  // 优先使用数据中的图标
  if (data.icon) {
    return data.icon
  }

  switch (data.type) {
    case 'category':
      return 'fa-solid:database'
    case 'table':
      return 'ep:grid'
    case 'field':
      return 'ep:key'
    default:
      return 'ep:document'
  }
}

const getComponentIcon = (component) => {
  switch (component.type) {
    case 'field':
      return 'ep:key'
    case 'table':
      return 'ep:grid'
    case 'function':
      return 'ep:cpu'
    case 'operator':
      return 'ep:operation'
    default:
      return 'ep:document'
  }
}

const getFunctionLevelType = (level) => {
  const types = { 1: 'info', 2: 'warning', 3: 'danger' }
  return types[level] || 'info'
}

const getFunctionLevelText = (level) => {
  const texts = { 1: '基础', 2: '高级', 3: '专家' }
  return texts[level] || ''
}

const getActionType = (action) => {
  const types = {
    RECORD_ERROR: 'danger',
    INTERRUPT: 'danger',
    MARK_ANOMALY: 'warning',
    WARNING: 'warning',
    SKIP: 'info'
  }
  return types[action] || ''
}

const getActionText = (action) => {
  const texts = {
    RECORD_ERROR: '记录错误',
    INTERRUPT: '直接中断',
    MARK_ANOMALY: '标记异常',
    WARNING: '警告',
    SKIP: '跳过'
  }
  return texts[action] || action
}

const getCategoryName = (category) => {
  const names = {
    STATISTICS: '统计函数',
    STRING: '字符串函数',
    NULL_CHECK: '空值检查',
    NUMERIC: '数值函数',
    TIME: '时间函数',
    ANALYSIS: '分析函数',
    COMPARISON: '比较操作符',
    LOGICAL: '逻辑操作符',
    SET: '集合操作符',
    PATTERN: '模式匹配',
    ARITHMETIC: '算术操作符',
    RANGE: '范围操作符',
    APPROXIMATION: '近似比较'
  }
  return names[category] || category
}

// 其他方法
const refreshDataSource = () => loadDataSource()
const refreshFunctions = () => loadFunctions()

const filterDataSourceNode = (value, data) => {
  if (!value || !data) return true
  return (
    data.label.includes(value) ||
    (data.tableName && data.tableName.includes(value)) ||
    (data.fieldName && data.fieldName.includes(value))
  )
}

const handleFunctionClick = (func) => {
  // 点击函数时的处理逻辑
  console.log('函数点击:', func)
}

const handleOperatorClick = (operator) => {
  // 点击操作符时的处理逻辑
  console.log('操作符点击:', operator)
}

const editComponent = (groupId, compIndex) => {
  const group = conditionGroups.value.find((g) => g.id === groupId)
  if (group && group.expressionComponents && group.expressionComponents[compIndex]) {
    const component = group.expressionComponents[compIndex]
    // 对于近似等于操作符，切换显示误差范围输入
    if (component.value === '≈' || component.value === '≉') {
      component.showTolerance = !component.showTolerance
      if (component.showTolerance && !component.tolerance) {
        component.tolerance = '±0.1'
      }
    }
  }
}

const updateComponent = (groupId, compIndex, newComponent) => {
  const group = conditionGroups.value.find((g) => g.id === groupId)
  if (group && group.expressionComponents) {
    group.expressionComponents[compIndex] = newComponent
  }
}

const removeComponent = (groupId, compIndex) => {
  const group = conditionGroups.value.find((g) => g.id === groupId)
  if (group && group.expressionComponents) {
    group.expressionComponents.splice(compIndex, 1)
  }
}

const insertComponent = (groupId, compIndex, component) => {
  const group = conditionGroups.value.find((g) => g.id === groupId)
  if (group && group.expressionComponents) {
    group.expressionComponents.splice(compIndex + 1, 0, component)
  }
}

const generateExpressionText = (components) => {
  if (!components || !Array.isArray(components)) return ''

  return components
    .map((comp) => {
      if (comp.type === 'function') {
        const params = comp.parameters ? comp.parameters.map((p) => p.value).join(', ') : ''
        return `${comp.value}(${params})`
      } else if (comp.type === 'operator' && comp.tolerance) {
        return `${comp.value}(${comp.tolerance})`
      }
      return comp.value || comp.label || ''
    })
    .join(' ')
}

const compileExpression = async (group) => {
  try {
    const expressionJson = {
      type: 'expression',
      components: group.expressionComponents || []
    }

    const data = await QcExpressionApi.compileRuleExpression({
      expressionJson,
      tableName: 'temp_table'
    })

    group.compilationResult = {
      isValid: data.isValid,
      message: data.isValid
        ? '表达式语法正确'
        : data.errors && data.errors.length > 0
          ? data.errors.map((err) => err.errorDescription).join('; ')
          : '编译失败'
    }
  } catch (error) {
    group.compilationResult = {
      isValid: false,
      message: '编译失败: ' + error.message
    }
  }
}

const parseExpressionJson = (expressionJson) => {
  try {
    if (typeof expressionJson === 'string') {
      return JSON.parse(expressionJson).components || []
    }
    return expressionJson?.components || []
  } catch (error) {
    console.error('解析表达式JSON失败:', error)
    return []
  }
}

// 主要操作方法
const handlePreview = () => {
  // 暂时简单处理
  ElMessage.info('表达式预览功能正在开发中')
  // showPreviewDialog.value = true
}

const handleTest = () => {
  // 暂时简单处理
  ElMessage.info('规则测试功能正在开发中')
  // showTestDialog.value = true
}

const handleSaveDraft = async () => {
  ElMessage.success('草稿保存成功')
}

const handleSave = async () => {
  try {
    saving.value = true

    // 构建完整的规则数据
    const ruleData = {
      ...ruleForm,
      conditionGroups: conditionGroups.value.map((group) => ({
        ...group,
        expressionJson: {
          type: 'expression',
          components: group.expressionComponents || []
        },
        groupExpression: generateExpressionText(group.expressionComponents || [])
      }))
    }

    if (isEdit.value) {
      await updateQcRule(ruleData)
      ElMessage.success('规则更新成功')
    } else {
      await createQcRule(ruleData)
      ElMessage.success('规则创建成功')
    }

    // router.push('/drug/qc-rules')
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败: ' + error.message)
  } finally {
    saving.value = false
  }
}

// 监听数据源过滤
watch(dataSourceFilter, (val) => {
  nextTick(() => {
    if (dataSourceTreeRef.value) {
      dataSourceTreeRef.value.filter(val)
    }
  })
})
</script>

<style lang="scss" scoped>
.qc-rule-builder {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;

  .builder-header {
    height: 60px;
    background: white;
    border-bottom: 1px solid #e4e7ed;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    .header-left {
      flex: 1;
    }

    .header-right {
      display: flex;
      gap: 12px;
    }
  }

  .builder-body {
    flex: 1;
    display: flex;
    overflow: hidden;

    .builder-sidebar {
      width: 320px;
      background: white;
      border-right: 1px solid #e4e7ed;
      display: flex;
      flex-direction: column;

      .tool-panel {
        height: 100%;
        display: flex;
        flex-direction: column;

        .panel-header {
          padding: 16px;
          border-bottom: 1px solid #e4e7ed;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-weight: 500;
        }

        .panel-body {
          flex: 1;
          padding: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;

          /* 搜索栏和刷新按钮一行布局 */
          .search-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
            flex-shrink: 0;

            .search-input {
              flex: 1;
            }

            .refresh-btn {
              flex-shrink: 0;
            }
          }

          /* 容器支持滚动 */
          .tree-container,
          .function-container,
          .operator-container {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;

            /* 自定义滚动条样式 */
            &::-webkit-scrollbar {
              width: 6px;
            }

            &::-webkit-scrollbar-track {
              background: #f1f1f1;
              border-radius: 3px;
            }

            &::-webkit-scrollbar-thumb {
              background: #c1c1c1;
              border-radius: 3px;

              &:hover {
                background: #a8a8a8;
              }
            }
          }
        }
      }
    }

    .builder-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .rule-basic-info {
        background: white;
        padding: 20px;
        border-bottom: 1px solid #e4e7ed;
      }

      .condition-groups-builder {
        flex: 1;
        padding: 20px;
        overflow-y: auto;

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          font-size: 16px;
          font-weight: 500;
        }

        .condition-groups {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .condition-group {
          background: white;
          border: 2px solid #e4e7ed;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s;

          &.active {
            border-color: #409eff;
            box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
          }

          .group-header {
            padding: 16px;
            background: #f8f9fa;
            border-bottom: 1px solid #e4e7ed;
            display: flex;
            align-items: center;
            justify-content: space-between;

            .group-title {
              display: flex;
              align-items: center;
              gap: 8px;
              font-weight: 500;
            }

            .group-actions {
              display: flex;
              gap: 4px;
            }
          }

          .expression-canvas {
            min-height: 120px;
            padding: 16px;
            border: 2px dashed #d9d9d9;
            border-radius: 8px;
            transition: all 0.3s ease;
            position: relative;

            &.drag-over {
              border-color: #409eff;
              background-color: rgba(64, 158, 255, 0.08);
              box-shadow: inset 0 0 0 1px rgba(64, 158, 255, 0.2);

              &::before {
                content: '松开鼠标添加到表达式';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(64, 158, 255, 0.9);
                color: white;
                padding: 8px 16px;
                border-radius: 4px;
                font-size: 14px;
                z-index: 10;
                pointer-events: none;
              }
            }

            .empty-canvas {
              height: 100px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              color: #909399;

              .empty-icon {
                font-size: 32px;
                margin-bottom: 8px;
                opacity: 0.6;
              }

              p {
                margin: 0;
                font-size: 14px;
                text-align: center;
                line-height: 1.4;
              }
            }

            .expression-components {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
              align-items: center;
              min-height: 40px;
            }
          }

          .expression-component {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 8px 12px;
            background: #f0f0f0;
            border: 1px solid #d9d9d9;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s;

            &:hover {
              background: #e6f7ff;
              border-color: #409eff;
            }

            &.field {
              background: #e6f7ff;
              border-color: #91d5ff;
            }

            &.function {
              background: #f6ffed;
              border-color: #b7eb8f;
            }

            &.operator {
              background: #fff7e6;
              border-color: #ffd591;
            }

            .component-content {
              display: flex;
              align-items: center;
              gap: 4px;

              .component-icon {
                font-size: 14px;
              }

              .component-label {
                font-size: 13px;
                font-weight: 500;
              }

              .tolerance-config {
                display: flex;
                align-items: center;
              }
            }

            .component-actions {
              display: flex;
              gap: 2px;
              margin-left: 8px;
            }
          }
        }

        .expression-preview {
          padding: 16px;
          background: #f8f9fa;
          border-top: 1px solid #e4e7ed;

          .preview-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
            font-weight: 500;
          }

          .preview-content {
            background: #2d3748;
            color: #e2e8f0;
            padding: 12px;
            border-radius: 4px;
            font-family: 'Fira Code', Consolas, monospace;
            font-size: 14px;
            line-height: 1.5;
            overflow-x: auto;
          }

          .compilation-result {
            margin-top: 12px;
          }
        }
      }
    }
  }

  .builder-aside {
    width: 300px;
    background: white;
    border-left: 1px solid #e4e7ed;

    .config-panel {
      height: 100%;
      display: flex;
      flex-direction: column;

      .panel-header {
        padding: 16px;
        border-bottom: 1px solid #e4e7ed;
        font-weight: 500;
      }

      .panel-body {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
      }
    }

    .empty-config {
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
    }
  }
}

// 数据源树样式
.tree-node {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 4px 0; /* 增加表和字段间的间距 */
  cursor: default;

  &.draggable-node {
    cursor: grab;

    &:hover {
      background-color: rgba(64, 158, 255, 0.1);
      border-radius: 4px;
    }
  }

  .node-icon {
    margin-right: 8px;
    font-size: 14px;
    color: #409eff;
    flex-shrink: 0;
  }

  .node-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    flex: 1;
    min-width: 0;

    .node-main {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      margin-bottom: 2px;

      .node-label {
        font-weight: 500;
        font-size: 13px;
        line-height: 1.3;
        flex: 1;
        min-width: 0;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
      }

      .field-type {
        font-size: 11px;
        color: #909399;
        background: #f0f0f0;
        padding: 2px 6px;
        border-radius: 3px;
        margin-left: 8px;
        flex-shrink: 0;
        font-family: 'Fira Code', Consolas, monospace;
      }
    }

    .english-name {
      font-size: 11px;
      color: #909399;
      font-family: 'Fira Code', Consolas, monospace;
      line-height: 1.2;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      width: 100%;
    }
  }

  &.field {
    margin-left: 12px; /* 字段缩进 */

    .node-icon {
      color: #52c41a;
    }
  }

  &.table {
    margin-bottom: 4px; /* 表之间的间距 */

    .node-icon {
      color: #1890ff;
    }

    .node-label {
      font-weight: 600;
    }
  }

  &.category {
    margin-bottom: 6px; /* 分类间距 */

    .node-icon {
      color: #722ed1;
    }

    .node-label {
      font-weight: 600;
      color: #722ed1;
    }
  }
}

// 函数列表样式
.function-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.function-item {
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: #409eff;
    background-color: rgba(64, 158, 255, 0.05);
  }

  .function-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;

    .function-name {
      font-weight: 500;
      font-family: 'Fira Code', Consolas, monospace;
    }
  }

  .function-desc {
    font-size: 13px;
    color: #606266;
    margin-bottom: 4px;
  }

  .function-usage {
    font-size: 12px;
    color: #909399;
    font-family: 'Fira Code', Consolas, monospace;
    background: #f5f5f5;
    padding: 4px 8px;
    border-radius: 4px;
  }
}

// 操作符列表样式
.operator-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
}

.operator-item {
  padding: 12px 8px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: #409eff;
    background-color: rgba(64, 158, 255, 0.05);
  }

  .operator-symbol {
    font-size: 16px;
    font-weight: 600;
    font-family: 'Fira Code', Consolas, monospace;
    margin-bottom: 4px;
  }

  .operator-name {
    font-size: 12px;
    color: #606266;
    margin-bottom: 2px;
  }

  .tolerance-hint {
    font-size: 10px;
    color: #409eff;
    background: rgba(64, 158, 255, 0.1);
    padding: 2px 4px;
    border-radius: 2px;
    margin-top: 4px;
  }
}

// 帮助样式
.template-help {
  .variable-help {
    ul {
      margin: 8px 0;
      padding-left: 20px;
    }

    li {
      margin: 4px 0;
      font-size: 13px;
    }

    code {
      background: #f5f5f5;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: 'Fira Code', Consolas, monospace;
    }
  }
}
</style>
