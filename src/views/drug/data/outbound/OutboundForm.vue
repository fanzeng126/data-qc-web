<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="导入任务ID" prop="taskId">
        <el-input v-model="formData.taskId" placeholder="请输入导入任务ID" />
      </el-form-item>
      <el-form-item label="组织机构代码" prop="organizationCode">
        <el-input v-model="formData.organizationCode" placeholder="请输入组织机构代码" />
      </el-form-item>
      <el-form-item label="医疗机构代码" prop="hospitalCode">
        <el-input v-model="formData.hospitalCode" placeholder="请输入医疗机构代码" />
      </el-form-item>
      <el-form-item label="组织机构名称" prop="organizationName">
        <el-input v-model="formData.organizationName" placeholder="请输入组织机构名称" />
      </el-form-item>
      <el-form-item label="省级行政区划代码" prop="domainCode">
        <el-input v-model="formData.domainCode" placeholder="请输入省级行政区划代码" />
      </el-form-item>
      <el-form-item label="国家药管平台药品编码(YPID)" prop="ypid">
        <el-input v-model="formData.ypid" placeholder="请输入国家药管平台药品编码(YPID)" />
      </el-form-item>
      <el-form-item label="院内药品唯一码" prop="hospitalDrugId">
        <el-input v-model="formData.hospitalDrugId" placeholder="请输入院内药品唯一码" />
      </el-form-item>
      <el-form-item label="省级药品集中采购平台药品编码" prop="provinceDrugId">
        <el-input
          v-model="formData.provinceDrugId"
          placeholder="请输入省级药品集中采购平台药品编码"
        />
      </el-form-item>
      <el-form-item label="产品名称" prop="productName">
        <el-input v-model="formData.productName" placeholder="请输入产品名称" />
      </el-form-item>
      <el-form-item label="出库日期" prop="outboundDate">
        <el-date-picker
          v-model="formData.outboundDate"
          type="date"
          value-format="x"
          placeholder="选择出库日期"
        />
      </el-form-item>
      <el-form-item label="出库数量（最小销售包装单位）" prop="outboundPackQuantity">
        <el-input
          v-model="formData.outboundPackQuantity"
          placeholder="请输入出库数量（最小销售包装单位）"
        />
      </el-form-item>
      <el-form-item label="出库数量（最小制剂单位）" prop="outboundDosageQuantity">
        <el-input
          v-model="formData.outboundDosageQuantity"
          placeholder="请输入出库数量（最小制剂单位）"
        />
      </el-form-item>
      <el-form-item label="质控状态:0-未质控,1-质控通过,2-质控失败" prop="qcStatus">
        <el-radio-group v-model="formData.qcStatus">
          <el-radio value="1">请选择字典生成</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="质控结果详情(JSON格式)" prop="qcResult">
        <el-input v-model="formData.qcResult" placeholder="请输入质控结果详情(JSON格式)" />
      </el-form-item>
      <el-form-item label="错误信息" prop="errorMessage">
        <el-input v-model="formData.errorMessage" placeholder="请输入错误信息" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { OutboundApi, OutboundVO } from '@/api/drug/data/outbound'

/** 药品出库情况 表单 */
defineOptions({ name: 'OutboundForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  taskId: undefined,
  organizationCode: undefined,
  hospitalCode: undefined,
  organizationName: undefined,
  domainCode: undefined,
  ypid: undefined,
  hospitalDrugId: undefined,
  provinceDrugId: undefined,
  productName: undefined,
  outboundDate: undefined,
  outboundPackQuantity: undefined,
  outboundDosageQuantity: undefined,
  qcStatus: undefined,
  qcResult: undefined,
  errorMessage: undefined
})
const formRules = reactive({
  taskId: [{ required: true, message: '导入任务ID不能为空', trigger: 'blur' }],
  organizationCode: [{ required: true, message: '组织机构代码不能为空', trigger: 'blur' }],
  hospitalCode: [{ required: true, message: '医疗机构代码不能为空', trigger: 'blur' }],
  organizationName: [{ required: true, message: '组织机构名称不能为空', trigger: 'blur' }],
  domainCode: [{ required: true, message: '省级行政区划代码不能为空', trigger: 'blur' }],
  ypid: [{ required: true, message: '国家药管平台药品编码(YPID)不能为空', trigger: 'blur' }],
  hospitalDrugId: [{ required: true, message: '院内药品唯一码不能为空', trigger: 'blur' }],
  productName: [{ required: true, message: '产品名称不能为空', trigger: 'blur' }],
  outboundDate: [{ required: true, message: '出库日期不能为空', trigger: 'blur' }],
  outboundPackQuantity: [
    { required: true, message: '出库数量（最小销售包装单位）不能为空', trigger: 'blur' }
  ],
  outboundDosageQuantity: [
    { required: true, message: '出库数量（最小制剂单位）不能为空', trigger: 'blur' }
  ],
  qcStatus: [
    { required: true, message: '质控状态:0-未质控,1-质控通过,2-质控失败不能为空', trigger: 'blur' }
  ]
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
      formData.value = await OutboundApi.getOutbound(id)
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
    const data = formData.value as unknown as OutboundVO
    if (formType.value === 'create') {
      await OutboundApi.createOutbound(data)
      message.success(t('common.createSuccess'))
    } else {
      await OutboundApi.updateOutbound(data)
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
    taskId: undefined,
    organizationCode: undefined,
    hospitalCode: undefined,
    organizationName: undefined,
    domainCode: undefined,
    ypid: undefined,
    hospitalDrugId: undefined,
    provinceDrugId: undefined,
    productName: undefined,
    outboundDate: undefined,
    outboundPackQuantity: undefined,
    outboundDosageQuantity: undefined,
    qcStatus: undefined,
    qcResult: undefined,
    errorMessage: undefined
  }
  formRef.value?.resetFields()
}
</script>
