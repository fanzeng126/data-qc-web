<!-- 药品目录表单组件 -->
<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="800px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="120px"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="院内药品编码" prop="hosDrugId">
            <el-input
              v-model="formData.hosDrugId"
              placeholder="请输入院内药品唯一码"
              :disabled="formType === 'update'"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="国家药管编码" prop="ypid">
            <el-input
              v-model="formData.ypid"
              placeholder="请输入国家药管平台药品编码"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="品种通用名" prop="drugName">
            <el-input
              v-model="formData.drugName"
              placeholder="请输入品种通用名"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="产品通用名" prop="productName">
            <el-input
              v-model="formData.productName"
              placeholder="请输入产品通用名"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="商品名" prop="tradeName">
            <el-input
              v-model="formData.tradeName"
              placeholder="请输入商品名"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="英文商品名" prop="tradeEngName">
            <el-input
              v-model="formData.tradeEngName"
              placeholder="请输入英文商品名"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="生产企业" prop="manufacturer">
            <el-input
              v-model="formData.manufacturer"
              placeholder="请输入生产企业名称"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="批准文号" prop="approvalNum">
            <el-input
              v-model="formData.approvalNum"
              placeholder="请输入批准文号"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="剂型名称" prop="drugForm">
            <el-select
              v-model="formData.drugForm"
              placeholder="请选择剂型"
              filterable
              allow-create
              class="w-full"
            >
              <el-option
                v-for="item in drugFormOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="制剂规格" prop="drugSpec">
            <el-input
              v-model="formData.drugSpec"
              placeholder="如：5mg*10片"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="转换系数" prop="drugFactor">
            <el-input-number
              v-model="formData.drugFactor"
              :min="0.01"
              :precision="2"
              placeholder="包装单位与制剂单位转换系数"
              class="w-full"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="制剂单位" prop="dosageUnit">
            <el-select
              v-model="formData.dosageUnit"
              placeholder="请选择制剂单位"
              filterable
              allow-create
              class="w-full"
            >
              <el-option label="片" value="片" />
              <el-option label="粒" value="粒" />
              <el-option label="袋" value="袋" />
              <el-option label="支" value="支" />
              <el-option label="瓶" value="瓶" />
              <el-option label="盒" value="盒" />
              <el-option label="ml" value="ml" />
              <el-option label="g" value="g" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="包装单位" prop="packUnit">
            <el-select
              v-model="formData.packUnit"
              placeholder="请选择最小销售包装单位"
              filterable
              allow-create
              class="w-full"
            >
              <el-option label="盒" value="盒" />
              <el-option label="瓶" value="瓶" />
              <el-option label="袋" value="袋" />
              <el-option label="支" value="支" />
              <el-option label="板" value="板" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="是否基本药物" prop="baseFlag">
            <el-radio-group v-model="formData.baseFlag">
              <el-radio label="1">是</el-radio>
              <el-radio label="2">否</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="集中采购药品" prop="unityPurchaseFlag">
            <el-radio-group v-model="formData.unityPurchaseFlag">
              <el-radio label="1">是</el-radio>
              <el-radio label="2">否</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="一致性评价" prop="uniformityFlag">
            <el-radio-group v-model="formData.uniformityFlag">
              <el-radio label="1">通过</el-radio>
              <el-radio label="2">未通过</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="系统信息">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="系统编码" prop="domainCode">
                  <el-input v-model="formData.domainCode" placeholder="系统编码" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="组织机构代码" prop="organizationCode">
                  <el-input v-model="formData.organizationCode" placeholder="组织机构代码" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="医疗机构代码" prop="hospitalCode">
                  <el-input v-model="formData.hospitalCode" placeholder="医疗机构代码" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>

  <!-- 药品导入对话框 -->
  <Dialog v-model="importVisible" title="药品目录导入" width="600px">
    <el-upload
      ref="uploadRef"
      v-model:file-list="fileList"
      :auto-upload="false"
      :disabled="importLoading"
      :limit="1"
      :on-exceed="handleExceed"
      :before-upload="beforeUpload"
      accept=".xlsx,.xls"
      drag
    >
      <Icon icon="ep:upload" class="text-4xl text-gray-400 mb-4" />
      <div class="el-upload__text">
        将Excel文件拖到此处，或<em>点击上传</em>
      </div>
      <template #tip>
        <div class="el-upload__tip text-center">
          <div class="text-sm text-gray-600 mb-2">
            <el-checkbox v-model="updateSupport" />
            是否更新已经存在的药品数据
          </div>
          <div class="text-sm text-gray-500">
            仅允许导入 xlsx、xls 格式文件，且文件大小不超过 10MB
          </div>
          <el-link
            :underline="false"
            type="primary"
            @click="downloadTemplate"
            class="text-sm"
          >
            下载导入模板
          </el-link>
        </div>
      </template>
    </el-upload>

    <template #footer>
      <el-button :disabled="importLoading" type="primary" @click="submitImport">确 定</el-button>
      <el-button @click="importVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import * as DrugListApi from '@/api/dataqc/drugList'
import { FormRules } from 'element-plus'

defineOptions({ name: 'DrugListFormAndImport' })

const { t } = useI18n()
const message = useMessage()

// 表单对话框状态
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formData = ref({
  id: undefined,
  hosDrugId: '',
  ypid: '',
  drugName: '',
  productName: '',
  tradeName: '',
  tradeEngName: '',
  manufacturer: '',
  approvalNum: '',
  drugForm: '',
  drugSpec: '',
  drugFactor: 1,
  dosageUnit: '',
  packUnit: '',
  baseFlag: '2',
  unityPurchaseFlag: '2',
  uniformityFlag: '2',
  domainCode: '',
  organizationCode: '',
  hospitalCode: ''
})

// 导入对话框状态
const importVisible = ref(false)
const importLoading = ref(false)
const fileList = ref([])
const updateSupport = ref(false)
const uploadRef = ref()

const formRef = ref()

// 表单验证规则
const formRules = reactive<FormRules>({
  hosDrugId: [{ required: true, message: '院内药品编码不能为空', trigger: 'blur' }],
  ypid: [{ required: true, message: '国家药管平台药品编码不能为空', trigger: 'blur' }],
  drugName: [{ required: true, message: '品种通用名不能为空', trigger: 'blur' }],
  productName: [{ required: true, message: '产品通用名不能为空', trigger: 'blur' }],
  dosageUnit: [{ required: true, message: '制剂单位不能为空', trigger: 'blur' }],
  packUnit: [{ required: true, message: '包装单位不能为空', trigger: 'blur' }],
  drugFactor: [{ required: true, message: '转换系数不能为空', trigger: 'blur' }],
  baseFlag: [{ required: true, message: '请选择是否为基本药物', trigger: 'change' }],
  unityPurchaseFlag: [{ required: true, message: '请选择是否为集中采购药品', trigger: 'change' }],
  uniformityFlag: [{ required: true, message: '请选择是否通过一致性评价', trigger: 'change' }],
  domainCode: [{ required: true, message: '系统编码不能为空', trigger: 'blur' }],
  organizationCode: [{ required: true, message: '组织机构代码不能为空', trigger: 'blur' }],
  hospitalCode: [{ required: true, message: '医疗机构代码不能为空', trigger: 'blur' }]
})

// 剂型选项
const drugFormOptions = ref([
  { label: '片剂', value: '片剂' },
  { label: '胶囊剂', value: '胶囊剂' },
  { label: '颗粒剂', value: '颗粒剂' },
  { label: '口服液', value: '口服液' },
  { label: '注射剂', value: '注射剂' },
  { label: '软膏剂', value: '软膏剂' },
  { label: '滴眼剂', value: '滴眼剂' },
  { label: '糖浆剂', value: '糖浆剂' }
])

/** 打开表单对话框 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()

  if (id) {
    formLoading.value = true
    try {
      formData.value = await DrugListApi.getDrugList(id)
    } finally {
      formLoading.value = false
    }
  }
}

/** 打开导入对话框 */
const openImport = () => {
  importVisible.value = true
  resetImportForm()
}

/** 提交表单 */
const submitForm = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return

  formLoading.value = true
  try {
    const data = formData.value
    if (formType.value === 'create') {
      await DrugListApi.createDrugList(data)
      message.success(t('common.createSuccess'))
    } else {
      await DrugListApi.updateDrugList(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    hosDrugId: '',
    ypid: '',
    drugName: '',
    productName: '',
    tradeName: '',
    tradeEngName: '',
    manufacturer: '',
    approvalNum: '',
    drugForm: '',
    drugSpec: '',
    drugFactor: 1,
    dosageUnit: '',
    packUnit: '',
    baseFlag: '2',
    unityPurchaseFlag: '2',
    uniformityFlag: '2',
    domainCode: '',
    organizationCode: '',
    hospitalCode: ''
  }
  formRef.value?.resetFields()
}

/** 文件数超出提示 */
const handleExceed = () => {
  message.error('最多只能上传一个文件！')
}

/** 上传前校验 */
const beforeUpload = (file) => {
  const isValidFormat = file.name.toLowerCase().endsWith('.xlsx') ||
    file.name.toLowerCase().endsWith('.xls')
  if (!isValidFormat) {
    message.error('只支持 Excel 格式的文件！')
    return false
  }

  const isValidSize = file.size < 10 * 1024 * 1024
  if (!isValidSize) {
    message.error('文件大小不能超过 10MB！')
    return false
  }

  return true
}

/** 提交导入 */
const submitImport = async () => {
  if (fileList.value.length === 0) {
    message.error('请选择要上传的文件')
    return
  }

  importLoading.value = true
  try {
    const result = await DrugListApi.importDrugList(fileList.value[0].raw, updateSupport.value)
    message.success(result)
    importVisible.value = false
    emit('success')
  } catch (error) {
    message.error(error.message || '导入失败')
  } finally {
    importLoading.value = false
  }
}

/** 下载模板 */
const downloadTemplate = async () => {
  try {
    const data = await DrugListApi.getDrugListTemplate()
    const blob = new Blob([data])
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '药品目录导入模板.xlsx'
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    message.error('下载模板失败')
  }
}

/** 重置导入表单 */
const resetImportForm = () => {
  fileList.value = []
  updateSupport.value = false
  importLoading.value = false
  uploadRef.value?.clearFiles()
}

// 暴露方法
defineExpose({ open, openImport })

// 定义事件
const emit = defineEmits(['success'])
</script>

<style scoped>
:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-upload-dragger) {
  padding: 40px 20px;
}

.el-upload__text em {
  color: #409eff;
  font-style: normal;
}
</style>
