<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="任务编号（格式：DRUG_YYYYMMDD_XXXXXX）" prop="taskNo">
        <el-input v-model="formData.taskNo" placeholder="请输入任务编号（格式：DRUG_YYYYMMDD_XXXXXX）" />
      </el-form-item>
      <el-form-item label="任务名称" prop="taskName">
        <el-input v-model="formData.taskName" placeholder="请输入任务名称" />
      </el-form-item>
      <el-form-item label="导入类型:1-单文件,2-压缩包" prop="importType">
        <el-select v-model="formData.importType" placeholder="请选择导入类型:1-单文件,2-压缩包">
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item>
      <el-form-item label="原始文件名称" prop="fileName">
        <el-input v-model="formData.fileName" placeholder="请输入原始文件名称" />
      </el-form-item>
      <el-form-item label="文件存储路径" prop="filePath">
        <el-input v-model="formData.filePath" placeholder="请输入文件存储路径" />
      </el-form-item>
      <el-form-item label="文件大小(字节)" prop="fileSize">
        <el-input v-model="formData.fileSize" placeholder="请输入文件大小(字节)" />
      </el-form-item>
      <el-form-item label="解压后的文件列表(JSON格式)" prop="extractedFiles">
        <el-input v-model="formData.extractedFiles" placeholder="请输入解压后的文件列表(JSON格式)" />
      </el-form-item>
      <el-form-item label="任务状态:0-待处理,1-解压中,2-数据导入中,3-质控中,4-完成,5-失败,6-部分成功" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio value="1">请选择字典生成</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="解压状态:0-未开始,1-进行中,2-成功,3-失败" prop="extractStatus">
        <el-radio-group v-model="formData.extractStatus">
          <el-radio value="1">请选择字典生成</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="导入状态:0-未开始,1-进行中,2-成功,3-失败" prop="importStatus">
        <el-radio-group v-model="formData.importStatus">
          <el-radio value="1">请选择字典生成</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="质控状态:0-未开始,1-进行中,2-成功,3-失败" prop="qcStatus">
        <el-radio-group v-model="formData.qcStatus">
          <el-radio value="1">请选择字典生成</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="预期文件数量" prop="totalFiles">
        <el-input v-model="formData.totalFiles" placeholder="请输入预期文件数量" />
      </el-form-item>
      <el-form-item label="成功文件数" prop="successFiles">
        <el-input v-model="formData.successFiles" placeholder="请输入成功文件数" />
      </el-form-item>
      <el-form-item label="失败文件数" prop="failedFiles">
        <el-input v-model="formData.failedFiles" placeholder="请输入失败文件数" />
      </el-form-item>
      <el-form-item label="总记录数" prop="totalRecords">
        <el-input v-model="formData.totalRecords" placeholder="请输入总记录数" />
      </el-form-item>
      <el-form-item label="成功记录数" prop="successRecords">
        <el-input v-model="formData.successRecords" placeholder="请输入成功记录数" />
      </el-form-item>
      <el-form-item label="失败记录数" prop="failedRecords">
        <el-input v-model="formData.failedRecords" placeholder="请输入失败记录数" />
      </el-form-item>
      <el-form-item label="整体进度百分比" prop="progressPercent">
        <el-input v-model="formData.progressPercent" placeholder="请输入整体进度百分比" />
      </el-form-item>
      <el-form-item label="各表处理进度(JSON格式)" prop="tableProgress">
        <el-input v-model="formData.tableProgress" placeholder="请输入各表处理进度(JSON格式)" />
      </el-form-item>
      <el-form-item label="开始处理时间" prop="startTime">
        <el-date-picker
          v-model="formData.startTime"
          type="date"
          value-format="x"
          placeholder="选择开始处理时间"
        />
      </el-form-item>
      <el-form-item label="解压完成时间" prop="extractEndTime">
        <el-date-picker
          v-model="formData.extractEndTime"
          type="date"
          value-format="x"
          placeholder="选择解压完成时间"
        />
      </el-form-item>
      <el-form-item label="导入完成时间" prop="importEndTime">
        <el-date-picker
          v-model="formData.importEndTime"
          type="date"
          value-format="x"
          placeholder="选择导入完成时间"
        />
      </el-form-item>
      <el-form-item label="质控完成时间" prop="qcEndTime">
        <el-date-picker
          v-model="formData.qcEndTime"
          type="date"
          value-format="x"
          placeholder="选择质控完成时间"
        />
      </el-form-item>
      <el-form-item label="任务结束时间" prop="endTime">
        <el-date-picker
          v-model="formData.endTime"
          type="date"
          value-format="x"
          placeholder="选择任务结束时间"
        />
      </el-form-item>
      <el-form-item label="错误信息" prop="errorMessage">
        <el-input v-model="formData.errorMessage" placeholder="请输入错误信息" />
      </el-form-item>
      <el-form-item label="详细错误信息(JSON格式)" prop="errorDetail">
        <el-input v-model="formData.errorDetail" placeholder="请输入详细错误信息(JSON格式)" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { ImportTaskApi, ImportTaskVO } from '@/api/drug/importtask'

/** 药品数据导入任务 表单 */
defineOptions({ name: 'ImportTaskForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  taskNo: undefined,
  taskName: undefined,
  importType: undefined,
  fileName: undefined,
  filePath: undefined,
  fileSize: undefined,
  extractedFiles: undefined,
  status: undefined,
  extractStatus: undefined,
  importStatus: undefined,
  qcStatus: undefined,
  totalFiles: undefined,
  successFiles: undefined,
  failedFiles: undefined,
  totalRecords: undefined,
  successRecords: undefined,
  failedRecords: undefined,
  progressPercent: undefined,
  tableProgress: undefined,
  startTime: undefined,
  extractEndTime: undefined,
  importEndTime: undefined,
  qcEndTime: undefined,
  endTime: undefined,
  errorMessage: undefined,
  errorDetail: undefined,
})
const formRules = reactive({
  taskNo: [{ required: true, message: '任务编号（格式：DRUG_YYYYMMDD_XXXXXX）不能为空', trigger: 'blur' }],
  taskName: [{ required: true, message: '任务名称不能为空', trigger: 'blur' }],
  importType: [{ required: true, message: '导入类型:1-单文件,2-压缩包不能为空', trigger: 'change' }],
  fileName: [{ required: true, message: '原始文件名称不能为空', trigger: 'blur' }],
  filePath: [{ required: true, message: '文件存储路径不能为空', trigger: 'blur' }],
  fileSize: [{ required: true, message: '文件大小(字节)不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '任务状态:0-待处理,1-解压中,2-数据导入中,3-质控中,4-完成,5-失败,6-部分成功不能为空', trigger: 'blur' }],
  extractStatus: [{ required: true, message: '解压状态:0-未开始,1-进行中,2-成功,3-失败不能为空', trigger: 'blur' }],
  importStatus: [{ required: true, message: '导入状态:0-未开始,1-进行中,2-成功,3-失败不能为空', trigger: 'blur' }],
  qcStatus: [{ required: true, message: '质控状态:0-未开始,1-进行中,2-成功,3-失败不能为空', trigger: 'blur' }],
  totalFiles: [{ required: true, message: '预期文件数量不能为空', trigger: 'blur' }],
  successFiles: [{ required: true, message: '成功文件数不能为空', trigger: 'blur' }],
  failedFiles: [{ required: true, message: '失败文件数不能为空', trigger: 'blur' }],
  totalRecords: [{ required: true, message: '总记录数不能为空', trigger: 'blur' }],
  successRecords: [{ required: true, message: '成功记录数不能为空', trigger: 'blur' }],
  failedRecords: [{ required: true, message: '失败记录数不能为空', trigger: 'blur' }],
  progressPercent: [{ required: true, message: '整体进度百分比不能为空', trigger: 'blur' }],
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ImportTaskApi.getImportTask(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as ImportTaskVO
    if (formType.value === 'create') {
      await ImportTaskApi.createImportTask(data)
      message.success(t('common.createSuccess'))
    } else {
      await ImportTaskApi.updateImportTask(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    taskNo: undefined,
    taskName: undefined,
    importType: undefined,
    fileName: undefined,
    filePath: undefined,
    fileSize: undefined,
    extractedFiles: undefined,
    status: undefined,
    extractStatus: undefined,
    importStatus: undefined,
    qcStatus: undefined,
    totalFiles: undefined,
    successFiles: undefined,
    failedFiles: undefined,
    totalRecords: undefined,
    successRecords: undefined,
    failedRecords: undefined,
    progressPercent: undefined,
    tableProgress: undefined,
    startTime: undefined,
    extractEndTime: undefined,
    importEndTime: undefined,
    qcEndTime: undefined,
    endTime: undefined,
    errorMessage: undefined,
    errorDetail: undefined,
  }
  formRef.value?.resetFields()
}
</script>