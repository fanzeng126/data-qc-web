<template>
  <div class="expression-component" :class="component.type">
    <!-- 字段组件 -->
    <div v-if="component.type === 'field'" class="component-field">
      <div class="field-display">
        <Icon icon="ep:key" class="field-icon" />
        <span class="field-name">{{ component.label || component.value }}</span>
        <el-tag size="small" class="field-type">{{ component.dataType }}</el-tag>
      </div>
      <el-button size="small" text @click="removeComponent" class="remove-btn">
        <Icon icon="ep:close" />
      </el-button>
    </div>

    <!-- 函数组件 -->
    <div v-else-if="component.type === 'function'" class="component-function">
      <div class="function-header">
        <Icon icon="ep:cpu" class="function-icon" />
        <span class="function-name">{{ component.value }}</span>
        <el-button size="small" text @click="removeComponent" class="remove-btn">
          <Icon icon="ep:close" />
        </el-button>
      </div>

      <div class="function-body">
        <span class="bracket">(</span>

        <div class="parameters">
          <div
            v-for="(param, paramIndex) in component.parameters || []"
            :key="paramIndex"
            class="parameter-item"
          >
            <ParameterInput
              :parameter="param"
              :index="paramIndex"
              @update="updateParameter"
              @remove="removeParameter"
            />
            <span v-if="paramIndex < (component.parameters?.length || 0) - 1" class="separator"
              >,</span
            >
          </div>

          <el-button size="small" text @click="addParameter" class="add-param-btn">
            <Icon icon="ep:plus" />
          </el-button>
        </div>

        <span class="bracket">)</span>
      </div>
    </div>

    <!-- 操作符组件 -->
    <div v-else-if="component.type === 'operator'" class="component-operator">
      <div class="operator-display">
        <span class="operator-symbol">{{ component.value }}</span>
        <span class="operator-name">{{ component.label }}</span>
      </div>
      <el-button size="small" text @click="removeComponent" class="remove-btn">
        <Icon icon="ep:close" />
      </el-button>
    </div>

    <!-- 常量组件 -->
    <div v-else-if="component.type === 'constant'" class="component-constant">
      <el-input
        :model-value="component.value"
        size="small"
        placeholder="输入值"
        @input="handleValueChange"
        class="constant-input"
      />
      <el-button size="small" text @click="removeComponent" class="remove-btn">
        <Icon icon="ep:close" />
      </el-button>
    </div>

    <!-- 逻辑分组组件 -->
    <div v-else-if="component.type === 'group'" class="component-group">
      <div class="group-header">
        <span class="bracket">(</span>
        <el-select
          :model-value="component.operator"
          size="small"
          placeholder="逻辑运算符"
          @change="handleOperatorChange"
          class="group-operator"
        >
          <el-option label="AND" value="AND" />
          <el-option label="OR" value="OR" />
        </el-select>
        <el-button size="small" text @click="removeComponent" class="remove-btn">
          <Icon icon="ep:close" />
        </el-button>
      </div>

      <div class="group-content">
        <div
          v-for="(subComponent, subIndex) in component.components || []"
          :key="subIndex"
          class="sub-component"
        >
          <ExpressionComponent
            :component="subComponent"
            :index="subIndex"
            @update="updateSubComponent"
            @remove="removeSubComponent"
            @insert="insertSubComponent"
          />
          <span v-if="subIndex < (component.components?.length || 0) - 1" class="logical-operator">
            {{ component.operator }}
          </span>
        </div>

        <el-button size="small" text @click="addSubComponent" class="add-component-btn">
          <Icon icon="ep:plus" />
          添加条件
        </el-button>
      </div>

      <span class="bracket">)</span>
    </div>

    <!-- 表达式组件 -->
    <div v-else-if="component.type === 'expression'" class="component-expression">
      <div class="expression-header">
        <Icon icon="ep:cpu" class="expression-icon" />
        <span class="expression-label">{{ component.label || '子表达式' }}</span>
        <el-button size="small" text @click="editExpression" class="edit-expression-btn">
          <Icon icon="ep:edit" />
          编辑
        </el-button>
        <el-button size="small" text @click="removeComponent" class="remove-btn">
          <Icon icon="ep:close" />
        </el-button>
      </div>

      <div class="expression-content">
        <div class="expression-preview">
          <code class="expression-code">{{ getExpressionPreview() }}</code>
        </div>
        <div class="expression-info">
          <el-tag size="small" type="info">
            {{ (component.expression?.components || []).length }} 个组件
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 插入按钮 -->
    <div class="insert-actions">
      <el-dropdown @command="handleInsertCommand" trigger="click">
        <el-button size="small" text class="insert-btn">
          <Icon icon="ep:plus" />
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="operator">插入操作符</el-dropdown-item>
            <el-dropdown-item command="constant">插入常量</el-dropdown-item>
            <el-dropdown-item command="expression">插入表达式</el-dropdown-item>
            <el-dropdown-item command="group">插入分组</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ParameterInput from './ParameterInput.vue'

interface ExpressionComponent {
  type: 'field' | 'function' | 'operator' | 'constant' | 'group' | 'expression'
  value: any
  label?: string
  dataType?: string
  parameters?: any[]
  components?: ExpressionComponent[]
  operator?: string
  config?: any
  expression?: any
}

interface Props {
  component: ExpressionComponent
  index: number
}

interface Emits {
  (e: 'update', component: ExpressionComponent): void
  (e: 'remove'): void
  (e: 'insert', component: ExpressionComponent): void
  (e: 'edit-expression', component: ExpressionComponent): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 处理常量值变化
const handleValueChange = (value: any) => {
  const updatedComponent = {
    ...props.component,
    value
  }
  emit('update', updatedComponent)
}

// 处理分组操作符变化
const handleOperatorChange = (operator: string) => {
  const updatedComponent = {
    ...props.component,
    operator
  }
  emit('update', updatedComponent)
}

// 移除组件
const removeComponent = () => {
  emit('remove')
}

// 插入组件
const handleInsertCommand = (command: string) => {
  let newComponent: ExpressionComponent | null = null

  switch (command) {
    case 'operator':
      newComponent = {
        type: 'operator',
        value: '=',
        label: '等于'
      }
      break

    case 'constant':
      newComponent = {
        type: 'constant',
        value: '',
        label: '常量'
      }
      break

    case 'expression':
      newComponent = {
        type: 'expression',
        value: '',
        label: '子表达式',
        expression: {
          components: []
        }
      }
      break

    case 'group':
      newComponent = {
        type: 'group',
        value: 'group',
        operator: 'AND',
        components: []
      }
      break
  }

  if (newComponent) {
    emit('insert', newComponent)
  }
}

// 函数参数相关方法
const addParameter = () => {
  const updatedComponent = { ...props.component }
  const currentParameters = updatedComponent.parameters || []

  updatedComponent.parameters = [
    ...currentParameters,
    {
      type: 'constant',
      value: '',
      label: '参数'
    }
  ]

  emit('update', updatedComponent)
}

const updateParameter = (index: number, parameter: any) => {
  const updatedComponent = { ...props.component }
  const currentParameters = updatedComponent.parameters || []

  if (index >= 0 && index < currentParameters.length) {
    updatedComponent.parameters = [...currentParameters]
    updatedComponent.parameters[index] = parameter
    emit('update', updatedComponent)
  }
}

const removeParameter = (index: number) => {
  const updatedComponent = { ...props.component }
  const currentParameters = updatedComponent.parameters || []

  if (index >= 0 && index < currentParameters.length) {
    updatedComponent.parameters = [...currentParameters]
    updatedComponent.parameters.splice(index, 1)
    emit('update', updatedComponent)
  }
}

// 分组子组件相关方法
const addSubComponent = () => {
  const updatedComponent = { ...props.component }
  const currentComponents = updatedComponent.components || []

  updatedComponent.components = [
    ...currentComponents,
    {
      type: 'constant',
      value: '',
      label: '条件'
    }
  ]

  emit('update', updatedComponent)
}

const updateSubComponent = (index: number, subComponent: ExpressionComponent) => {
  const updatedComponent = { ...props.component }
  const currentComponents = updatedComponent.components || []

  if (index >= 0 && index < currentComponents.length) {
    updatedComponent.components = [...currentComponents]
    updatedComponent.components[index] = subComponent
    emit('update', updatedComponent)
  }
}

const removeSubComponent = (index: number) => {
  const updatedComponent = { ...props.component }
  const currentComponents = updatedComponent.components || []

  if (index >= 0 && index < currentComponents.length) {
    updatedComponent.components = [...currentComponents]
    updatedComponent.components.splice(index, 1)
    emit('update', updatedComponent)
  }
}

const insertSubComponent = (index: number, subComponent: ExpressionComponent) => {
  const updatedComponent = { ...props.component }
  const currentComponents = updatedComponent.components || []

  if (index >= 0 && index <= currentComponents.length) {
    updatedComponent.components = [...currentComponents]
    updatedComponent.components.splice(index + 1, 0, subComponent)
    emit('update', updatedComponent)
  }
}

// 表达式相关方法
const editExpression = () => {
  // 触发表达式编辑事件，这将被父组件处理
  emit('edit-expression', props.component)
}

const getExpressionPreview = () => {
  const expressionComponents = props.component.expression?.components || []
  if (expressionComponents.length === 0) {
    return '空表达式'
  }
  
  // 简化的表达式预览
  return expressionComponents
    .map((comp: any) => {
      if (comp.type === 'field') {
        return comp.label || comp.value
      } else if (comp.type === 'operator') {
        return comp.value
      } else if (comp.type === 'constant') {
        return `"${comp.value}"`
      } else if (comp.type === 'function') {
        return `${comp.value}(...)`
      }
      return comp.value || comp.type
    })
    .join(' ')
}
</script>

<style lang="scss" scoped>
.expression-component {
  display: inline-flex;
  align-items: center;
  position: relative;
  margin: 2px;

  &:hover {
    .insert-actions {
      opacity: 1;
    }
  }

  // 字段组件样式
  .component-field {
    display: flex;
    align-items: center;
    background: #e7f3ff;
    border: 1px solid #409eff;
    border-radius: 6px;
    padding: 8px 12px;
    gap: 8px;

    .field-display {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .field-icon {
      color: #409eff;
    }

    .field-name {
      font-weight: 500;
      font-family: 'Fira Code', Consolas, monospace;
    }

    .field-type {
      background: #409eff;
      color: white;
      border: none;
    }

    .remove-btn {
      margin-left: 4px;
      color: #909399;

      &:hover {
        color: #f56c6c;
      }
    }
  }

  // 函数组件样式
  .component-function {
    background: #fff7e6;
    border: 1px solid #e6a23c;
    border-radius: 6px;
    padding: 8px 12px;

    .function-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;

      .function-icon {
        color: #e6a23c;
      }

      .function-name {
        font-weight: 600;
        font-family: 'Fira Code', Consolas, monospace;
        color: #e6a23c;
      }

      .remove-btn {
        margin-left: auto;
        color: #909399;

        &:hover {
          color: #f56c6c;
        }
      }
    }

    .function-body {
      display: flex;
      align-items: center;
      gap: 4px;

      .bracket {
        font-weight: 600;
        font-size: 16px;
        color: #e6a23c;
      }

      .parameters {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-wrap: wrap;

        .parameter-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .separator {
          color: #606266;
          font-weight: 500;
        }

        .add-param-btn {
          color: #e6a23c;
          font-size: 12px;

          &:hover {
            background: rgba(230, 162, 60, 0.1);
          }
        }
      }
    }
  }

  // 操作符组件样式
  .component-operator {
    display: flex;
    align-items: center;
    background: #f0f9ff;
    border: 1px solid #67c23a;
    border-radius: 6px;
    padding: 8px 12px;
    gap: 8px;

    .operator-display {
      display: flex;
      flex-direction: column;
      align-items: center;

      .operator-symbol {
        font-weight: 600;
        font-size: 16px;
        font-family: 'Fira Code', Consolas, monospace;
        color: #67c23a;
      }

      .operator-name {
        font-size: 11px;
        color: #67c23a;
      }
    }

    .remove-btn {
      color: #909399;

      &:hover {
        color: #f56c6c;
      }
    }
  }

  // 常量组件样式
  .component-constant {
    display: flex;
    align-items: center;
    gap: 4px;

    .constant-input {
      width: 120px;
    }

    .remove-btn {
      color: #909399;

      &:hover {
        color: #f56c6c;
      }
    }
  }

  // 分组组件样式
  .component-group {
    background: #faf5ff;
    border: 2px solid #9d5cf0;
    border-radius: 8px;
    padding: 12px;

    .group-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;

      .bracket {
        font-weight: 600;
        font-size: 18px;
        color: #9d5cf0;
      }

      .group-operator {
        width: 80px;
      }

      .remove-btn {
        margin-left: auto;
        color: #909399;

        &:hover {
          color: #f56c6c;
        }
      }
    }

    .group-content {
      margin: 8px 0;
      padding-left: 20px;

      .sub-component {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 4px 0;

        .logical-operator {
          background: #9d5cf0;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
      }

      .add-component-btn {
        color: #9d5cf0;
        border: 1px dashed #9d5cf0;
        margin-top: 8px;

        &:hover {
          background: rgba(157, 92, 240, 0.1);
        }
      }
    }
  }

  // 表达式组件样式
  .component-expression {
    background: #f0fdf4;
    border: 2px solid #16a34a;
    border-radius: 8px;
    padding: 12px;
    min-width: 280px;

    .expression-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;

      .expression-icon {
        color: #16a34a;
        font-size: 16px;
      }

      .expression-label {
        font-weight: 600;
        color: #16a34a;
        flex: 1;
      }

      .edit-expression-btn {
        color: #16a34a;
        font-size: 12px;

        &:hover {
          background: rgba(22, 163, 74, 0.1);
        }
      }

      .remove-btn {
        color: #909399;

        &:hover {
          color: #f56c6c;
        }
      }
    }

    .expression-content {
      .expression-preview {
        background: #dcfce7;
        border: 1px solid #bbf7d0;
        border-radius: 4px;
        padding: 8px 12px;
        margin-bottom: 8px;

        .expression-code {
          font-family: 'Fira Code', Consolas, monospace;
          font-size: 13px;
          color: #15803d;
          word-break: break-all;
          line-height: 1.4;
        }
      }

      .expression-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
    }
  }

  // 插入按钮
  .insert-actions {
    position: absolute;
    right: -20px;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0;
    transition: opacity 0.3s;

    .insert-btn {
      width: 16px;
      height: 16px;
      padding: 0;
      border-radius: 50%;
      background: #409eff;
      color: white;

      &:hover {
        background: #337ecc;
      }
    }
  }
}

// 响应式调整
@media (max-width: 768px) {
  .expression-component {
    .component-function .function-body {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;

      .parameters {
        margin-left: 20px;
      }
    }

    .component-group .group-content {
      padding-left: 10px;

      .sub-component {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
    }

    .component-expression {
      min-width: 240px;

      .expression-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;

        .edit-expression-btn,
        .remove-btn {
          align-self: flex-end;
        }
      }

      .expression-content {
        .expression-preview .expression-code {
          font-size: 12px;
        }
      }
    }
  }
}
</style>
