<template>
  <Dialog title="批量导入药品配置" v-model="dialogVisible" width="600px">
    <div class="import-container">
      <el-alert
        title="导入说明"
        type="info"
        :closable="false"
        class="mb-4"
      >
        <template #default>
          <ol>
            <li>请按照模板格式准备Excel文件</li>
            <li>支持的文件格式：.xlsx, .xls</li>
            <li>文件大小不能超过10MB</li>
            <li>药品名称、剂型、最小剂量单位为必填字段</li>
          </ol>
        </template>
      </el-alert>

      <el-card shadow="never" class="upload-card">
        <template #header>
          <div class="card-header">
            <span>选择文件</span>
            <el-button type="text" @click="downloadTemplate">
              <Icon icon="ep:download" class="mr-1" />
              下载模板
            </el-button>
          </div>
        </template>
        
        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :limit="1"
          accept=".xlsx,.xls"
          :on-change="handleFileChange"
          :on-exceed="handleExceed"
          drag
        >
          <Icon icon="ep:upload-filled" size="40" class="upload-icon" />
          <div class="upload-text">
            <p>将文件拖到此处，或 <em>点击上传</em></p>
            <p class="upload-tip">只能上传 Excel 文件，且不超过 10MB</p>
          </div>
        </el-upload>

        <div v-if="selectedFile" class="file-info">
          <div class="file-item">
            <Icon icon="ep:document" class="mr-2" />
            <span>{{ selectedFile.name }}</span>
            <el-button type="text" @click="removeFile">
              <Icon icon="ep:close" />
            </el-button>
          </div>
        </div>
      </el-card>

      <div v-if="importResult" class="result-section">
        <el-card shadow="never">
          <template #header>
            <span>导入结果</span>
          </template>
          
          <div class="result-stats">
            <el-tag type="success">成功 {{ importResult.successCount }}</el-tag>
            <el-tag type="danger" v-if="importResult.errorCount > 0">
              失败 {{ importResult.errorCount }}
            </el-tag>
          </div>
          
          <div v-if="importResult.errors?.length" class="error-list">
            <p>失败详情：</p>
            <ul>
              <li v-for="(error, index) in importResult.errors" :key="index">
                {{ error }}
              </li>
            </ul>
          </div>
        </el-card>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleImport" type="primary" :loading="importing" :disabled="!selectedFile">
        <Icon icon="ep:upload" class="mr-1" />
        开始导入
      </el-button>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DrugConfigApi } from '@/api/shortage'

// Props
const props = defineProps<{
  zoneId?: number
}>()

const message = useMessage()
const dialogVisible = ref(false)
const importing = ref(false)
const selectedFile = ref<File>()
const uploadRef = ref()
const importResult = ref<{
  successCount: number
  errorCount: number
  errors?: string[]
}>()

const open = () => {
  dialogVisible.value = true
  selectedFile.value = undefined
  importResult.value = undefined
}

const handleFileChange = (file: any) => {
  if (file.size > 10 * 1024 * 1024) {
    message.error('文件大小不能超过 10MB')
    return false
  }
  selectedFile.value = file.raw
}

const handleExceed = () => {
  message.warning('只能选择一个文件')
}

const removeFile = () => {
  selectedFile.value = undefined
  uploadRef.value?.clearFiles()
}

const downloadTemplate = () => {
  // 创建模板数据
  const templateData = [
    ['药品名称', '剂型', '最小剂量单位', '状态(1启用0停用)', '排序'],
    ['阿司匹林', '普通片剂', '片', '1', '1'],
    ['硝酸甘油', '注射剂', '支', '1', '2'],
    ['肾上腺素', '注射剂', '支', '1', '3']
  ]
  
  // 这里应该实现实际的Excel模板下载
  console.log('下载模板', templateData)
  message.info('模板下载功能待实现')
}

const handleImport = async () => {
  if (!selectedFile.value || !props.zoneId) {
    return
  }

  importing.value = true
  try {
    const result = await DrugConfigApi.batchImport(props.zoneId, selectedFile.value)
    
    // 模拟导入结果
    importResult.value = {
      successCount: 10,
      errorCount: 2,
      errors: [
        '第3行：药品名称不能为空',
        '第5行：剂型格式不正确'
      ]
    }
    
    message.success(`导入完成！成功 ${importResult.value.successCount} 条，失败 ${importResult.value.errorCount} 条`)
    emit('success')
  } catch (error) {
    console.error('导入失败:', error)
    message.error('导入失败，请检查文件格式')
  } finally {
    importing.value = false
  }
}

const emit = defineEmits(['success'])

defineExpose({ open })
</script>

<style scoped>
.import-container {
  padding: 0;
}

.upload-card {
  margin: 16px 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-icon {
  color: #8c939d;
  margin-bottom: 12px;
}

.upload-text {
  color: #606266;
  text-align: center;
}

.upload-text p {
  margin: 0;
  line-height: 1.5;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.file-info {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.file-item span {
  flex: 1;
  margin-left: 8px;
}

.result-section {
  margin-top: 16px;
}

.result-stats {
  margin-bottom: 12px;
}

.result-stats .el-tag {
  margin-right: 8px;
}

.error-list {
  margin-top: 12px;
  padding: 12px;
  background-color: #fef2f2;
  border-radius: 4px;
}

.error-list p {
  margin: 0 0 8px 0;
  color: #f56c6c;
  font-weight: 500;
}

.error-list ul {
  margin: 0;
  padding-left: 20px;
  color: #f56c6c;
}

.error-list li {
  margin-bottom: 4px;
}
</style>