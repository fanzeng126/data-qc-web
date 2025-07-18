<template>
  <el-dialog
    v-model="dialogVisible"
    title="按模式选择字段"
    width="50%"
    :before-close="handleClose"
    destroy-on-close
    class="pattern-selection-dialog"
  >
    <div class="pattern-container">
      <!-- 模式类型选择 -->
      <div class="pattern-type-section">
        <div class="section-header">
          <Icon icon="ep:search" class="header-icon" />
          <span class="header-title">选择匹配模式</span>
        </div>

        <el-radio-group v-model="patternType" @change="handlePatternTypeChange">
          <el-radio-button label="wildcard">通配符</el-radio-button>
          <el-radio-button label="regex">正则表达式</el-radio-button>
          <el-radio-button label="prefix">前缀匹配</el-radio-button>
          <el-radio-button label="suffix">后缀匹配</el-radio-button>
          <el-radio-button label="contains">包含匹配</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 模式配置区 -->
      <div class="pattern-config-section">
        <!-- 通配符模式 -->
        <div v-if="patternType === 'wildcard'" class="wildcard-config">
          <div class="config-header">
            <Icon icon="ep:star" class="config-icon" />
            <span>通配符模式</span>
          </div>

          <div class="config-content">
            <el-form :model="wildcardConfig" label-width="100px">
              <el-form-item label="匹配模式">
                <el-input
                  v-model="wildcardConfig.pattern"
                  placeholder="输入通配符模式，如：drug_*_info"
                  @input="handlePatternChange"
                />
                <div class="pattern-help">
                  <el-text size="small" type="info"> 使用 * 表示任意字符，? 表示单个字符 </el-text>
                </div>
              </el-form-item>

              <el-form-item label="大小写">
                <el-checkbox v-model="wildcardConfig.caseSensitive">区分大小写</el-checkbox>
              </el-form-item>
            </el-form>

            <div class="pattern-examples">
              <div class="examples-header">常用示例：</div>
              <div class="example-list">
                <el-tag
                  v-for="example in wildcardExamples"
                  :key="example.pattern"
                  class="example-tag"
                  @click="applyExample(example.pattern)"
                >
                  {{ example.pattern }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 正则表达式模式 -->
        <div v-else-if="patternType === 'regex'" class="regex-config">
          <div class="config-header">
            <Icon icon="ep:cpu" class="config-icon" />
            <span>正则表达式模式</span>
          </div>

          <div class="config-content">
            <el-form :model="regexConfig" label-width="100px">
              <el-form-item label="正则表达式">
                <el-input
                  v-model="regexConfig.pattern"
                  placeholder="输入正则表达式，如：^drug_\w+$"
                  @input="handlePatternChange"
                />
                <div class="pattern-help">
                  <el-text size="small" type="info"> 使用标准JavaScript正则表达式语法 </el-text>
                </div>
              </el-form-item>

              <el-form-item label="匹配选项">
                <el-checkbox-group v-model="regexConfig.flags">
                  <el-checkbox label="i">忽略大小写 (i)</el-checkbox>
                  <el-checkbox label="g">全局匹配 (g)</el-checkbox>
                  <el-checkbox label="m">多行匹配 (m)</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
            </el-form>

            <div class="pattern-examples">
              <div class="examples-header">常用示例：</div>
              <div class="example-list">
                <div
                  v-for="example in regexExamples"
                  :key="example.pattern"
                  class="example-item"
                  @click="applyExample(example.pattern)"
                >
                  <div class="example-pattern">{{ example.pattern }}</div>
                  <div class="example-desc">{{ example.description }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 前缀匹配模式 -->
        <div v-else-if="patternType === 'prefix'" class="prefix-config">
          <div class="config-header">
            <Icon icon="ep:right" class="config-icon" />
            <span>前缀匹配模式</span>
          </div>

          <div class="config-content">
            <el-form :model="prefixConfig" label-width="100px">
              <el-form-item label="前缀">
                <el-input
                  v-model="prefixConfig.prefix"
                  placeholder="输入前缀，如：drug_"
                  @input="handlePatternChange"
                />
              </el-form-item>

              <el-form-item label="大小写">
                <el-checkbox v-model="prefixConfig.caseSensitive">区分大小写</el-checkbox>
              </el-form-item>
            </el-form>

            <div class="pattern-examples">
              <div class="examples-header">常用前缀：</div>
              <div class="example-list">
                <el-tag
                  v-for="prefix in commonPrefixes"
                  :key="prefix"
                  class="example-tag"
                  @click="applyExample(prefix)"
                >
                  {{ prefix }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 后缀匹配模式 -->
        <div v-else-if="patternType === 'suffix'" class="suffix-config">
          <div class="config-header">
            <Icon icon="ep:back" class="config-icon" />
            <span>后缀匹配模式</span>
          </div>

          <div class="config-content">
            <el-form :model="suffixConfig" label-width="100px">
              <el-form-item label="后缀">
                <el-input
                  v-model="suffixConfig.suffix"
                  placeholder="输入后缀，如：_time"
                  @input="handlePatternChange"
                />
              </el-form-item>

              <el-form-item label="大小写">
                <el-checkbox v-model="suffixConfig.caseSensitive">区分大小写</el-checkbox>
              </el-form-item>
            </el-form>

            <div class="pattern-examples">
              <div class="examples-header">常用后缀：</div>
              <div class="example-list">
                <el-tag
                  v-for="suffix in commonSuffixes"
                  :key="suffix"
                  class="example-tag"
                  @click="applyExample(suffix)"
                >
                  {{ suffix }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 包含匹配模式 -->
        <div v-else-if="patternType === 'contains'" class="contains-config">
          <div class="config-header">
            <Icon icon="ep:search" class="config-icon" />
            <span>包含匹配模式</span>
          </div>

          <div class="config-content">
            <el-form :model="containsConfig" label-width="100px">
              <el-form-item label="关键词">
                <el-input
                  v-model="containsConfig.keyword"
                  placeholder="输入关键词，如：name"
                  @input="handlePatternChange"
                />
              </el-form-item>

              <el-form-item label="大小写">
                <el-checkbox v-model="containsConfig.caseSensitive">区分大小写</el-checkbox>
              </el-form-item>
            </el-form>

            <div class="pattern-examples">
              <div class="examples-header">常用关键词：</div>
              <div class="example-list">
                <el-tag
                  v-for="keyword in commonKeywords"
                  :key="keyword"
                  class="example-tag"
                  @click="applyExample(keyword)"
                >
                  {{ keyword }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 模式测试区 -->
      <div class="pattern-test-section">
        <div class="section-header">
          <Icon icon="ep:cpu" class="header-icon" />
          <span class="header-title">模式测试</span>
        </div>

        <div class="test-content">
          <div class="test-input">
            <el-input v-model="testString" placeholder="输入测试字符串" @input="runPatternTest" />
          </div>

          <div class="test-result">
            <div class="result-header">
              <span>测试结果：</span>
              <el-tag :type="testResult.isMatch ? 'success' : 'danger'" size="small">
                {{ testResult.isMatch ? '匹配' : '不匹配' }}
              </el-tag>
            </div>

            <div v-if="testResult.matches && testResult.matches.length > 0" class="match-details">
              <div class="matches-header">匹配详情：</div>
              <div class="matches-list">
                <div v-for="(match, index) in testResult.matches" :key="index" class="match-item">
                  <span class="match-index">[{{ index }}]</span>
                  <span class="match-text">{{ match }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 预设模式库 -->
      <div class="preset-patterns-section">
        <div class="section-header">
          <Icon icon="ep:collection" class="header-icon" />
          <span class="header-title">预设模式库</span>
        </div>

        <div class="preset-content">
          <el-tabs v-model="activePresetTab" class="preset-tabs">
            <el-tab-pane label="药品相关" name="drug">
              <div class="preset-list">
                <div
                  v-for="preset in drugPresets"
                  :key="preset.id"
                  class="preset-item"
                  @click="applyPreset(preset)"
                >
                  <div class="preset-header">
                    <Icon :icon="preset.icon" class="preset-icon" />
                    <span class="preset-name">{{ preset.name }}</span>
                    <el-tag size="small" :type="getPatternTypeColor(preset.type)">
                      {{ getPatternTypeName(preset.type) }}
                    </el-tag>
                  </div>
                  <div class="preset-pattern">{{ preset.pattern }}</div>
                  <div class="preset-desc">{{ preset.description }}</div>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="时间相关" name="time">
              <div class="preset-list">
                <div
                  v-for="preset in timePresets"
                  :key="preset.id"
                  class="preset-item"
                  @click="applyPreset(preset)"
                >
                  <div class="preset-header">
                    <Icon :icon="preset.icon" class="preset-icon" />
                    <span class="preset-name">{{ preset.name }}</span>
                    <el-tag size="small" :type="getPatternTypeColor(preset.type)">
                      {{ getPatternTypeName(preset.type) }}
                    </el-tag>
                  </div>
                  <div class="preset-pattern">{{ preset.pattern }}</div>
                  <div class="preset-desc">{{ preset.description }}</div>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="数值相关" name="number">
              <div class="preset-list">
                <div
                  v-for="preset in numberPresets"
                  :key="preset.id"
                  class="preset-item"
                  @click="applyPreset(preset)"
                >
                  <div class="preset-header">
                    <Icon :icon="preset.icon" class="preset-icon" />
                    <span class="preset-name">{{ preset.name }}</span>
                    <el-tag size="small" :type="getPatternTypeColor(preset.type)">
                      {{ getPatternTypeName(preset.type) }}
                    </el-tag>
                  </div>
                  <div class="preset-pattern">{{ preset.pattern }}</div>
                  <div class="preset-desc">{{ preset.description }}</div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-left">
          <el-button @click="savePattern">
            <Icon icon="ep:collection-tag" class="mr-5px" />
            保存模式
          </el-button>
        </div>
        <div class="footer-right">
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" @click="handleConfirm" :disabled="!currentPattern">
            <Icon icon="ep:check" class="mr-5px" />
            确定
          </el-button>
        </div>
      </div>
    </template>

    <!-- 保存模式对话框 -->
    <SavePatternDialog
      v-model="showSavePattern"
      :pattern="currentPatternConfig"
      @confirm="handlePatternSaved"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import SavePatternDialog from './SavePatternDialog.vue'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', pattern: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 对话框状态
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 模式类型
const patternType = ref('wildcard')

// 各种模式配置
const wildcardConfig = reactive({
  pattern: '',
  caseSensitive: false
})

const regexConfig = reactive({
  pattern: '',
  flags: ['i']
})

const prefixConfig = reactive({
  prefix: '',
  caseSensitive: false
})

const suffixConfig = reactive({
  suffix: '',
  caseSensitive: false
})

const containsConfig = reactive({
  keyword: '',
  caseSensitive: false
})

// 测试相关
const testString = ref('')
const testResult = reactive({
  isMatch: false,
  matches: []
})

// 预设相关
const activePresetTab = ref('drug')
const showSavePattern = ref(false)

// 示例数据
const wildcardExamples = [
  { pattern: 'drug_*' },
  { pattern: '*_name' },
  { pattern: '*time*' },
  { pattern: 'batch_*_info' }
]

const regexExamples = [
  {
    pattern: '^drug_\\w+$',
    description: '以drug_开头的字段名'
  },
  {
    pattern: '\\d{4}-\\d{2}-\\d{2}',
    description: '日期格式(YYYY-MM-DD)'
  },
  {
    pattern: '[a-zA-Z]+_id$',
    description: '以_id结尾的字段'
  },
  {
    pattern: '^(amount|price|cost)_',
    description: '金额相关字段'
  }
]

const commonPrefixes = ['drug_', 'med_', 'hospital_', 'patient_', 'order_', 'batch_']

const commonSuffixes = ['_id', '_name', '_code', '_time', '_date', '_amount', '_count']

const commonKeywords = ['name', 'id', 'code', 'time', 'date', 'amount', 'price', 'count']

// 预设模式
const drugPresets = [
  {
    id: 'drug_basic',
    name: '药品基础字段',
    icon: 'ep:pills',
    type: 'wildcard',
    pattern: 'drug_*',
    description: '匹配所有以drug_开头的字段'
  },
  {
    id: 'drug_ypid',
    name: '药品本位码',
    icon: 'ep:key',
    type: 'regex',
    pattern: '^ypid|drug_code|med_id$',
    description: '匹配药品标识相关字段'
  },
  {
    id: 'drug_amount',
    name: '药品金额',
    icon: 'ep:money',
    type: 'contains',
    pattern: 'amount|price|cost',
    description: '匹配包含金额、价格的字段'
  }
]

const timePresets = [
  {
    id: 'time_fields',
    name: '时间字段',
    icon: 'ep:clock',
    type: 'suffix',
    pattern: '_time|_date',
    description: '匹配时间和日期字段'
  },
  {
    id: 'create_update',
    name: '创建更新时间',
    icon: 'ep:edit',
    type: 'regex',
    pattern: '(create|update|modify)_(time|date)',
    description: '匹配创建和更新时间字段'
  }
]

const numberPresets = [
  {
    id: 'count_fields',
    name: '计数字段',
    icon: 'ep:data-line',
    type: 'suffix',
    pattern: '_count|_num|_quantity',
    description: '匹配计数和数量字段'
  },
  {
    id: 'id_fields',
    name: 'ID字段',
    icon: 'ep:key',
    type: 'suffix',
    pattern: '_id',
    description: '匹配所有ID字段'
  }
]

// 计算当前模式
const currentPattern = computed(() => {
  switch (patternType.value) {
    case 'wildcard':
      return wildcardConfig.pattern
    case 'regex':
      return regexConfig.pattern
    case 'prefix':
      return prefixConfig.prefix
    case 'suffix':
      return suffixConfig.suffix
    case 'contains':
      return containsConfig.keyword
    default:
      return ''
  }
})

const currentPatternConfig = computed(() => {
  return {
    type: patternType.value,
    pattern: currentPattern.value,
    config: getCurrentConfig()
  }
})

// 监听模式变化
watch(currentPattern, () => {
  runPatternTest()
})

watch(testString, () => {
  runPatternTest()
})

// 方法
const handlePatternTypeChange = (type: string) => {
  // 切换模式类型时重置测试
  runPatternTest()
}

const handlePatternChange = () => {
  runPatternTest()
}

const getCurrentConfig = () => {
  switch (patternType.value) {
    case 'wildcard':
      return { ...wildcardConfig }
    case 'regex':
      return { ...regexConfig }
    case 'prefix':
      return { ...prefixConfig }
    case 'suffix':
      return { ...suffixConfig }
    case 'contains':
      return { ...containsConfig }
    default:
      return {}
  }
}

const applyExample = (pattern: string) => {
  switch (patternType.value) {
    case 'wildcard':
      wildcardConfig.pattern = pattern
      break
    case 'regex':
      regexConfig.pattern = pattern
      break
    case 'prefix':
      prefixConfig.prefix = pattern
      break
    case 'suffix':
      suffixConfig.suffix = pattern
      break
    case 'contains':
      containsConfig.keyword = pattern
      break
  }
}

const applyPreset = (preset: any) => {
  patternType.value = preset.type

  setTimeout(() => {
    applyExample(preset.pattern)
  }, 100)

  ElMessage.success(`已应用预设模式："${preset.name}"`)
}

const runPatternTest = () => {
  if (!testString.value || !currentPattern.value) {
    testResult.isMatch = false
    testResult.matches = []
    return
  }

  try {
    let isMatch = false
    let matches: string[] = []

    switch (patternType.value) {
      case 'wildcard':
        isMatch = testWildcard(testString.value, currentPattern.value, wildcardConfig.caseSensitive)
        if (isMatch) matches = [testString.value]
        break

      case 'regex':
        const flags = regexConfig.flags.join('')
        const regex = new RegExp(currentPattern.value, flags)
        const regexResult = testString.value.match(regex)
        isMatch = !!regexResult
        if (regexResult) matches = Array.from(regexResult)
        break

      case 'prefix':
        const prefixTest = prefixConfig.caseSensitive
          ? testString.value.startsWith(currentPattern.value)
          : testString.value.toLowerCase().startsWith(currentPattern.value.toLowerCase())
        isMatch = prefixTest
        if (isMatch) matches = [currentPattern.value]
        break

      case 'suffix':
        const suffixTest = suffixConfig.caseSensitive
          ? testString.value.endsWith(currentPattern.value)
          : testString.value.toLowerCase().endsWith(currentPattern.value.toLowerCase())
        isMatch = suffixTest
        if (isMatch) matches = [currentPattern.value]
        break

      case 'contains':
        const containsTest = containsConfig.caseSensitive
          ? testString.value.includes(currentPattern.value)
          : testString.value.toLowerCase().includes(currentPattern.value.toLowerCase())
        isMatch = containsTest
        if (isMatch) matches = [currentPattern.value]
        break
    }

    testResult.isMatch = isMatch
    testResult.matches = matches
  } catch (error) {
    testResult.isMatch = false
    testResult.matches = []
  }
}

const testWildcard = (text: string, pattern: string, caseSensitive: boolean): boolean => {
  if (!caseSensitive) {
    text = text.toLowerCase()
    pattern = pattern.toLowerCase()
  }

  // 将通配符转换为正则表达式
  const regexPattern = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // 转义特殊字符
    .replace(/\\\*/g, '.*') // * 转换为 .*
    .replace(/\\\?/g, '.') // ? 转换为 .

  const regex = new RegExp(`^${regexPattern}$`)
  return regex.test(text)
}

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
    regex: '正则',
    prefix: '前缀',
    suffix: '后缀',
    contains: '包含'
  }
  return names[type] || type
}

const savePattern = () => {
  if (!currentPattern.value) {
    ElMessage.warning('请先配置一个有效的模式')
    return
  }
  showSavePattern.value = true
}

const handlePatternSaved = (patternInfo: any) => {
  ElMessage.success(`模式"${patternInfo.name}"保存成功`)
}

const generateFinalPattern = (): string => {
  switch (patternType.value) {
    case 'wildcard':
      // 转换通配符为正则表达式
      let pattern = wildcardConfig.pattern
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\\\*/g, '.*')
        .replace(/\\\?/g, '.')

      if (!wildcardConfig.caseSensitive) {
        return `(?i)^${pattern}$`
      }
      return `^${pattern}$`

    case 'regex':
      const flags = regexConfig.flags.join('')
      return flags ? `(?${flags})${regexConfig.pattern}` : regexConfig.pattern

    case 'prefix':
      const prefix = prefixConfig.caseSensitive ? prefixConfig.prefix : `(?i)${prefixConfig.prefix}`
      return `^${prefix}`

    case 'suffix':
      const suffix = suffixConfig.caseSensitive ? suffixConfig.suffix : `(?i)${suffixConfig.suffix}`
      return `${suffix}$`

    case 'contains':
      const keyword = containsConfig.caseSensitive
        ? containsConfig.keyword
        : `(?i)${containsConfig.keyword}`
      return keyword

    default:
      return ''
  }
}

// 事件处理
const handleClose = () => {
  dialogVisible.value = false
}

const handleConfirm = () => {
  if (!currentPattern.value) {
    ElMessage.warning('请配置一个有效的模式')
    return
  }

  const finalPattern = generateFinalPattern()
  emit('confirm', finalPattern)
  handleClose()
}
</script>

<style lang="scss" scoped>
.pattern-selection-dialog {
  .pattern-container {
    max-height: 70vh;
    overflow-y: auto;

    .pattern-type-section,
    .pattern-config-section,
    .pattern-test-section,
    .preset-patterns-section {
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

    .pattern-type-section {
      padding: 16px;
      border: none;

      :deep(.el-radio-button__inner) {
        padding: 8px 16px;
      }
    }

    .pattern-config-section {
      .wildcard-config,
      .regex-config,
      .prefix-config,
      .suffix-config,
      .contains-config {
        padding: 16px;

        .config-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 16px;
          font-weight: 500;

          .config-icon {
            color: #409eff;
          }
        }

        .config-content {
          .pattern-help {
            margin-top: 4px;
          }

          .pattern-examples {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #e4e7ed;

            .examples-header {
              margin-bottom: 8px;
              font-weight: 500;
              color: #606266;
            }

            .example-list {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;

              .example-tag {
                cursor: pointer;
                transition: all 0.3s;

                &:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }
              }

              .example-item {
                padding: 8px 12px;
                border: 1px solid #e4e7ed;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s;
                margin-bottom: 8px;

                &:hover {
                  border-color: #409eff;
                  background: rgba(64, 158, 255, 0.05);
                }

                .example-pattern {
                  font-family: 'Fira Code', Consolas, monospace;
                  font-weight: 500;
                  margin-bottom: 2px;
                }

                .example-desc {
                  font-size: 12px;
                  color: #606266;
                }
              }
            }
          }
        }
      }
    }

    .pattern-test-section {
      .test-content {
        padding: 16px;

        .test-input {
          margin-bottom: 16px;
        }

        .test-result {
          .result-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            font-weight: 500;
          }

          .match-details {
            background: #f8f9fa;
            padding: 12px;
            border-radius: 6px;
            border-left: 4px solid #67c23a;

            .matches-header {
              font-weight: 500;
              margin-bottom: 8px;
              color: #606266;
            }

            .matches-list {
              .match-item {
                margin-bottom: 4px;
                font-family: 'Fira Code', Consolas, monospace;

                .match-index {
                  color: #909399;
                  margin-right: 8px;
                }

                .match-text {
                  background: #e7f3ff;
                  padding: 2px 6px;
                  border-radius: 3px;
                  color: #409eff;
                }
              }
            }
          }
        }
      }
    }

    .preset-patterns-section {
      .preset-content {
        padding: 16px;

        .preset-tabs {
          :deep(.el-tabs__content) {
            padding-top: 16px;
          }
        }

        .preset-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 12px;

          .preset-item {
            padding: 12px;
            border: 1px solid #e4e7ed;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s;

            &:hover {
              border-color: #409eff;
              background: rgba(64, 158, 255, 0.05);
              transform: translateY(-2px);
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            .preset-header {
              display: flex;
              align-items: center;
              gap: 6px;
              margin-bottom: 6px;

              .preset-icon {
                color: #409eff;
              }

              .preset-name {
                flex: 1;
                font-weight: 500;
              }
            }

            .preset-pattern {
              font-family: 'Fira Code', Consolas, monospace;
              background: #f5f5f5;
              padding: 4px 8px;
              border-radius: 3px;
              margin-bottom: 6px;
              font-size: 13px;
            }

            .preset-desc {
              font-size: 12px;
              color: #606266;
              line-height: 1.4;
            }
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
  .pattern-selection-dialog {
    .pattern-container {
      .pattern-config-section {
        .config-content .pattern-examples .example-list {
          .example-item {
            width: 100%;
          }
        }
      }

      .preset-patterns-section {
        .preset-content .preset-list {
          grid-template-columns: 1fr;
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
