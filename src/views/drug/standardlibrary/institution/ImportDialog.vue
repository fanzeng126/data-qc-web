<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px">
      <el-form-item label="导入方式">
        <el-radio-group v-model="importMode" @change="handleImportModeChange">
          <el-radio value="new">创建新版本</el-radio>
          <el-radio value="existing" :disabled="!hasExistingVersions">导入到现有版本</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 新版本创建 -->
      <template v-if="importMode === 'new'">
        <el-form-item label="版本编码" prop="versionCode">
          <el-input
            v-model="formData.versionCode"
            placeholder="如：v2024.1"
            :disabled="importing"
          />
        </el-form-item>
        <el-form-item label="版本名称" prop="versionName">
          <el-input
            v-model="formData.versionName"
            placeholder="请输入版本名称"
            :disabled="importing"
          />
        </el-form-item>
        <el-form-item label="版本描述">
          <el-input
            v-model="formData.versionDescription"
            type="textarea"
            rows="3"
            placeholder="请输入版本描述"
            :disabled="importing"
          />
        </el-form-item>
        <el-form-item label="导入类型" prop="importType">
          <el-radio-group v-model="formData.importType" :disabled="importing">
            <el-radio :value="1">全量导入</el-radio>
            <el-radio :value="2">增量导入</el-radio>
          </el-radio-group>
        </el-form-item>
      </template>

      <!-- 现有版本选择 -->
      <template v-else>
        <el-form-item label="选择版本" prop="selectedVersionId">
          <el-select
            v-model="formData.selectedVersionId"
            placeholder="请选择版本"
            :disabled="importing"
            class="w-full"
          >
            <el-option
              v-for="version in availableVersions"
              :key="version.id"
              :label="`${version.versionCode} - ${version.versionName}`"
              :value="version.id"
            />
          </el-select>
        </el-form-item>
      </template>

      <el-form-item label="选择文件" prop="file">
        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :show-file-list="true"
          :limit="1"
          accept=".xlsx,.xls,.csv"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          :disabled="importing"
        >
          <el-button :disabled="importing">
            <Icon icon="ep:upload" class="mr-5px" />
            选择文件
          </el-button>
          <template #tip>
            <div class="el-upload__tip"> 支持xlsx/xls/csv文件，且不超过200MB </div>
          </template>
        </el-upload>
      </el-form-item>

      <!-- 导入进度 -->
      <el-form-item v-if="importing">
        <div class="import-progress">
          <el-progress :percentage="importProgress" :status="importStatus" :stroke-width="8" />
          <div class="progress-text mt-2">{{ progressText }}</div>
        </div>
      </el-form-item>

      <!-- 导入结果 -->
      <el-form-item v-if="importResult">
        <el-alert
          :title="importResult.success ? '导入成功' : '导入失败'"
          :type="importResult.success ? 'success' : 'error'"
          :description="importResult.message"
          show-icon
          :closable="false"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false" :disabled="importing">取 消</el-button>
      <el-button
        type="primary"
        @click="handleImport"
        :loading="importing"
        :disabled="!canImport"
      >
        {{ importing ? '导入中...' : '开始导入' }}
      </el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { InstitutionVersionApi, StandardVersionVO } from '@/api/drug/standardlibrary/version'

defineOptions({ name: 'InstitutionImportDialog' })

const message = useMessage()

// 基础状态
const dialogVisible = ref(false)
const dialogTitle = ref('导入机构数据')
const formRef = ref()
const uploadRef = ref()

// 导入模式
const importMode = ref<'new' | 'existing'>('new')
const importing = ref(false)
const importProgress = ref(0)
const importStatus = ref<'success' | 'exception' | undefined>(undefined)
const progressText = ref('')
const importResult = ref<any>(null)

// 版本数据
const availableVersions = ref<StandardVersionVO[]>([])
const hasExistingVersions = computed(() => availableVersions.value.length > 0)

// 表单数据
const formData = ref({
  versionCode: '',
  versionName: '',
  versionDescription: '',
  importType: 1,
  selectedVersionId: undefined,
  file: null as File | null
})

// 表单验证规则
const formRules = computed(() => {
  const baseRules = {
    file: [{ required: true, message: '请选择要导入的文件', trigger: 'change' }]
  }
  
  if (importMode.value === 'new') {
    return {
      ...baseRules,
      versionCode: [{ required: true, message: '版本编码不能为空', trigger: 'blur' }],
      versionName: [{ required: true, message: '版本名称不能为空', trigger: 'blur' }],
      importType: [{ required: true, message: '请选择导入类型', trigger: 'change' }]
    }
  } else {
    return {
      ...baseRules,
      selectedVersionId: [{ required: true, message: '请选择版本', trigger: 'change' }]
    }
  }
})

// 计算属性
const canImport = computed(() => {
  if (importing.value) return false
  if (!formData.value.file) return false
  
  if (importMode.value === 'new') {
    return formData.value.versionCode && formData.value.versionName
  } else {
    return formData.value.selectedVersionId
  }
})

/** 打开对话框 */
const open = async (versionId?: number) => {
  dialogVisible.value = true
  resetForm()
  
  if (versionId) {
    importMode.value = 'existing'
    formData.value.selectedVersionId = versionId
  }
  
  await loadAvailableVersions()
}

/** 为特定版本打开 */
const openForVersion = (versionId: number) => {
  open(versionId)
}

defineExpose({ open, openForVersion })

/** 重置表单 */
const resetForm = () => {
  importMode.value = 'new'
  importing.value = false
  importProgress.value = 0
  importStatus.value = undefined
  progressText.value = ''
  importResult.value = null
  
  formData.value = {
    versionCode: `v${new Date().getFullYear()}.${new Date().getMonth() + 1}`,
    versionName: '',
    versionDescription: '',
    importType: 1,
    selectedVersionId: undefined,
    file: null
  }
  
  formRef.value?.resetFields()
  uploadRef.value?.clearFiles()
}

/** 加载可用版本 */
const loadAvailableVersions = async () => {
  try {
    const versions = await InstitutionVersionApi.getInstitutionVersionList()
    // 过滤掉已发布的版本，只显示可以继续导入的版本
    availableVersions.value = versions.filter(v => v.status !== 4)
  } catch (error) {
    console.error('加载版本列表失败:', error)
  }
}

/** 导入模式变更 */
const handleImportModeChange = (value: string) => {
  formData.value.selectedVersionId = undefined
  formRef.value?.clearValidate()
}

/** 文件变更 */
const handleFileChange = (file: any) => {
  formData.value.file = file.raw
  formRef.value?.clearValidate(['file'])
  
  // 检查文件类型
  const fileName = file.name
  if (fileName.endsWith('.csv')) {
    // 预览CSV文件内容进行验证
    previewCsvFile(file.raw)
  }
}

/** 预览CSV文件内容 */
const previewCsvFile = (file: File) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    const lines = text.split('\n')
    
    // 验证CSV格式
    if (lines.length < 2) {
      message.error('CSV文件格式错误：文件内容不足')
      return
    }
    
    const headers = lines[0].split(',').map(h => h.trim())
    const expectedHeaders = [
      '唯一编码', '机构名称', '机构类别', '行政区划', '负责人', '联系电话',
      '有效期开始日期', '有效期结束日期', '机构代码', '统一社会信用代码',
      '经济类型', '乡镇街道代码', '医院等级(等)', '医院等级(级)', '联系人'
    ]
    
    // 验证表头是否匹配
    const headerMismatch = expectedHeaders.some(expected => 
      !headers.includes(expected)
    )
    
    if (headerMismatch) {
      message.warning(`CSV表头格式提示：请确保包含以下字段：${expectedHeaders.join('、')}`)
    } else {
      message.success(`CSV文件格式正确，共${lines.length - 1}行数据`)
    }
  }
  reader.readAsText(file, 'UTF-8')
}

/** 文件移除 */
const handleFileRemove = () => {
  formData.value.file = null
}

/** 开始导入 */
const handleImport = async () => {
  try {
    await formRef.value?.validate()
    
    importing.value = true
    importProgress.value = 5
    progressText.value = '准备导入...'
    importResult.value = null
    
    const file = formData.value.file!
    const formDataToSend = new FormData()
    
    if (importMode.value === 'new') {
      // 创建新版本并导入
      const versionData = {
        versionCode: formData.value.versionCode,
        versionName: formData.value.versionName,
        versionDescription: formData.value.versionDescription,
        importType: formData.value.importType,
        libraryType: 2, // 机构标准库类型
        status: 1 // 导入中状态
      }
      
      // 添加版本数据到FormData
      formDataToSend.append('data', new Blob([JSON.stringify(versionData)], { 
        type: 'application/json' 
      }))
      formDataToSend.append('file', file)
      
      progressText.value = '创建版本并导入数据...'
      
      const result = await InstitutionVersionApi.createVersionAndImport(formDataToSend)
      
      importProgress.value = 100
      importStatus.value = 'success'
      progressText.value = '导入完成'
      
      importResult.value = {
        success: true,
        message: `成功创建版本并开始导入`
      }
      
      message.success('版本创建成功，正在后台导入数据')
      emit('success', result)
      
      // 导入完成后关闭模态框
      setTimeout(() => {
        dialogVisible.value = false
      }, 1500)
      
    } else {
      // 导入到现有版本
      progressText.value = '导入数据到现有版本...'
      
      const result = await InstitutionVersionApi.importDataToVersion(
        formData.value.selectedVersionId!,
        file
      )
      
      importProgress.value = 100
      importStatus.value = 'success'
      progressText.value = '导入完成'
      
      importResult.value = {
        success: true,
        message: `成功导入 ${result.totalRecords || 0} 条记录`
      }
      
      message.success('导入成功')
      emit('success', result)
      
      // 导入完成后关闭模态框
      setTimeout(() => {
        dialogVisible.value = false
      }, 1500)
    }
    
  } catch (error: any) {
    importing.value = false
    importProgress.value = 0
    importStatus.value = 'exception'
    progressText.value = '导入失败'
    
    importResult.value = {
      success: false,
      message: error.message || '导入过程中发生错误'
    }
    
    message.error('导入失败: ' + (error.message || '未知错误'))
  }
}

const emit = defineEmits(['success'])
</script>

<style scoped>
.import-progress {
  width: 100%;
}

.progress-text {
  text-align: center;
  color: #606266;
  font-size: 14px;
}
</style>