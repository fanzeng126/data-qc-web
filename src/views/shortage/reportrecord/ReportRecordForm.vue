<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="专区ID" prop="zoneId">
        <el-input v-model="formData.zoneId" placeholder="请输入专区ID" />
      </el-form-item>
      <el-form-item label="药品配置ID" prop="drugConfigId">
        <el-input v-model="formData.drugConfigId" placeholder="请输入药品配置ID" />
      </el-form-item>
      <el-form-item label="机构ID" prop="orgId">
        <el-input v-model="formData.orgId" placeholder="请输入机构ID" />
      </el-form-item>
      <el-form-item label="填报周期(YYYY-WW)" prop="reportWeek">
        <el-input v-model="formData.reportWeek" placeholder="请输入填报周期(YYYY-WW)" />
      </el-form-item>
      <el-form-item label="填报日期" prop="reportDate">
        <el-date-picker
          v-model="formData.reportDate"
          type="date"
          value-format="x"
          placeholder="选择填报日期"
        />
      </el-form-item>
      <el-form-item label="本周累计使用量" prop="weekUsageAmount">
        <el-input v-model="formData.weekUsageAmount" placeholder="请输入本周累计使用量" />
      </el-form-item>
      <el-form-item label="当日实时库存量" prop="currentStockAmount">
        <el-input v-model="formData.currentStockAmount" placeholder="请输入当日实时库存量" />
      </el-form-item>
      <el-form-item label="供应情况: 1-充足 2-较充足 3-短缺 4-严重短缺" prop="supplyStatus">
        <el-radio-group v-model="formData.supplyStatus">
          <el-radio value="1">请选择字典生成</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { ReportRecordApi, ReportRecordVO } from '@/api/shortage/reportrecord'

/** 药品填报记录 表单 */
defineOptions({ name: 'ReportRecordForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  zoneId: undefined,
  drugConfigId: undefined,
  orgId: undefined,
  reportWeek: undefined,
  reportDate: undefined,
  weekUsageAmount: undefined,
  currentStockAmount: undefined,
  supplyStatus: undefined,
})
const formRules = reactive({
  zoneId: [{ required: true, message: '专区ID不能为空', trigger: 'blur' }],
  drugConfigId: [{ required: true, message: '药品配置ID不能为空', trigger: 'blur' }],
  orgId: [{ required: true, message: '机构ID不能为空', trigger: 'blur' }],
  reportWeek: [{ required: true, message: '填报周期(YYYY-WW)不能为空', trigger: 'blur' }],
  reportDate: [{ required: true, message: '填报日期不能为空', trigger: 'blur' }],
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
      formData.value = await ReportRecordApi.getReportRecord(id)
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
    const data = formData.value as unknown as ReportRecordVO
    if (formType.value === 'create') {
      await ReportRecordApi.createReportRecord(data)
      message.success(t('common.createSuccess'))
    } else {
      await ReportRecordApi.updateReportRecord(data)
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
    zoneId: undefined,
    drugConfigId: undefined,
    orgId: undefined,
    reportWeek: undefined,
    reportDate: undefined,
    weekUsageAmount: undefined,
    currentStockAmount: undefined,
    supplyStatus: undefined,
  }
  formRef.value?.resetFields()
}
</script>