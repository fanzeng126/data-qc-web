<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="800px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="专区名称" prop="zoneName">
        <el-input v-model="formData.zoneName" placeholder="请输入专区名称" />
      </el-form-item>
      <el-form-item label="专区编码" prop="zoneCode">
        <el-input v-model="formData.zoneCode" placeholder="请输入专区编码" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="1">启用</el-radio>
          <el-radio :value="0">停用</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="填报通知" prop="noticeContent">
        <Editor 
          v-model="formData.noticeContent" 
          height="200px"
          placeholder="请输入填报通知内容，支持富文本格式..."
        />
      </el-form-item>
      <el-form-item label="备注说明" prop="remark">
        <el-input 
          v-model="formData.remark" 
          type="textarea"
          placeholder="请输入备注说明"
          :rows="3" 
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ReportZoneApi, type ReportZoneVO } from '@/api/shortage'
import { Editor } from '@/components/Editor'

/** 短缺药品填报专区 表单 */
defineOptions({ name: 'ReportZoneForm' })

const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  zoneName: '',
  zoneCode: '',
  noticeContent: '',
  status: 1,
  remark: '',
})

const formRules = reactive({
  zoneName: [{ required: true, message: '专区名称不能为空', trigger: 'blur' }],
  zoneCode: [{ required: true, message: '专区编码不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
})

const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增专区' : '编辑专区'
  formType.value = type
  resetForm()
  
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const data = await ReportZoneApi.get(id)
      Object.assign(formData.value, data)
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
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => {})
  if (!valid) return
  
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as ReportZoneVO
    if (formType.value === 'create') {
      await ReportZoneApi.create(data)
      message.success('创建成功')
    } else {
      await ReportZoneApi.update(data)
      message.success('更新成功')
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
    zoneName: '',
    zoneCode: '',
    noticeContent: getDefaultNoticeContent(),
    status: 1,
    remark: '',
  }
  formRef.value?.resetFields()
}

// 获取默认通知内容模板
const getDefaultNoticeContent = (): string => {
  return `<div>
    <h3>📢 填报通知</h3>
    <p>各医疗机构请注意：</p>
    <ol>
      <li><strong>填报时间</strong>：每周五12:00-18:00</li>
      <li><strong>填报范围</strong>：本周六至本周五中午12:00的数据</li>
      <li><strong>数据要求</strong>：按最小剂量单位填写，数据真实准确</li>
      <li><strong>联系方式</strong>：如有疑问请联系质控中心</li>
    </ol>
    <p style="color: #E74C3C;">请务必在规定时间内完成填报，逾期系统将自动关闭。</p>
  </div>`
}
</script>