<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-form-item label="任务名称" prop="taskName">
        <el-input v-model="formData.taskName" placeholder="请输入任务名称" />
      </el-form-item>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="上报开始时间" prop="startDate">
            <el-date-picker
              v-model="formData.startDate"
              type="date"
              value-format="x"
              placeholder="选择开始时间"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="上报截止时间" prop="endDate">
            <el-date-picker
              v-model="formData.endDate"
              type="date"
              value-format="x"
              placeholder="选择截止时间"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="任务描述" prop="description">
        <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入任务描述" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { ReportTaskApi, ReportTaskVO } from '@/api/drug/reporttask'

/** 填报任务设置 表单 */
defineOptions({ name: 'ReportTaskForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  taskName: undefined,
  startDate: undefined,
  endDate: undefined,
  description: undefined,
})
const formRules = reactive({
  taskName: [{ required: true, message: '任务名称不能为空', trigger: 'blur' }],
  startDate: [{ required: true, message: '上报开始时间不能为空', trigger: 'blur' }],
  endDate: [{ required: true, message: '上报截止时间不能为空', trigger: 'blur' }],
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
      formData.value = await ReportTaskApi.getReportTask(id)
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
    const data = formData.value as unknown as ReportTaskVO
    if (formType.value === 'create') {
      await ReportTaskApi.createReportTask(data)
      message.success(t('common.createSuccess'))
    } else {
      await ReportTaskApi.updateReportTask(data)
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
    taskName: undefined,
    startDate: undefined,
    endDate: undefined,
    description: undefined,
  }
  formRef.value?.resetFields()
}
</script>
