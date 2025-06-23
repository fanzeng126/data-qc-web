<template>
  <el-dialog
    v-model="dialogVisible"
    title="表达式构建器"
    width="1200px"
    :close-on-click-modal="false"
    destroy-on-close
    class="expression-builder-dialog"
  >
    <div class="expression-builder-container">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-section">
          <span class="toolbar-label">构建模式：</span>
          <el-radio-group v-model="buildMode" size="small">
            <el-radio-button value="visual">可视化</el-radio-button>
            <el-radio-button value="advanced">高级模式</el-radio-button>
          </el-radio-group>
        </div>

        <div class="toolbar-section">
          <el-button size="small" @click="clearBuilder">
            <el-icon><Delete /></el-icon>
            清空
          </el-button>
          <el-button size="small" @click="validateExpression">
            <el-icon><CircleCheck /></el-icon>
            验证
          </el-button>
          <el-button size="small" @click="previewExpression">
            <el-icon><View /></el-icon>
            预览
          </el-button>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <div class="builder-content">
        <!-- 左侧：组件面板 -->
        <div class="components-panel">
          <el-tabs v-model="activeTab" type="border-card">
            <!-- 字段选择 -->
            <el-tab-pane label="字段" name="fields">
              <div class="component-section">
                <div class="section-title">可用字段</div>
                <div class="field-list">
                  <div
                    v-for="field in availableFields"
                    :key="field.name"
                    class="field-item"
                    draggable="true"
                    @dragstart="handleDragStart($event, 'field', field)"
                    @click="addFieldToExpression(field)"
                  >
                    <el-icon class="field-icon">
                      <Files v-if="field.type === 'string'" />
                      <Position v-else-if="field.type === 'number'" />
                      <Calendar v-else-if="field.type === 'date'" />
                      <Select v-else />
                    </el-icon>
                    <div class="field-info">
                      <div class="field-name">#{{ field.name }}</div>
                      <div class="field-desc">{{ field.description }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <!-- 操作符 -->
            <el-tab-pane label="操作符" name="operators">
              <div class="component-section">
                <div class="section-title">比较操作符</div>
                <div class="operator-grid">
                  <div
                    v-for="op in comparisonOperators"
                    :key="op.symbol"
                    class="operator-item"
                    @click="addOperatorToExpression(op)"
                  >
                    <span class="operator-symbol">{{ op.symbol }}</span>
                    <span class="operator-desc">{{ op.description }}</span>
                  </div>
                </div>

                <div class="section-title">逻辑操作符</div>
                <div class="operator-grid">
                  <div
                    v-for="op in logicalOperators"
                    :key="op.symbol"
                    class="operator-item"
                    @click="addOperatorToExpression(op)"
                  >
                    <span class="operator-symbol">{{ op.symbol }}</span>
                    <span class="operator-desc">{{ op.description }}</span>
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <!-- 函数 -->
            <el-tab-pane label="函数" name="functions">
              <div class="component-section">
                <div class="section-title">内置函数</div>
                <div class="function-list">
                  <div
                    v-for="func in availableFunctions"
                    :key="func.name"
                    class="function-item"
                    @click="addFunctionToExpression(func)"
                  >
                    <div class="function-signature">
                      <code>{{ func.name }}({{ func.params }})</code>
                    </div>
                    <div class="function-desc">{{ func.description }}</div>
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <!-- 模板 -->
            <el-tab-pane label="模板" name="templates">
              <div class="component-section">
                <div class="section-title">常用模板</div>
                <div class="template-list">
                  <div
                    v-for="template in expressionTemplates"
                    :key="template.name"
                    class="template-item"
                    @click="loadTemplate(template)"
                  >
                    <div class="template-name">{{ template.name }}</div>
                    <div class="template-preview">{{ template.expression }}</div>
                    <div class="template-desc">{{ template.description }}</div>
                  </div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>

        <!-- 中间：构建区域 -->
        <div class="builder-area">
          <!-- 可视化构建模式 -->
          <div v-if="buildMode === 'visual'" class="visual-builder">
            <div class="builder-header">
              <span class="builder-title">表达式构建</span>
              <el-button size="small" type="primary" @click="addConditionGroup">
                <el-icon><Plus /></el-icon>
                添加条件组
              </el-button>
            </div>

            <!-- 条件组列表 -->
            <div class="condition-groups" v-if="conditionGroups.length > 0">
              <div
                v-for="(group, groupIndex) in conditionGroups"
                :key="group.id"
                class="condition-group"
              >
                <div class="group-header">
                  <span class="group-title">条件组 {{ groupIndex + 1 }}</span>
                  <div class="group-actions">
                    <el-select v-model="group.logic" size="small" style="width: 80px">
                      <el-option label="AND" value="&&" />
                      <el-option label="OR" value="||" />
                    </el-select>
                    <el-button size="small" type="primary" @click="addCondition(group)">
                      <el-icon><Plus /></el-icon>
                    </el-button>
                    <el-button size="small" type="danger" @click="removeConditionGroup(groupIndex)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </div>

                <!-- 条件列表 -->
                <div class="conditions">
                  <div
                    v-for="(condition, condIndex) in group.conditions"
                    :key="condition.id"
                    class="condition-item"
                  >
                    <div class="condition-content">
                      <!-- 左操作数 -->
                      <el-select
                        v-model="condition.leftOperand"
                        placeholder="选择字段"
                        filterable
                        style="width: 150px"
                      >
                        <el-option
                          v-for="field in availableFields"
                          :key="field.name"
                          :label="`#${field.name}`"
                          :value="`#${field.name}`"
                        />
                      </el-select>

                      <!-- 操作符 -->
                      <el-select
                        v-model="condition.operator"
                        placeholder="操作符"
                        style="width: 100px"
                      >
                        <el-option
                          v-for="op in allOperators"
                          :key="op.symbol"
                          :label="op.symbol"
                          :value="op.symbol"
                        />
                      </el-select>

                      <!-- 右操作数 -->
                      <el-input
                        v-model="condition.rightOperand"
                        placeholder="值或表达式"
                        style="width: 150px"
                      />

                      <!-- 条件间逻辑 -->
                      <el-select
                        v-if="condIndex < group.conditions.length - 1"
                        v-model="condition.logic"
                        size="small"
                        style="width: 80px"
                      >
                        <el-option label="AND" value="&&" />
                        <el-option label="OR" value="||" />
                      </el-select>
                    </div>

                    <div class="condition-actions">
                      <el-button
                        size="small"
                        type="danger"
                        @click="removeCondition(group, condIndex)"
                        circle
                      >
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                  </div>

                  <div v-if="group.conditions.length === 0" class="empty-conditions">
                    <el-icon><Plus /></el-icon>
                    <span>点击上方"+"添加条件</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-else class="empty-builder">
              <el-icon class="empty-icon"><MagicStick /></el-icon>
              <p>开始构建您的表达式</p>
              <el-button type="primary" @click="addConditionGroup">添加第一个条件组</el-button>
            </div>
          </div>

          <!-- 高级模式 -->
          <div v-else class="advanced-builder">
            <div class="builder-header">
              <span class="builder-title">高级表达式编辑</span>
            </div>
            <el-input
              v-model="rawExpression"
              type="textarea"
              :rows="12"
              placeholder="请输入SpEL表达式..."
              class="expression-textarea"
            />
          </div>
        </div>

        <!-- 右侧：预览和结果 -->
        <div class="preview-panel">
          <el-card class="preview-card" shadow="never">
            <template #header>
              <div class="card-header">
                <el-icon><View /></el-icon>
                <span>表达式预览</span>
              </div>
            </template>

            <div class="expression-preview">
              <pre class="expression-code">{{ generatedExpression || '表达式将在此显示...' }}</pre>
            </div>

            <div class="preview-actions">
              <el-button size="small" @click="copyExpression" v-if="generatedExpression">
                <el-icon><CopyDocument /></el-icon>
                复制
              </el-button>
              <el-button
                size="small"
                type="primary"
                @click="testCurrentExpression"
                v-if="generatedExpression"
              >
                <el-icon><VideoPlay /></el-icon>
                测试
              </el-button>
            </div>
          </el-card>

          <!-- 验证结果 -->
          <el-card class="validation-card" shadow="never" v-if="validationResult">
            <template #header>
              <div class="card-header">
                <el-icon><CircleCheck /></el-icon>
                <span>验证结果</span>
              </div>
            </template>

            <div class="validation-content">
              <el-tag :type="validationResult.valid ? 'success' : 'danger'" effect="dark">
                {{ validationResult.valid ? '表达式有效' : '表达式无效' }}
              </el-tag>
              <div v-if="validationResult.errors.length > 0" class="validation-errors">
                <div v-for="error in validationResult.errors" :key="error" class="error-item">
                  {{ error }}
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button @click="showHelp">
          <el-icon><QuestionFilled /></el-icon>
          帮助
        </el-button>
        <el-button type="primary" @click="confirmExpression" :disabled="!generatedExpression">
          确定
        </el-button>
      </div>
    </template>

    <!-- 表达式测试弹窗 -->
    <ExpressionTest ref="expressionTestRef" />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Delete,
  CircleCheck,
  View,
  Files,
  Position,
  Calendar,
  Select,
  Plus,
  MagicStick,
  CopyDocument,
  VideoPlay,
  QuestionFilled
} from '@element-plus/icons-vue'

// 假设导入测试组件
// import ExpressionTest from './ExpressionTest.vue'

/** 组件接口定义 */
interface Field {
  name: string
  type: string
  description: string
}

interface Operator {
  symbol: string
  description: string
  type: 'comparison' | 'logical'
}

interface Function {
  name: string
  params: string
  description: string
  template: string
}

interface Condition {
  id: string
  leftOperand: string
  operator: string
  rightOperand: string
  logic: string
}

interface ConditionGroup {
  id: string
  conditions: Condition[]
  logic: string
}

interface ValidationResult {
  valid: boolean
  errors: string[]
}

// ========================= 响应式数据 =========================

const dialogVisible = defineModel<boolean>({ default: false })
const buildMode = ref('visual')
const activeTab = ref('fields')
const rawExpression = ref('')

// 验证结果
const validationResult = ref<ValidationResult | null>(null)

// 可视化构建数据
const conditionGroups = ref<ConditionGroup[]>([])

// ========================= 静态数据 =========================

// 可用字段
const availableFields: Field[] = [
  { name: 'amount', type: 'number', description: '金额字段' },
  { name: 'packageQty', type: 'number', description: '包装数量' },
  { name: 'dosageQty', type: 'number', description: '制剂数量' },
  { name: 'conversionFactor', type: 'number', description: '转换系数' },
  { name: 'drugName', type: 'string', description: '药品名称' },
  { name: 'productName', type: 'string', description: '产品名称' },
  { name: 'ypid', type: 'string', description: '药品编码' },
  { name: 'price', type: 'number', description: '单价' },
  { name: 'quantity', type: 'number', description: '数量' },
  { name: 'status', type: 'string', description: '状态' },
  { name: 'createTime', type: 'date', description: '创建时间' }
]

// 比较操作符
const comparisonOperators: Operator[] = [
  { symbol: '>', description: '大于', type: 'comparison' },
  { symbol: '<', description: '小于', type: 'comparison' },
  { symbol: '>=', description: '大于等于', type: 'comparison' },
  { symbol: '<=', description: '小于等于', type: 'comparison' },
  { symbol: '==', description: '等于', type: 'comparison' },
  { symbol: '!=', description: '不等于', type: 'comparison' }
]

// 逻辑操作符
const logicalOperators: Operator[] = [
  { symbol: '&&', description: '逻辑AND', type: 'logical' },
  { symbol: '||', description: '逻辑OR', type: 'logical' }
]

// 所有操作符
const allOperators = computed(() => [...comparisonOperators, ...logicalOperators])

// 可用函数
const availableFunctions: Function[] = [
  {
    name: 'isValidDictValue',
    params: 'value, dictType',
    description: '验证字典值',
    template: 'isValidDictValue(#field, "DICT_TYPE")'
  },
  {
    name: 'Math.abs',
    params: 'number',
    description: '绝对值',
    template: 'Math.abs(#field)'
  },
  {
    name: 'checkConversionFactor',
    params: 'pkg, factor, dosage, tolerance',
    description: '验证转换系数',
    template: 'checkConversionFactor(#packageQty, #conversionFactor, #dosageQty, 0.1)'
  }
]

// 表达式模板
const expressionTemplates = [
  {
    name: '非空检查',
    expression: '#fieldName != null && #fieldName.trim().length() > 0',
    description: '检查字段不为空且不是空字符串'
  },
  {
    name: '数值范围',
    expression: '#amount > 0 && #amount <= 200000000',
    description: '验证数值在指定范围内'
  },
  {
    name: '转换系数验证',
    expression: 'Math.abs(#packageQty * #conversionFactor - #dosageQty) <= 1',
    description: '验证包装数量×转换系数≈制剂数量'
  }
]

// ========================= 计算属性 =========================

/** 生成的表达式 */
const generatedExpression = computed(() => {
  if (buildMode.value === 'advanced') {
    return rawExpression.value
  }

  return generateExpressionFromGroups()
})

// ========================= 监听器 =========================

watch(dialogVisible, (visible) => {
  if (!visible) {
    resetBuilder()
  }
})

watch(
  conditionGroups,
  () => {
    // 自动验证表达式
    if (generatedExpression.value) {
      validateExpression()
    }
  },
  { deep: true }
)

// ========================= 核心方法 =========================

/** 从条件组生成表达式 */
function generateExpressionFromGroups(): string {
  if (conditionGroups.value.length === 0) return ''

  const groupExpressions = conditionGroups.value
    .map((group) => {
      if (group.conditions.length === 0) return ''

      const conditionExpressions = group.conditions
        .map((condition, index) => {
          let expr = `${condition.leftOperand} ${condition.operator} ${condition.rightOperand}`

          // 添加条件间的逻辑连接符
          if (index < group.conditions.length - 1 && condition.logic) {
            expr += ` ${condition.logic}`
          }

          return expr
        })
        .join(' ')

      return group.conditions.length > 1 ? `(${conditionExpressions})` : conditionExpressions
    })
    .filter((expr) => expr.length > 0)

  // 用条件组间的逻辑连接符连接
  return groupExpressions.join(' && ')
}

/** 验证表达式 */
const validateExpression = () => {
  const expression = generatedExpression.value
  if (!expression) {
    validationResult.value = { valid: false, errors: ['表达式不能为空'] }
    return
  }

  const errors: string[] = []

  // 基本语法检查
  if (!expression.trim()) {
    errors.push('表达式不能为空')
  }

  // 括号匹配检查
  const openParens = (expression.match(/\(/g) || []).length
  const closeParens = (expression.match(/\)/g) || []).length
  if (openParens !== closeParens) {
    errors.push('括号不匹配')
  }

  // 字段引用检查
  const fieldRefs = expression.match(/#\w+/g) || []
  const validFields = availableFields.map((f) => `#${f.name}`)
  const invalidFields = fieldRefs.filter((ref) => !validFields.includes(ref))
  if (invalidFields.length > 0) {
    errors.push(`未知字段: ${invalidFields.join(', ')}`)
  }

  validationResult.value = {
    valid: errors.length === 0,
    errors
  }

  if (errors.length === 0) {
    ElMessage.success('表达式验证通过')
  } else {
    ElMessage.error('表达式验证失败')
  }
}

/** 预览表达式 */
const previewExpression = () => {
  const expression = generatedExpression.value
  if (!expression) {
    ElMessage.warning('请先构建表达式')
    return
  }

  ElMessage.info(`当前表达式: ${expression}`)
}

/** 清空构建器 */
const clearBuilder = () => {
  conditionGroups.value = []
  rawExpression.value = ''
  validationResult.value = null
  ElMessage.success('已清空构建器')
}

/** 添加条件组 */
const addConditionGroup = () => {
  const newGroup: ConditionGroup = {
    id: `group_${Date.now()}`,
    conditions: [],
    logic: '&&'
  }
  conditionGroups.value.push(newGroup)

  // 自动添加第一个条件
  addCondition(newGroup)
}

/** 移除条件组 */
const removeConditionGroup = (index: number) => {
  conditionGroups.value.splice(index, 1)
}

/** 添加条件 */
const addCondition = (group: ConditionGroup) => {
  const newCondition: Condition = {
    id: `condition_${Date.now()}`,
    leftOperand: '',
    operator: '==',
    rightOperand: '',
    logic: '&&'
  }
  group.conditions.push(newCondition)
}

/** 移除条件 */
const removeCondition = (group: ConditionGroup, index: number) => {
  group.conditions.splice(index, 1)
}

/** 添加字段到表达式 */
const addFieldToExpression = (field: Field) => {
  if (buildMode.value === 'advanced') {
    const fieldRef = `#${field.name}`
    const textarea = document.querySelector('.expression-textarea textarea') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const current = rawExpression.value
      rawExpression.value = current.substring(0, start) + fieldRef + current.substring(end)

      nextTick(() => {
        textarea.focus()
        textarea.setSelectionRange(start + fieldRef.length, start + fieldRef.length)
      })
    } else {
      rawExpression.value += `#${field.name}`
    }
  }
  ElMessage.success(`已添加字段: #${field.name}`)
}

/** 添加操作符到表达式 */
const addOperatorToExpression = (operator: Operator) => {
  if (buildMode.value === 'advanced') {
    rawExpression.value += ` ${operator.symbol} `
  }
  ElMessage.success(`已添加操作符: ${operator.symbol}`)
}

/** 添加函数到表达式 */
const addFunctionToExpression = (func: Function) => {
  if (buildMode.value === 'advanced') {
    rawExpression.value += func.template
  }
  ElMessage.success(`已添加函数: ${func.name}`)
}

/** 加载模板 */
const loadTemplate = (template: any) => {
  if (buildMode.value === 'advanced') {
    rawExpression.value = template.expression
  } else {
    // 在可视化模式下解析模板到条件组
    // 这里可以实现模板解析逻辑
    rawExpression.value = template.expression
    buildMode.value = 'advanced'
  }
  ElMessage.success(`已加载模板: ${template.name}`)
}

/** 复制表达式 */
const copyExpression = async () => {
  const expression = generatedExpression.value
  if (!expression) return

  try {
    await navigator.clipboard.writeText(expression)
    ElMessage.success('表达式已复制到剪贴板')
  } catch (e) {
    ElMessage.error('复制失败')
  }
}

/** 测试当前表达式 */
const expressionTestRef = ref()
const testCurrentExpression = () => {
  const expression = generatedExpression.value
  if (!expression) {
    ElMessage.warning('请先构建表达式')
    return
  }

  // 打开表达式测试弹窗
  if (expressionTestRef.value) {
    expressionTestRef.value.open(expression)
  } else {
    ElMessage.info('表达式测试功能需要集成ExpressionTest组件')
  }
}

/** 拖拽开始处理 */
const handleDragStart = (event: DragEvent, type: string, data: any) => {
  event.dataTransfer?.setData('text/plain', JSON.stringify({ type, data }))
}

/** 重置构建器 */
const resetBuilder = () => {
  conditionGroups.value = []
  rawExpression.value = ''
  validationResult.value = null
  buildMode.value = 'visual'
  activeTab.value = 'fields'
}

/** 显示帮助 */
const showHelp = () => {
  ElMessage.info('表达式构建器帮助功能开发中...')
}

/** 确认表达式 */
const emit = defineEmits(['confirm'])
const confirmExpression = () => {
  const expression = generatedExpression.value
  if (!expression) {
    ElMessage.warning('请先构建表达式')
    return
  }

  // 验证表达式
  validateExpression()
  if (validationResult.value && !validationResult.value.valid) {
    ElMessage.error('表达式无效，请修正后再试')
    return
  }

  emit('confirm', expression)
  dialogVisible.value = false
  ElMessage.success('表达式已确认')
}

// ========================= 对外方法 =========================

defineExpose({
  open: (initialExpression?: string) => {
    resetBuilder()
    if (initialExpression) {
      rawExpression.value = initialExpression
      buildMode.value = 'advanced'
    }
    dialogVisible.value = true
  }
})
</script>

<style lang="scss" scoped>
.expression-builder-dialog {
  :deep(.el-dialog__body) {
    padding: 0;
  }
}

.expression-builder-container {
  height: 70vh;
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;

  .toolbar-section {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .toolbar-label {
    font-size: 14px;
    color: #606266;
    font-weight: 500;
  }
}

.builder-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.components-panel {
  width: 280px;
  border-right: 1px solid #e4e7ed;
  background-color: #fafbfc;

  :deep(.el-tabs__content) {
    padding: 0;
    height: calc(70vh - 100px);
    overflow-y: auto;
  }

  .component-section {
    padding: 16px;

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #ebeef5;
    }
  }

  .field-list {
    .field-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      margin-bottom: 8px;
      background-color: white;
      border: 1px solid #e4e7ed;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        border-color: #409eff;
        box-shadow: 0 2px 4px rgba(64, 158, 255, 0.1);
      }

      .field-icon {
        color: #409eff;
      }

      .field-info {
        flex: 1;
        min-width: 0;

        .field-name {
          font-size: 13px;
          font-weight: 600;
          color: #303133;
          font-family: 'Monaco', 'Consolas', monospace;
        }

        .field-desc {
          font-size: 12px;
          color: #909399;
          margin-top: 2px;
        }
      }
    }
  }

  .operator-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 16px;

    .operator-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px;
      background-color: white;
      border: 1px solid #e4e7ed;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        border-color: #409eff;
        background-color: #f0f9ff;
      }

      .operator-symbol {
        font-size: 16px;
        font-weight: 600;
        color: #409eff;
        font-family: 'Monaco', 'Consolas', monospace;
      }

      .operator-desc {
        font-size: 11px;
        color: #909399;
        margin-top: 4px;
      }
    }
  }

  .function-list,
  .template-list {
    .function-item,
    .template-item {
      padding: 12px;
      margin-bottom: 8px;
      background-color: white;
      border: 1px solid #e4e7ed;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        border-color: #409eff;
        box-shadow: 0 2px 4px rgba(64, 158, 255, 0.1);
      }
    }

    .function-signature {
      code {
        font-size: 12px;
        color: #e6a23c;
        background-color: #fdf6ec;
        padding: 2px 6px;
        border-radius: 3px;
      }
    }

    .function-desc,
    .template-desc {
      font-size: 12px;
      color: #606266;
      margin-top: 4px;
    }

    .template-name {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 4px;
    }

    .template-preview {
      font-size: 12px;
      font-family: 'Monaco', 'Consolas', monospace;
      color: #e6a23c;
      background-color: #fdf6ec;
      padding: 4px 6px;
      border-radius: 3px;
      margin: 4px 0;
      word-break: break-all;
    }
  }
}

.builder-area {
  flex: 1;
  padding: 20px;
  overflow-y: auto;

  .builder-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .builder-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
  }

  .visual-builder {
    .condition-groups {
      .condition-group {
        margin-bottom: 20px;
        border: 1px solid #e4e7ed;
        border-radius: 8px;
        background-color: white;

        .group-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background-color: #f8f9fa;
          border-bottom: 1px solid #e4e7ed;
          border-radius: 8px 8px 0 0;

          .group-title {
            font-weight: 600;
            color: #303133;
          }

          .group-actions {
            display: flex;
            align-items: center;
            gap: 8px;
          }
        }

        .conditions {
          padding: 16px;

          .condition-item {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
            padding: 12px;
            background-color: #fafbfc;
            border: 1px solid #ebeef5;
            border-radius: 6px;

            .condition-content {
              flex: 1;
              display: flex;
              align-items: center;
              gap: 12px;
              flex-wrap: wrap;
            }

            .condition-actions {
              display: flex;
              gap: 4px;
            }
          }

          .empty-conditions {
            text-align: center;
            padding: 40px 20px;
            color: #909399;
            border: 2px dashed #e4e7ed;
            border-radius: 6px;

            .el-icon {
              font-size: 24px;
              margin-bottom: 8px;
            }
          }
        }
      }
    }

    .empty-builder {
      text-align: center;
      padding: 60px 20px;
      color: #909399;

      .empty-icon {
        font-size: 64px;
        margin-bottom: 16px;
        opacity: 0.5;
      }

      p {
        margin: 0 0 20px 0;
        font-size: 16px;
      }
    }
  }

  .advanced-builder {
    .expression-textarea {
      :deep(.el-textarea__inner) {
        font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
        font-size: 14px;
      }
    }
  }
}

.preview-panel {
  width: 300px;
  border-left: 1px solid #e4e7ed;
  background-color: #fafbfc;
  padding: 20px;

  .preview-card,
  .validation-card {
    margin-bottom: 20px;
    border: 1px solid #ebeef5;

    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #303133;
    }
  }

  .expression-preview {
    .expression-code {
      background-color: #f5f7fa;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      padding: 12px;
      font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
      font-size: 13px;
      color: #e6a23c;
      white-space: pre-wrap;
      word-break: break-all;
      margin: 0 0 12px 0;
      min-height: 100px;
    }
  }

  .preview-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .validation-content {
    .validation-errors {
      margin-top: 12px;

      .error-item {
        background-color: #fef0f0;
        border: 1px solid #fbc4c4;
        border-radius: 4px;
        padding: 8px 12px;
        margin-bottom: 8px;
        color: #f56c6c;
        font-size: 13px;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e4e7ed;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .builder-content {
    flex-direction: column;
  }

  .components-panel,
  .preview-panel {
    width: 100%;
  }

  .preview-panel {
    border-left: none;
    border-top: 1px solid #e4e7ed;
  }
}
</style>
