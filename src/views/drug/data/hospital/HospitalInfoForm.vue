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
      <el-form-item label="组织机构代码（9位）" prop="organizationCode">
        <el-input v-model="formData.organizationCode" placeholder="请输入组织机构代码（9位）" />
      </el-form-item>
      <el-form-item label="医疗机构代码（22位）" prop="hospitalCode">
        <el-input v-model="formData.hospitalCode" placeholder="请输入医疗机构代码（22位）" />
      </el-form-item>
      <el-form-item label="组织机构名称" prop="organizationName">
        <el-input v-model="formData.organizationName" placeholder="请输入组织机构名称" />
      </el-form-item>
      <el-form-item label="省级行政区划代码（6位）" prop="domainCode">
        <el-input v-model="formData.domainCode" placeholder="请输入省级行政区划代码（6位）" />
      </el-form-item>
      <el-form-item label="实有床位数" prop="bedCount">
        <el-input v-model="formData.bedCount" placeholder="请输入实有床位数" />
      </el-form-item>
      <el-form-item label="执业医师数" prop="doctorCount">
        <el-input v-model="formData.doctorCount" placeholder="请输入执业医师数" />
      </el-form-item>
      <el-form-item label="执业助理医师数" prop="assistantDoctorCount">
        <el-input v-model="formData.assistantDoctorCount" placeholder="请输入执业助理医师数" />
      </el-form-item>
      <el-form-item label="总诊疗人次数" prop="visitCount">
        <el-input v-model="formData.visitCount" placeholder="请输入总诊疗人次数" />
      </el-form-item>
      <el-form-item label="出院人数" prop="dischargeCount">
        <el-input v-model="formData.dischargeCount" placeholder="请输入出院人数" />
      </el-form-item>
      <el-form-item label="年度药品总收入" prop="annualDrugIncome">
        <el-input v-model="formData.annualDrugIncome" placeholder="请输入年度药品总收入" />
      </el-form-item>
      <el-form-item label="中药饮片总采购额" prop="ypPurchaseAmount">
        <el-input v-model="formData.ypPurchaseAmount" placeholder="请输入中药饮片总采购额" />
      </el-form-item>
      <el-form-item label="中药饮片总销售额" prop="ypSellAmount">
        <el-input v-model="formData.ypSellAmount" placeholder="请输入中药饮片总销售额" />
      </el-form-item>
      <el-form-item label="中药颗粒剂总采购额" prop="klPurchaseAmount">
        <el-input v-model="formData.klPurchaseAmount" placeholder="请输入中药颗粒剂总采购额" />
      </el-form-item>
      <el-form-item label="中药颗粒剂总销售额" prop="klSellAmount">
        <el-input v-model="formData.klSellAmount" placeholder="请输入中药颗粒剂总销售额" />
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
import { HospitalInfoApi, HospitalInfoVO } from '@/api/drug/data/hospital'

/** 医疗机构基本情况 表单 */
defineOptions({ name: 'HospitalInfoForm' })

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
  bedCount: undefined,
  doctorCount: undefined,
  assistantDoctorCount: undefined,
  visitCount: undefined,
  dischargeCount: undefined,
  annualDrugIncome: undefined,
  ypPurchaseAmount: undefined,
  ypSellAmount: undefined,
  klPurchaseAmount: undefined,
  klSellAmount: undefined,
  qcStatus: undefined,
  qcResult: undefined,
  errorMessage: undefined
})
const formRules = reactive({
  taskId: [{ required: true, message: '导入任务ID不能为空', trigger: 'blur' }],
  organizationCode: [{ required: true, message: '组织机构代码（9位）不能为空', trigger: 'blur' }],
  hospitalCode: [{ required: true, message: '医疗机构代码（22位）不能为空', trigger: 'blur' }],
  organizationName: [{ required: true, message: '组织机构名称不能为空', trigger: 'blur' }],
  domainCode: [{ required: true, message: '省级行政区划代码（6位）不能为空', trigger: 'blur' }],
  bedCount: [{ required: true, message: '实有床位数不能为空', trigger: 'blur' }],
  doctorCount: [{ required: true, message: '执业医师数不能为空', trigger: 'blur' }],
  assistantDoctorCount: [{ required: true, message: '执业助理医师数不能为空', trigger: 'blur' }],
  visitCount: [{ required: true, message: '总诊疗人次数不能为空', trigger: 'blur' }],
  dischargeCount: [{ required: true, message: '出院人数不能为空', trigger: 'blur' }],
  annualDrugIncome: [{ required: true, message: '年度药品总收入不能为空', trigger: 'blur' }],
  ypPurchaseAmount: [{ required: true, message: '中药饮片总采购额不能为空', trigger: 'blur' }],
  ypSellAmount: [{ required: true, message: '中药饮片总销售额不能为空', trigger: 'blur' }],
  klPurchaseAmount: [{ required: true, message: '中药颗粒剂总采购额不能为空', trigger: 'blur' }],
  klSellAmount: [{ required: true, message: '中药颗粒剂总销售额不能为空', trigger: 'blur' }],
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
      formData.value = await HospitalInfoApi.getHospitalInfo(id)
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
    const data = formData.value as unknown as HospitalInfoVO
    if (formType.value === 'create') {
      await HospitalInfoApi.createHospitalInfo(data)
      message.success(t('common.createSuccess'))
    } else {
      await HospitalInfoApi.updateHospitalInfo(data)
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
    bedCount: undefined,
    doctorCount: undefined,
    assistantDoctorCount: undefined,
    visitCount: undefined,
    dischargeCount: undefined,
    annualDrugIncome: undefined,
    ypPurchaseAmount: undefined,
    ypSellAmount: undefined,
    klPurchaseAmount: undefined,
    klSellAmount: undefined,
    qcStatus: undefined,
    qcResult: undefined,
    errorMessage: undefined
  }
  formRef.value?.resetFields()
}
</script>
