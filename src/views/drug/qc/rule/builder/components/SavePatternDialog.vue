<template>
  <el-dialog
    v-model="dialogVisible"
    title="保存模式"
    width="50%"
    :before-close="handleClose"
    destroy-on-close
    class="save-pattern-dialog"
  >
    <div class="pattern-container">
      <!-- 模式基本信息 -->
      <div class="pattern-basic-info">
        <div class="section-header">
          <Icon icon="ep:collection-tag" class="header-icon" />
          <span class="header-title">模式基本信息</span>
        </div>

        <el-form
          :model="patternForm"
          :rules="patternRules"
          ref="patternFormRef"
          label-width="100px"
        >
          <el-form-item label="模式名称" prop="name">
            <el-input
              v-model="patternForm.name"
              placeholder="请输入模式名称"
              maxlength="50"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="模式分类" prop="category">
            <el-select v-model="patternForm.category" placeholder="请选择分类">
              <el-option label="药品相关" value="drug" />
              <el-option label="时间相关" value="time" />
              <el-option label="数值相关" value="number" />
              <el-option label="文本匹配" value="text" />
              <el-option label="业务规则" value="business" />
              <el-option label="自定义" value="custom" />
            </el-select>
          </el-form-item>

          <el-form-item label="模式描述" prop="description">
            <el-input
              v-model="patternForm.description"
              type="textarea"
              :rows="3"
              placeholder="请输入模式描述，说明模式的用途和使用场景"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="使用示例">
            <el-input
              v-model="patternForm.example"
              placeholder="输入一个使用示例"
              maxlength="100"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="标签">
            <div class="tags-input">
              <el-tag
                v-for="tag in patternForm.tags"
                :key="tag"
                closable
                @close="removeTag(tag)"
                class="tag-item"
              >
                {{ tag }}
              </el-tag>
              <el-input
                v-if="tagInputVisible"
                ref="tagInputRef"
                v-model="tagInputValue"
                size="small"
                @keyup.enter="addTag"
                @blur="addTag"
                class="tag-input"
              />
              <el-button v-else size="small" text @click="showTagInput" class="add-tag-btn">
                <Icon icon="ep:plus" class="mr-5px" />
                添加标签
              </el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <!-- 模式内容预览 -->
      <div class="pattern-content-preview">
        <div class="section-header">
          <Icon icon="ep:view" class="header-icon" />
          <span class="header-title">模式内容预览</span>
        </div>

        <div class="preview-content">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="模式类型">
              <el-tag :type="getPatternTypeColor(pattern.type)" size="small">
                {{ getPatternTypeName(pattern.type) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="模式表达式">
              <code class="pattern-code">{{ pattern.pattern }}</code>
            </el-descriptions-item>
          </el-descriptions>

          <div class="pattern-config">
            <div class="config-header">配置参数：</div>
            <div class="config-content">
              <pre>{{ JSON.stringify(pattern.config, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- 模式设置 -->
      <div class="pattern-settings">
        <div class="section-header">
          <Icon icon="ep:setting" class="header-icon" />
          <span class="header-title">模式设置</span>
        </div>

        <div class="settings-content">
          <el-form :model="patternSettings" label-width="120px">
            <el-form-item label="可见性">
              <el-radio-group v-model="patternSettings.visibility">
                <el-radio label="private">私有模式</el-radio>
                <el-radio label="team">团队共享</el-radio>
                <el-radio label="public">公开模式</el-radio>
              </el-radio-group>
              <div class="setting-help">
                <el-text size="small" type="info">
                  私有模式仅自己可见，团队模式团队成员可见，公开模式所有人可见
                </el-text>
              </div>
            </el-form-item>

            <el-form-item label="允许修改">
              <el-switch v-model="patternSettings.allowModification" />
              <div class="setting-help">
                <el-text size="small" type="info"> 其他用户是否可以基于此模式创建新版本 </el-text>
              </div>
            </el-form-item>

            <el-form-item label="版本控制">
              <el-switch v-model="patternSettings.versionControl" />
              <div class="setting-help">
                <el-text size="small" type="info"> 启用版本控制可以追踪模式的修改历史 </el-text>
              </div>
            </el-form-item>

            <el-form-item label="自动测试">
              <el-switch v-model="patternSettings.autoTest" />
              <div class="setting-help">
                <el-text size="small" type="info"> 保存时自动运行测试用例验证模式的正确性 </el-text>
              </div>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 测试用例 -->
      <div class="pattern-test-cases">
        <div class="section-header">
          <Icon icon="ep:cpu" class="header-icon" />
          <span class="header-title">测试用例</span>
          <el-button size="small" @click="addTestCase">
            <Icon icon="ep:plus" class="mr-5px" />
            添加测试用例
          </el-button>
        </div>

        <div class="test-cases-content">
          <div v-for="(testCase, index) in testCases" :key="index" class="test-case-item">
            <div class="test-case-header">
              <span class="test-case-title">测试用例 {{ index + 1 }}</span>
              <el-button size="small" text type="danger" @click="removeTestCase(index)">
                <Icon icon="ep:delete" />
              </el-button>
            </div>
            <div class="test-case-body">
              <el-form :model="testCase" label-width="80px" size="small">
                <el-form-item label="测试输入">
                  <el-input
                    v-model="testCase.input"
                    placeholder="输入测试字符串"
                    @input="validateTestCase(index)"
                  />
                </el-form-item>
                <el-form-item label="预期结果">
                  <el-select v-model="testCase.expected">
                    <el-option label="匹配" :value="true" />
                    <el-option label="不匹配" :value="false" />
                  </el-select>
                </el-form-item>
                <el-form-item label="实际结果">
                  <el-tag
                    :type="testCase.result === testCase.expected ? 'success' : 'danger'"
                    size="small"
                  >
                    {{ testCase.result ? '匹配' : '不匹配' }}
                  </el-tag>
                  <el-tag
                    v-if="testCase.result !== undefined"
                    :type="testCase.result === testCase.expected ? 'success' : 'danger'"
                    size="small"
                    class="ml-8px"
                  >
                    {{ testCase.result === testCase.expected ? '通过' : '失败' }}
                  </el-tag>
                </el-form-item>
              </el-form>
            </div>
          </div>

          <div v-if="testCases.length === 0" class="empty-test-cases">
            <Icon icon="ep:document" class="empty-icon" />
            <p>暂无测试用例，建议添加一些测试用例来验证模式的正确性</p>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-left">
          <el-button @click="runAllTests" :loading="testing">
            <Icon icon="ep:video-play" class="mr-5px" />
            运行测试
          </el-button>
        </div>
        <div class="footer-right">
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" @click="handleSave" :loading="saving" :disabled="!isFormValid">
            <Icon icon="ep:check" class="mr-5px" />
            保存模式
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'

interface Props {
  modelValue: boolean
  pattern: any
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', patternInfo: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 对话框状态
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 表单引用
const patternFormRef = ref()
const tagInputRef = ref()

// 模式表单
const patternForm = reactive({
  name: '',
  category: '',
  description: '',
  example: '',
  tags: []
})

// 表单验证规则
const patternRules = {
  name: [
    { required: true, message: '请输入模式名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  category: [{ required: true, message: '请选择模式分类', trigger: 'change' }],
  description: [
    { required: true, message: '请输入模式描述', trigger: 'blur' },
    { min: 5, max: 200, message: '长度在 5 到 200 个字符', trigger: 'blur' }
  ]
}

// 模式设置
const patternSettings = reactive({
  visibility: 'private',
  allowModification: true,
  versionControl: true,
  autoTest: false
})

// 标签相关
const tagInputVisible = ref(false)
const tagInputValue = ref('')

// 测试用例
const testCases = ref([])
const testing = ref(false)
const saving = ref(false)

// 计算属性
const isFormValid = computed(() => {
  return patternForm.name && patternForm.category && patternForm.description
})

// 监听对话框打开
watch(dialogVisible, (visible) => {
  if (visible) {
    generateDefaultPatternInfo()
    addDefaultTestCases()
  }
})

// 生成默认模式信息
const generateDefaultPatternInfo = () => {
  if (props.pattern) {
    // 根据模式类型生成默认名称
    const typeNames = {
      wildcard: '通配符模式',
      regex: '正则表达式模式',
      prefix: '前缀匹配模式',
      suffix: '后缀匹配模式',
      contains: '包含匹配模式'
    }

    patternForm.name = typeNames[props.pattern.type] || '自定义模式'
    patternForm.description = `基于 ${props.pattern.pattern} 的${typeNames[props.pattern.type] || '模式'}`
    patternForm.example = generateExampleFromPattern()
    patternForm.tags = extractDefaultTags()

    // 根据模式内容推断分类
    if (props.pattern.pattern.includes('drug') || props.pattern.pattern.includes('药品')) {
      patternForm.category = 'drug'
    } else if (props.pattern.pattern.includes('time') || props.pattern.pattern.includes('date')) {
      patternForm.category = 'time'
    } else if (
      props.pattern.pattern.includes('amount') ||
      props.pattern.pattern.includes('price')
    ) {
      patternForm.category = 'number'
    } else {
      patternForm.category = 'custom'
    }
  }
}

// 从模式生成示例
const generateExampleFromPattern = () => {
  if (!props.pattern) return ''

  switch (props.pattern.type) {
    case 'wildcard':
      return props.pattern.pattern.replace(/\*/g, 'example')
    case 'prefix':
      return props.pattern.pattern + 'example'
    case 'suffix':
      return 'example' + props.pattern.pattern
    case 'contains':
      return 'example' + props.pattern.pattern + 'text'
    default:
      return 'example_text'
  }
}

// 提取默认标签
const extractDefaultTags = () => {
  const tags = []
  const pattern = props.pattern?.pattern?.toLowerCase() || ''

  if (pattern.includes('drug') || pattern.includes('药品')) tags.push('药品')
  if (pattern.includes('time') || pattern.includes('date')) tags.push('时间')
  if (pattern.includes('amount') || pattern.includes('price')) tags.push('金额')
  if (pattern.includes('name')) tags.push('名称')
  if (pattern.includes('id')) tags.push('标识')

  return tags.slice(0, 3) // 限制标签数量
}

// 添加默认测试用例
const addDefaultTestCases = () => {
  testCases.value = [
    {
      input: generateExampleFromPattern(),
      expected: true,
      result: undefined
    },
    {
      input: 'non_matching_text',
      expected: false,
      result: undefined
    }
  ]
}

// 标签操作
const showTagInput = () => {
  tagInputVisible.value = true
  nextTick(() => {
    tagInputRef.value?.focus()
  })
}

const addTag = () => {
  const tag = tagInputValue.value.trim()
  if (tag && !patternForm.tags.includes(tag)) {
    patternForm.tags.push(tag)
  }
  tagInputVisible.value = false
  tagInputValue.value = ''
}

const removeTag = (tag: string) => {
  const index = patternForm.tags.indexOf(tag)
  if (index > -1) {
    patternForm.tags.splice(index, 1)
  }
}

// 测试用例操作
const addTestCase = () => {
  testCases.value.push({
    input: '',
    expected: true,
    result: undefined
  })
}

const removeTestCase = (index: number) => {
  testCases.value.splice(index, 1)
}

const validateTestCase = (index: number) => {
  const testCase = testCases.value[index]
  if (!testCase.input) {
    testCase.result = undefined
    return
  }

  // 根据模式类型验证
  try {
    let isMatch = false

    switch (props.pattern?.type) {
      case 'wildcard':
        isMatch = testWildcard(testCase.input, props.pattern.pattern)
        break
      case 'regex':
        const regex = new RegExp(props.pattern.pattern, 'i')
        isMatch = regex.test(testCase.input)
        break
      case 'prefix':
        isMatch = testCase.input.toLowerCase().startsWith(props.pattern.pattern.toLowerCase())
        break
      case 'suffix':
        isMatch = testCase.input.toLowerCase().endsWith(props.pattern.pattern.toLowerCase())
        break
      case 'contains':
        isMatch = testCase.input.toLowerCase().includes(props.pattern.pattern.toLowerCase())
        break
    }

    testCase.result = isMatch
  } catch (error) {
    testCase.result = false
  }
}

const testWildcard = (text: string, pattern: string): boolean => {
  const regexPattern = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\\\*/g, '.*')
    .replace(/\\\?/g, '.')

  const regex = new RegExp(`^${regexPattern}$`, 'i')
  return regex.test(text)
}

const runAllTests = async () => {
  testing.value = true

  // 模拟测试过程
  for (let i = 0; i < testCases.value.length; i++) {
    await new Promise((resolve) => setTimeout(resolve, 200))
    validateTestCase(i)
  }

  testing.value = false

  const passedTests = testCases.value.filter((tc) => tc.result === tc.expected).length
  const totalTests = testCases.value.length

  if (passedTests === totalTests) {
    ElMessage.success(`所有测试用例通过 (${passedTests}/${totalTests})`)
  } else {
    ElMessage.warning(`${passedTests}/${totalTests} 个测试用例通过`)
  }
}

// 工具方法
const getPatternTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    wildcard: '',
    regex: 'warning',
    prefix: 'success',
    suffix: 'info',
    contains: 'primary'
  }
  return colors[type] || ''
}

const getPatternTypeName = (type: string) => {
  const names: Record<string, string> = {
    wildcard: '通配符',
    regex: '正则表达式',
    prefix: '前缀匹配',
    suffix: '后缀匹配',
    contains: '包含匹配'
  }
  return names[type] || type
}

// 事件处理
const handleClose = () => {
  dialogVisible.value = false
}

const handleSave = async () => {
  try {
    // 表单验证
    const valid = await patternFormRef.value.validate()
    if (!valid) return

    saving.value = true

    const patternInfo = {
      name: patternForm.name,
      category: patternForm.category,
      description: patternForm.description,
      example: patternForm.example,
      tags: patternForm.tags,
      pattern: props.pattern,
      settings: patternSettings,
      testCases: testCases.value,
      createdAt: new Date().toISOString()
    }

    // 模拟保存
    await new Promise((resolve) => setTimeout(resolve, 1000))

    emit('confirm', patternInfo)
    ElMessage.success('模式保存成功')
    handleClose()
  } catch (error: any) {
    ElMessage.error('保存失败: ' + error.message)
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
.save-pattern-dialog {
  .pattern-container {
    max-height: 70vh;
    overflow-y: auto;

    .pattern-basic-info,
    .pattern-content-preview,
    .pattern-settings,
    .pattern-test-cases {
      margin-bottom: 20px;
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      overflow: hidden;
    }

    .section-header {
      padding: 12px 16px;
      background: #f8f9fa;
      border-bottom: 1px solid #e4e7ed;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;

      .header-icon {
        color: #409eff;
      }

      .header-title {
        flex: 1;
      }
    }

    .pattern-basic-info {
      .tags-input {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;

        .tag-item {
          margin: 0;
        }

        .tag-input {
          width: 100px;
        }

        .add-tag-btn {
          border: 1px dashed #d9d9d9;
          height: 24px;
        }
      }

      :deep(.el-form) {
        padding: 16px;
      }
    }

    .pattern-content-preview {
      .preview-content {
        padding: 16px;

        .pattern-code {
          background: #f5f5f5;
          padding: 4px 8px;
          border-radius: 4px;
          font-family: 'Fira Code', Consolas, monospace;
        }

        .pattern-config {
          margin-top: 16px;

          .config-header {
            font-weight: 500;
            margin-bottom: 8px;
            color: #606266;
          }

          .config-content {
            background: #2d3748;
            color: #e2e8f0;
            padding: 12px;
            border-radius: 6px;
            font-family: 'Fira Code', Consolas, monospace;
            font-size: 12px;
            overflow-x: auto;
          }
        }
      }
    }

    .pattern-settings {
      .settings-content {
        padding: 16px;

        .setting-help {
          margin-top: 4px;
        }
      }
    }

    .pattern-test-cases {
      .test-cases-content {
        padding: 16px;

        .test-case-item {
          border: 1px solid #e4e7ed;
          border-radius: 6px;
          margin-bottom: 12px;
          overflow: hidden;

          .test-case-header {
            padding: 8px 12px;
            background: #f8f9fa;
            border-bottom: 1px solid #e4e7ed;
            display: flex;
            justify-content: space-between;
            align-items: center;

            .test-case-title {
              font-weight: 500;
            }
          }

          .test-case-body {
            padding: 12px;
          }
        }

        .empty-test-cases {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          color: #909399;

          .empty-icon {
            font-size: 48px;
            margin-bottom: 16px;
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
  .save-pattern-dialog {
    .pattern-container {
      .pattern-content-preview .preview-content {
        .pattern-config .config-content {
          font-size: 10px;
        }
      }

      .pattern-test-cases .test-cases-content .test-case-item .test-case-body {
        :deep(.el-form-item) {
          margin-bottom: 12px;
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
