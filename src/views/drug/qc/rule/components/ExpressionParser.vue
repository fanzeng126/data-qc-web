<template>
  <div class="expression-parser">
    <div class="parser-content">
      <!-- 表达式分解 -->
      <div class="expression-breakdown" v-if="parsedExpression.parts.length > 0">
        <h4 class="section-title">
          <el-icon><Operation /></el-icon>
          表达式分解
        </h4>
        <div class="expression-parts">
          <div
            v-for="(part, index) in parsedExpression.parts"
            :key="index"
            class="expression-part"
            :class="part.type"
          >
            <div class="part-content">
              <code class="part-code">{{ part.expression }}</code>
              <span class="part-operator" v-if="part.operator">{{ part.operator }}</span>
            </div>
            <div class="part-explanation">{{ part.explanation }}</div>
          </div>
        </div>
      </div>

      <!-- 字段说明 -->
      <div class="field-references" v-if="parsedExpression.fields.length > 0">
        <h4 class="section-title">
          <el-icon><Grid /></el-icon>
          字段说明
        </h4>
        <div class="field-list">
          <div
            v-for="field in parsedExpression.fields"
            :key="field.name"
            class="field-item"
          >
            <div class="field-header">
              <code class="field-name">{{ field.name }}</code>
              <el-tag size="small" :type="getFieldTypeColor(field.type)">
                {{ field.type }}
              </el-tag>
            </div>
            <div class="field-description">{{ field.description }}</div>
            <div class="field-example" v-if="field.example">
              <span class="example-label">示例值:</span>
              <code class="example-value">{{ field.example }}</code>
            </div>
          </div>
        </div>
      </div>

      <!-- 逻辑说明 */
      <div class="logic-explanation">
        <h4 class="section-title">
          <el-icon><Connection /></el-icon>
          逻辑说明
        </h4>
        <div class="logic-content">
          <div class="logic-summary">
            {{ parsedExpression.summary }}
          </div>

          <!-- 执行步骤 -->
      <div class="execution-steps" v-if="parsedExpression.steps.length > 0">
        <h5 class="steps-title">执行步骤:</h5>
        <ol class="steps-list">
          <li v-for="(step, index) in parsedExpression.steps" :key="index" class="step-item">
            {{ step }}
          </li>
        </ol>
      </div>

      <!-- 示例场景 -->
      <div class="example-scenarios" v-if="parsedExpression.examples.length > 0">
        <h5 class="examples-title">示例场景:</h5>
        <div class="examples-list">
          <div
            v-for="(example, index) in parsedExpression.examples"
            :key="index"
            class="example-item"
          >
            <div class="example-header">
              <span class="example-title">{{ example.title }}</span>
              <el-tag
                size="small"
                :type="example.result ? 'success' : 'danger'"
              >
                {{ example.result ? '通过' : '失败' }}
              </el-tag>
            </div>
            <div class="example-data">
              <strong>数据:</strong> {{ example.data }}
            </div>
            <div class="example-reason">
              <strong>原因:</strong> {{ example.reason }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 常见问题 -->
  <div class="common-issues" v-if="parsedExpression.commonIssues.length > 0">
    <h4 class="section-title">
      <el-icon><Warning /></el-icon>
      常见问题
    </h4>
    <div class="issues-list">
      <div
        v-for="(issue, index) in parsedExpression.commonIssues"
        :key="index"
        class="issue-item"
      >
        <div class="issue-title">
          <el-icon><QuestionFilled /></el-icon>
          {{ issue.title }}
        </div>
        <div class="issue-description">{{ issue.description }}</div>
        <div class="issue-solution" v-if="issue.solution">
          <strong>解决方案:</strong> {{ issue.solution }}
        </div>
      </div>
    </div>
  </div>
  </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Operation, Grid, Connection, Warning, QuestionFilled } from '@element-plus/icons-vue'

interface Props {
  expression: string  // SpEL表达式
}

const props = defineProps<Props>()

// 表达式解析结果接口
interface ParsedExpression {
  parts: ExpressionPart[]      // 表达式分解部分
  fields: FieldReference[]     // 字段引用
  summary: string              // 逻辑总结
  steps: string[]              // 执行步骤
  examples: ExampleScenario[]  // 示例场景
  commonIssues: CommonIssue[]  // 常见问题
}

interface ExpressionPart {
  expression: string    // 表达式片段
  type: string         // 类型：field, operator, value, function
  explanation: string  // 解释说明
  operator?: string    // 连接操作符
}

interface FieldReference {
  name: string         // 字段名
  type: string         // 数据类型
  description: string  // 字段描述
  example?: string     // 示例值
}

interface ExampleScenario {
  title: string        // 场景标题
  data: string         // 示例数据
  result: boolean      // 执行结果
  reason: string       // 结果原因
}

interface CommonIssue {
  title: string        // 问题标题
  description: string  // 问题描述
  solution?: string    // 解决方案
}

// ========================= 核心解析逻辑 =========================

/**
 * 解析SpEL表达式
 * 这是组件的核心功能，将复杂的表达式分解成易懂的部分
 */
const parsedExpression = computed<ParsedExpression>(() => {
  return parseSpelExpression(props.expression)
})

/**
 * SpEL表达式解析器
 * 这个函数是整个组件的大脑，负责理解表达式的意图
 */
function parseSpelExpression(expression: string): ParsedExpression {
  // 如果表达式为空，返回默认结构
  if (!expression) {
    return {
      parts: [],
      fields: [],
      summary: '表达式为空',
      steps: [],
      examples: [],
      commonIssues: []
    }
  }

  // 识别表达式类型并进行相应解析
  if (isFieldValidationExpression(expression)) {
    return parseFieldValidation(expression)
  } else if (isNumericComparisonExpression(expression)) {
    return parseNumericComparison(expression)
  } else if (isLogicalCombinationExpression(expression)) {
    return parseLogicalCombination(expression)
  } else if (isFunctionCallExpression(expression)) {
    return parseFunctionCall(expression)
  } else {
    return parseGenericExpression(expression)
  }
}

// ========================= 表达式类型识别 =========================

/**
 * 判断是否为字段验证表达式
 * 例如: #fieldName != null && #fieldName.trim().length() > 0
 */
function isFieldValidationExpression(expression: string): boolean {
  return /^#\w+\s*(!=|==)\s*null/.test(expression) ||
    /\.trim\(\)\.length\(\)/.test(expression)
}

/**
 * 判断是否为数值比较表达式
 * 例如: #amount > 0 && #amount <= 200000000
 */
function isNumericComparisonExpression(expression: string): boolean {
  return /^#\w+\s*[><!=]+\s*\d+/.test(expression)
}

/**
 * 判断是否为逻辑组合表达式
 * 例如: #condition1 && #condition2 || #condition3
 */
function isLogicalCombinationExpression(expression: string): boolean {
  return /&&|\|\|/.test(expression) && expression.split(/&&|\|\|/).length > 2
}

/**
 * 判断是否为函数调用表达式
 * 例如: checkConversionFactor(#packageQty, #conversionFactor, #dosageQty, 0.1)
 */
function isFunctionCallExpression(expression: string): boolean {
  return /^[a-zA-Z]\w*\(/.test(expression)
}

// ========================= 具体解析器 =========================

/**
 * 解析字段验证表达式
 * 这类表达式主要检查字段是否为空或格式是否正确
 */
function parseFieldValidation(expression: string): ParsedExpression {
  const fieldMatch = expression.match(/#(\w+)/)
  const fieldName = fieldMatch ? fieldMatch[1] : 'unknown'

  return {
    parts: [
      {
        expression: `#${fieldName}`,
        type: 'field',
        explanation: `获取字段 ${fieldName} 的值`
      },
      {
        expression: '!= null',
        type: 'operator',
        explanation: '检查值不为空',
        operator: '&&'
      },
      {
        expression: '.trim().length() > 0',
        type: 'function',
        explanation: '去除空格后检查长度大于0'
      }
    ],
    fields: [
      {
        name: fieldName,
        type: getFieldType(fieldName),
        description: getFieldDescription(fieldName),
        example: getFieldExample(fieldName)
      }
    ],
    summary: `验证字段 ${fieldName} 不为空且不是空字符串`,
    steps: [
      `检查 ${fieldName} 字段是否存在`,
      `检查 ${fieldName} 字段值是否不为null`,
      `去除字段值前后的空格`,
      `检查去除空格后的长度是否大于0`
    ],
    examples: [
      {
        title: '有效数据',
        data: `${fieldName} = "阿司匹林"`,
        result: true,
        reason: '字段值不为空且有实际内容'
      },
      {
        title: '空字符串',
        data: `${fieldName} = ""`,
        result: false,
        reason: '字段值为空字符串'
      },
      {
        title: '空格字符',
        data: `${fieldName} = "   "`,
        result: false,
        reason: '字段值只包含空格，去除后长度为0'
      }
    ],
    commonIssues: [
      {
        title: '字段为null',
        description: '数据库中该字段值为null',
        solution: '确保数据导入时该字段有值'
      },
      {
        title: '只包含空格',
        description: '字段值看似有内容但实际只是空格',
        solution: '数据清洗时去除无意义的空格'
      }
    ]
  }
}

/**
 * 解析数值比较表达式
 * 这类表达式主要检查数值范围或大小关系
 */
function parseNumericComparison(expression: string): ParsedExpression {
  const matches = expression.match(/#(\w+)\s*([><!=]+)\s*(\d+(?:\.\d+)?)/)
  if (!matches) return parseGenericExpression(expression)

  const [, fieldName, operator, value] = matches
  const operatorMap: Record<string, string> = {
    '>': '大于',
    '<': '小于',
    '>=': '大于等于',
    '<=': '小于等于',
    '==': '等于',
    '!=': '不等于'
  }

  return {
    parts: [
      {
        expression: `#${fieldName}`,
        type: 'field',
        explanation: `获取字段 ${fieldName} 的值`
      },
      {
        expression: operator,
        type: 'operator',
        explanation: `比较操作：${operatorMap[operator] || operator}`
      },
      {
        expression: value,
        type: 'value',
        explanation: `阈值：${formatNumber(parseFloat(value))}`
      }
    ],
    fields: [
      {
        name: fieldName,
        type: 'number',
        description: getFieldDescription(fieldName),
        example: getFieldExample(fieldName)
      }
    ],
    summary: `检查 ${fieldName} 字段的值${operatorMap[operator] || operator} ${formatNumber(parseFloat(value))}`,
    steps: [
      `获取 ${fieldName} 字段的数值`,
      `与阈值 ${value} 进行${operatorMap[operator] || operator}比较`,
      `返回比较结果`
    ],
    examples: generateNumericExamples(fieldName, operator, parseFloat(value)),
    commonIssues: [
      {
        title: '数值格式错误',
        description: '字段值不是有效的数字格式',
        solution: '确保字段值为纯数字，去除非数字字符'
      },
      {
        title: '精度问题',
        description: '浮点数计算可能存在精度误差',
        solution: '使用适当的容差范围进行比较'
      }
    ]
  }
}

/**
 * 解析逻辑组合表达式
 * 这类表达式包含多个条件的逻辑组合
 */
function parseLogicalCombination(expression: string): ParsedExpression {
  const parts = expression.split(/(\s*&&\s*|\s*\|\|\s*)/)
  const conditions: ExpressionPart[] = []

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim()
    if (part === '&&' || part === '||') {
      if (conditions.length > 0) {
        conditions[conditions.length - 1].operator = part === '&&' ? '且' : '或'
      }
    } else if (part) {
      conditions.push({
        expression: part,
        type: 'condition',
        explanation: getConditionExplanation(part)
      })
    }
  }

  return {
    parts: conditions,
    fields: extractFieldsFromExpression(expression),
    summary: `组合验证：${conditions.map(c => c.explanation).join('，')}`,
    steps: [
      '依次检查各个条件',
      '根据逻辑操作符（且/或）组合结果',
      '返回最终验证结果'
    ],
    examples: [
      {
        title: '所有条件满足',
        data: '各字段值都符合要求',
        result: true,
        reason: '所有验证条件都通过'
      }
    ],
    commonIssues: [
      {
        title: '逻辑关系理解错误',
        description: '混淆"且"和"或"的逻辑关系',
        solution: '"且"要求所有条件都满足，"或"只需要一个条件满足'
      }
    ]
  }
}

/**
 * 解析函数调用表达式
 * 这类表达式调用自定义的验证函数
 */
function parseFunctionCall(expression: string): ParsedExpression {
  const functionMatch = expression.match(/^(\w+)\((.*)\)$/)
  if (!functionMatch) return parseGenericExpression(expression)

  const [, functionName, params] = functionMatch
  const paramList = params.split(',').map(p => p.trim())

  return {
    parts: [
      {
        expression: functionName,
        type: 'function',
        explanation: getFunctionDescription(functionName)
      },
      ...paramList.map(param => ({
        expression: param,
        type: param.startsWith('#') ? 'field' : 'value',
        explanation: param.startsWith('#') ? `字段参数：${param}` : `固定值：${param}`
      }))
    ],
    fields: paramList
      .filter(p => p.startsWith('#'))
      .map(p => ({
        name: p.substring(1),
        type: 'mixed',
        description: getFieldDescription(p.substring(1))
      })),
    summary: getFunctionSummary(functionName),
    steps: getFunctionSteps(functionName),
    examples: getFunctionExamples(functionName),
    commonIssues: getFunctionIssues(functionName)
  }
}

/**
 * 通用表达式解析器
 * 处理无法识别具体类型的表达式
 */
function parseGenericExpression(expression: string): ParsedExpression {
  return {
    parts: [
      {
        expression: expression,
        type: 'generic',
        explanation: '自定义验证逻辑'
      }
    ],
    fields: extractFieldsFromExpression(expression),
    summary: '执行自定义的验证逻辑',
    steps: ['执行表达式中定义的验证逻辑'],
    examples: [],
    commonIssues: [
      {
        title: '表达式语法错误',
        description: '表达式格式不正确，无法正常执行',
        solution: '检查表达式语法，确保符合SpEL规范'
      }
    ]
  }
}

// ========================= 辅助函数 =========================

/**
 * 从表达式中提取字段引用
 */
function extractFieldsFromExpression(expression: string): FieldReference[] {
  const fieldMatches = expression.match(/#(\w+)/g) || []
  const uniqueFields = [...new Set(fieldMatches.map(f => f.substring(1)))]

  return uniqueFields.map(fieldName => ({
    name: fieldName,
    type: getFieldType(fieldName),
    description: getFieldDescription(fieldName),
    example: getFieldExample(fieldName)
  }))
}

/**
 * 获取字段类型
 */
function getFieldType(fieldName: string): string {
  const typeMap: Record<string, string> = {
    amount: 'decimal',
    quantity: 'integer',
    price: 'decimal',
    rate: 'decimal',
    count: 'integer',
    id: 'bigint',
    code: 'string',
    name: 'string',
    time: 'datetime'
  }

  for (const [key, type] of Object.entries(typeMap)) {
    if (fieldName.toLowerCase().includes(key)) {
      return type
    }
  }

  return 'string'
}

/**
 * 获取字段描述
 */
function getFieldDescription(fieldName: string): string {
  const descriptionMap: Record<string, string> = {
    amount: '金额字段，通常表示价格或费用',
    packageQty: '包装数量，最小销售包装单位的数量',
    dosageQty: '制剂数量，最小制剂单位的数量',
    conversionFactor: '转换系数，包装单位到制剂单位的转换比例',
    drugName: '药品名称，药品的通用名称',
    productName: '产品名称，药品的商品名称',
    ypid: '国家药管平台药品编码',
    mobile: '手机号码',
    email: '电子邮箱地址'
  }

  return descriptionMap[fieldName] || `${fieldName} 字段`
}

/**
 * 获取字段示例值
 */
function getFieldExample(fieldName: string): string {
  const exampleMap: Record<string, string> = {
    amount: '150.50',
    packageQty: '100',
    dosageQty: '1000',
    conversionFactor: '10',
    drugName: '阿司匹林',
    productName: '拜阿司匹林',
    ypid: '123456789012',
    mobile: '13800138000',
    email: 'user@example.com'
  }

  return exampleMap[fieldName] || 'example_value'
}

/**
 * 获取条件解释
 */
function getConditionExplanation(condition: string): string {
  if (condition.includes('!= null')) {
    return '检查字段不为空'
  } else if (condition.includes('> 0')) {
    return '检查数值大于0'
  } else if (condition.includes('<=')) {
    return '检查数值不超过限制'
  } else {
    return '自定义验证条件'
  }
}

/**
 * 生成数值比较示例
 */
function generateNumericExamples(fieldName: string, operator: string, value: number): ExampleScenario[] {
  const examples: ExampleScenario[] = []

  switch (operator) {
    case '>':
      examples.push(
        {
          title: '符合条件',
          data: `${fieldName} = ${value + 10}`,
          result: true,
          reason: `${value + 10} > ${value}`
        },
        {
          title: '不符合条件',
          data: `${fieldName} = ${value - 10}`,
          result: false,
          reason: `${value - 10} ≤ ${value}`
        }
      )
      break
    case '<=':
      examples.push(
        {
          title: '符合条件',
          data: `${fieldName} = ${value}`,
          result: true,
          reason: `${value} ≤ ${value}`
        },
        {
          title: '不符合条件',
          data: `${fieldName} = ${value + 10}`,
          result: false,
          reason: `${value + 10} > ${value}`
        }
      )
      break
  }

  return examples
}

/**
 * 获取函数描述
 */
function getFunctionDescription(functionName: string): string {
  const functionMap: Record<string, string> = {
    checkConversionFactor: '验证转换系数是否正确',
    isValidDictValue: '验证是否为有效的字典值',
    checkPriceRange: '验证价格是否在合理范围内'
  }

  return functionMap[functionName] || '自定义验证函数'
}

/**
 * 获取函数摘要
 */
function getFunctionSummary(functionName: string): string {
  const summaryMap: Record<string, string> = {
    checkConversionFactor: '验证包装数量×转换系数是否等于制剂数量（允许一定误差范围）',
    isValidDictValue: '检查字段值是否在预定义的字典列表中',
    checkPriceRange: '验证价格是否在设定的最小值和最大值之间'
  }

  return summaryMap[functionName] || '执行特定的验证逻辑'
}

/**
 * 获取函数执行步骤
 */
function getFunctionSteps(functionName: string): string[] {
  const stepsMap: Record<string, string[]> = {
    checkConversionFactor: [
      '获取包装数量、转换系数和制剂数量',
      '计算包装数量×转换系数的结果',
      '比较计算结果与制剂数量的差异',
      '判断差异是否在允许的误差范围内'
    ],
    isValidDictValue: [
      '获取要验证的字段值',
      '从字典配置中获取有效值列表',
      '检查字段值是否在有效值列表中'
    ]
  }

  return stepsMap[functionName] || ['执行函数逻辑']
}

/**
 * 获取函数示例
 */
function getFunctionExamples(functionName: string): ExampleScenario[] {
  const examplesMap: Record<string, ExampleScenario[]> = {
    checkConversionFactor: [
      {
        title: '转换正确',
        data: '包装数量=100, 转换系数=10, 制剂数量=1000',
        result: true,
        reason: '100 × 10 = 1000，转换系数正确'
      },
      {
        title: '转换错误',
        data: '包装数量=100, 转换系数=10, 制剂数量=900',
        result: false,
        reason: '100 × 10 ≠ 900，转换系数不匹配'
      }
    ]
  }

  return examplesMap[functionName] || []
}

/**
 * 获取函数常见问题
 */
function getFunctionIssues(functionName: string): CommonIssue[] {
  const issuesMap: Record<string, CommonIssue[]> = {
    checkConversionFactor: [
      {
        title: '转换系数填写错误',
        description: '转换系数与实际包装规格不符',
        solution: '核对药品说明书，确认正确的包装规格'
      },
      {
        title: '数量单位混乱',
        description: '包装数量和制剂数量的单位搞混',
        solution: '明确区分最小销售包装单位和最小制剂单位'
      }
    ]
  }

  return issuesMap[functionName] || []
}

/**
 * 格式化数字显示
 */
function formatNumber(num: number): string {
  if (num >= 100000000) {
    return (num / 100000000).toFixed(1) + '亿'
  } else if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  } else {
    return num.toLocaleString()
  }
}

/**
 * 获取字段类型颜色
 */
function getFieldTypeColor(type: string): string {
  const colorMap: Record<string, string> = {
    string: 'primary',
    integer: 'success',
    decimal: 'warning',
    bigint: 'info',
    datetime: 'danger'
  }

  return colorMap[type] || 'default'
}
</script>

<style lang="scss" scoped>
.expression-parser {
  .parser-content {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #303133;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    border-bottom: 2px solid #e4e7ed;
    padding-bottom: 8px;
  }

  // 表达式分解样式
  .expression-breakdown {
    margin-bottom: 20px;

    .expression-parts {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .expression-part {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      border-radius: 6px;
      border-left: 4px solid;

      &.field {
        background-color: #f0f9ff;
        border-left-color: #3b82f6;
      }

      &.operator {
        background-color: #fef3c7;
        border-left-color: #f59e0b;
      }

      &.value {
        background-color: #f0fdf4;
        border-left-color: #10b981;
      }

      &.function {
        background-color: #fdf4ff;
        border-left-color: #8b5cf6;
      }

      .part-content {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 200px;

        .part-code {
          background-color: rgba(0, 0, 0, 0.05);
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
          font-size: 13px;
          color: #1f2937;
        }

        .part-operator {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }
      }

      .part-explanation {
        flex: 1;
        color: #4b5563;
        font-size: 14px;
      }
    }
  }

  // 字段说明样式
  .field-references {
    margin-bottom: 20px;

    .field-list {
      display: grid;
      gap: 12px;
    }

    .field-item {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;

      .field-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .field-name {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 2px 8px;
          border-radius: 4px;
          font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
          font-size: 13px;
        }
      }

      .field-description {
        color: #4b5563;
        font-size: 14px;
        margin-bottom: 4px;
      }

      .field-example {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;

        .example-label {
          color: #6b7280;
        }

        .example-value {
          background-color: #ddd6fe;
          color: #5b21b6;
          padding: 1px 4px;
          border-radius: 3px;
          font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
        }
      }
    }
  }

  // 逻辑说明样式
  .logic-explanation {
    margin-bottom: 20px;

    .logic-content {
      background-color: #fafbfc;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      padding: 16px;

      .logic-summary {
        font-size: 15px;
        color: #1f2937;
        font-weight: 500;
        margin-bottom: 16px;
        line-height: 1.5;
      }

      .execution-steps {
        margin-bottom: 16px;

        .steps-title {
          color: #374151;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .steps-list {
          margin: 0;
          padding-left: 20px;

          .step-item {
            color: #4b5563;
            font-size: 14px;
            margin-bottom: 4px;
            line-height: 1.4;
          }
        }
      }

      .example-scenarios {
        .examples-title {
          color: #374151;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .examples-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .example-item {
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px;

          .example-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;

            .example-title {
              font-weight: 500;
              color: #1f2937;
            }
          }

          .example-data, .example-reason {
            font-size: 13px;
            color: #4b5563;
            margin-bottom: 4px;
          }
        }
      }
    }
  }

  // 常见问题样式
  .common-issues {
    .issues-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .issue-item {
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 12px;

      .issue-title {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #dc2626;
        font-weight: 600;
        margin-bottom: 8px;
      }

      .issue-description {
        color: #7f1d1d;
        font-size: 14px;
        margin-bottom: 8px;
      }

      .issue-solution {
        color: #059669;
        font-size: 14px;
        background-color: #ecfdf5;
        padding: 8px;
        border-radius: 4px;
        border-left: 3px solid #10b981;
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .expression-parser {
    .expression-part {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;

      .part-content {
        min-width: auto;
      }
    }

    .field-item .field-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .example-item .example-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
  }
}
</style>
