<template>
  <el-dialog
    v-model="dialogVisible"
    title="表达式语法帮助"
    width="900px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div class="expression-help-container">
      <!-- 快速入门 -->
      <el-card class="help-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><QuestionFilled /></el-icon>
            <span>快速入门</span>
          </div>
        </template>

        <div class="quick-start">
          <p>SpEL（Spring Expression Language）表达式用于定义质控规则的验证逻辑。</p>
          <div class="basic-syntax">
            <h4>基本语法：</h4>
            <ul>
              <li><code>#fieldName</code> - 引用字段值，如 <code>#amount</code></li>
              <li><code>&&</code> - 逻辑AND，<code>||</code> - 逻辑OR</li>
              <li><code>>, <, >=, <=, ==, !=</code> - 比较操作符</li>
              <li><code>functionName(params)</code> - 调用自定义函数</li>
            </ul>
          </div>
        </div>
      </el-card>

      <!-- 常用表达式模板 -->
      <el-card class="help-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Collection /></el-icon>
            <span>常用表达式模板</span>
          </div>
        </template>

        <div class="templates-grid">
          <div
            v-for="template in expressionTemplates"
            :key="template.category"
            class="template-category"
          >
            <h4 class="category-title">{{ template.category }}</h4>
            <div class="template-list">
              <div
                v-for="item in template.items"
                :key="item.name"
                class="template-item"
                @click="copyTemplate(item.expression)"
              >
                <div class="template-name">{{ item.name }}</div>
                <div class="template-expression">{{ item.expression }}</div>
                <div class="template-description">{{ item.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 字段引用说明 -->
      <el-card class="help-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Grid /></el-icon>
            <span>字段引用说明</span>
          </div>
        </template>

        <el-table :data="fieldReferences" stripe>
          <el-table-column prop="field" label="字段名" width="150">
            <template #default="{ row }">
              <code class="field-code">#{{ row.field }}</code>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="说明" min-width="200" />
          <el-table-column prop="type" label="数据类型" width="100" />
          <el-table-column prop="example" label="示例值" width="150">
            <template #default="{ row }">
              <code class="example-code">{{ row.example }}</code>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 函数参考 -->
      <el-card class="help-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Operation /></el-icon>
            <span>内置函数参考</span>
          </div>
        </template>

        <div class="functions-list">
          <div v-for="func in builtinFunctions" :key="func.name" class="function-item">
            <div class="function-signature">
              <code>{{ func.name }}({{ func.params }})</code>
            </div>
            <div class="function-description">{{ func.description }}</div>
            <div class="function-example">
              <strong>示例：</strong><code>{{ func.example }}</code>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="openExpressionBuilder">
          <el-icon><Tools /></el-icon>
          表达式构建器
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { QuestionFilled, Collection, Grid, Operation, Tools } from '@element-plus/icons-vue'

const dialogVisible = defineModel<boolean>({ default: false })

// 表达式模板数据
const expressionTemplates = ref([
  {
    category: '字段验证',
    items: [
      {
        name: '非空检查',
        expression: '#fieldName != null && #fieldName.trim().length() > 0',
        description: '检查字段不为空且不是空字符串'
      },
      {
        name: '必填字段',
        expression: '#drugName != null && #drugName != ""',
        description: '验证必填字段有值'
      },
      {
        name: '字符串长度',
        expression: '#fieldName.length() >= 2 && #fieldName.length() <= 50',
        description: '检查字符串长度在指定范围内'
      }
    ]
  },
  {
    category: '数值验证',
    items: [
      {
        name: '正数检查',
        expression: '#amount > 0',
        description: '验证数值为正数'
      },
      {
        name: '范围验证',
        expression: '#amount >= 0 && #amount <= 200000000',
        description: '验证数值在指定范围内'
      },
      {
        name: '百分比验证',
        expression: 'Math.abs(#value1 - #value2) / #value2 <= 0.1',
        description: '验证两个值的差异在10%以内'
      }
    ]
  },
  {
    category: '业务逻辑',
    items: [
      {
        name: '转换系数验证',
        expression: 'Math.abs(#packageQty * #conversionFactor - #dosageQty) <= 1',
        description: '验证包装数量×转换系数≈制剂数量'
      },
      {
        name: '价格合理性',
        expression: '#price > 0 && #price <= #amount / #quantity',
        description: '验证单价不超过总价除以数量'
      }
    ]
  }
])

// 字段引用说明
const fieldReferences = ref([
  { field: 'amount', description: '金额字段，表示价格或费用', type: 'decimal', example: '150.50' },
  {
    field: 'packageQty',
    description: '包装数量，最小销售包装单位的数量',
    type: 'integer',
    example: '100'
  },
  {
    field: 'dosageQty',
    description: '制剂数量，最小制剂单位的数量',
    type: 'integer',
    example: '1000'
  },
  {
    field: 'conversionFactor',
    description: '转换系数，包装单位到制剂单位的转换比例',
    type: 'decimal',
    example: '10'
  },
  {
    field: 'drugName',
    description: '药品名称，药品的通用名称',
    type: 'string',
    example: '阿司匹林'
  },
  { field: 'ypid', description: '国家药管平台药品编码', type: 'string', example: '123456789012' }
])

// 内置函数参考
const builtinFunctions = ref([
  {
    name: 'isValidDictValue',
    params: 'fieldValue, dictType',
    description: '验证字段值是否在指定字典中',
    example: 'isValidDictValue(#status, "DRUG_STATUS")'
  },
  {
    name: 'checkConversionFactor',
    params: 'packageQty, conversionFactor, dosageQty, tolerance',
    description: '验证转换系数是否正确，允许指定容差',
    example: 'checkConversionFactor(#packageQty, #conversionFactor, #dosageQty, 0.1)'
  },
  {
    name: 'Math.abs',
    params: 'number',
    description: '返回数字的绝对值',
    example: 'Math.abs(#value1 - #value2)'
  }
])

// 复制模板到剪贴板
const copyTemplate = async (expression: string) => {
  try {
    await navigator.clipboard.writeText(expression)
    ElMessage.success('表达式已复制到剪贴板')
  } catch (e) {
    // 降级处理
    const textArea = document.createElement('textarea')
    textArea.value = expression
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    ElMessage.success('表达式已复制到剪贴板')
  }
}

// 打开表达式构建器
const openExpressionBuilder = () => {
  ElMessage.info('表达式构建器功能开发中...')
}

// 对外方法
defineExpose({
  open: () => {
    dialogVisible.value = true
  }
})
</script>

<style lang="scss" scoped>
.expression-help-container {
  max-height: 70vh;
  overflow-y: auto;
}

.help-card {
  margin-bottom: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;

  &:last-child {
    margin-bottom: 0;
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.quick-start {
  p {
    margin-bottom: 16px;
    color: #606266;
    line-height: 1.6;
  }

  .basic-syntax {
    h4 {
      margin-bottom: 12px;
      color: #303133;
    }

    ul {
      list-style-type: none;
      padding: 0;

      li {
        margin-bottom: 8px;
        padding: 8px 12px;
        background-color: #f8f9fa;
        border-radius: 4px;
        border-left: 3px solid #409eff;

        code {
          background-color: #e6f7ff;
          padding: 2px 6px;
          border-radius: 3px;
          color: #1890ff;
          font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
        }
      }
    }
  }
}

.templates-grid {
  .template-category {
    margin-bottom: 24px;

    .category-title {
      margin-bottom: 12px;
      color: #303133;
      border-bottom: 2px solid #e4e7ed;
      padding-bottom: 8px;
    }

    .template-list {
      display: grid;
      gap: 12px;
    }

    .template-item {
      padding: 16px;
      border: 1px solid #e4e7ed;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        border-color: #409eff;
        box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
        transform: translateY(-1px);
      }

      .template-name {
        font-weight: 600;
        color: #303133;
        margin-bottom: 8px;
      }

      .template-expression {
        background-color: #f5f7fa;
        padding: 8px 12px;
        border-radius: 4px;
        font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
        font-size: 13px;
        color: #e6a23c;
        margin-bottom: 8px;
        word-break: break-all;
      }

      .template-description {
        color: #606266;
        font-size: 14px;
      }
    }
  }
}

.field-code {
  background-color: #f0f9ff;
  padding: 2px 6px;
  border-radius: 3px;
  color: #1890ff;
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
}

.example-code {
  background-color: #f6ffed;
  padding: 2px 6px;
  border-radius: 3px;
  color: #52c41a;
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
}

.functions-list {
  .function-item {
    margin-bottom: 20px;
    padding: 16px;
    background-color: #fafbfc;
    border: 1px solid #e4e7ed;
    border-radius: 6px;

    .function-signature {
      margin-bottom: 8px;

      code {
        background-color: #f5f7fa;
        padding: 6px 12px;
        border-radius: 4px;
        font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
        color: #e6a23c;
        font-size: 14px;
      }
    }

    .function-description {
      color: #606266;
      margin-bottom: 8px;
      line-height: 1.5;
    }

    .function-example {
      code {
        background-color: #e6f7ff;
        padding: 2px 6px;
        border-radius: 3px;
        color: #1890ff;
        font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 表格样式 */
:deep(.el-table th) {
  background-color: #fafafa;
  color: #606266;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .expression-help-container {
    max-height: 60vh;
  }

  .templates-grid .template-item {
    padding: 12px;
  }

  .template-expression {
    font-size: 12px !important;
  }
}
</style>
