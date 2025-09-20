<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="800px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="专区编码" prop="zoneCode">
        <el-input v-model="formData.zoneCode" placeholder="自动生成" :disabled="true" />
      </el-form-item>
      <el-form-item label="专区名称" prop="zoneName">
        <el-input v-model="formData.zoneName" placeholder="请输入专区名称" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="填报通知" prop="noticeContent">
        <Editor
          v-model="formData.noticeContent"
          height="200px"
          placeholder="请输入填报通知内容，支持富文本格式..."
        />
      </el-form-item>
      <el-form-item label="可填报机构" prop="reportableOrgs">
        <el-card class="w-full h-350px !overflow-y-scroll" shadow="never">
          <template #header>
            全选/全不选:
            <el-switch
              v-model="treeNodeAll"
              active-text="是"
              inactive-text="否"
              inline-prompt
              @change="handleCheckedTreeNodeAll()"
            />
            全部展开/折叠:
            <el-switch
              v-model="deptExpand"
              active-text="展开"
              inactive-text="折叠"
              inline-prompt
              @change="handleCheckedTreeExpand"
            />
            父子联动:
            <el-switch v-model="checkStrictly" active-text="是" inactive-text="否" inline-prompt />
          </template>
          <el-tree
            ref="treeRef"
            :check-strictly="!checkStrictly"
            :data="deptOptions"
            :props="defaultProps"
            default-expand-all
            empty-text="加载中，请稍后"
            node-key="id"
            show-checkbox
          />
        </el-card>
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
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { ReportZoneApi, type ReportZoneVO } from '@/api/shortage'
import { Editor } from '@/components/Editor'
import * as DeptApi from '@/api/system/dept'
import { defaultProps, handleTree } from '@/utils/tree'

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
  status: 0, // 默认开启（启用状态）
  remark: '',
  reportableOrgs: '',
})

// 部门树相关
const deptOptions = ref<any[]>([]) // 部门树形结构
const deptExpand = ref(true) // 展开/折叠
const treeRef = ref() // 部门树组件 Ref
const treeNodeAll = ref(false) // 全选/全不选
const checkStrictly = ref(true) // 是否严格模式，即父子不关联

const formRules = reactive({
  zoneName: [{ required: true, message: '专区名称不能为空', trigger: 'blur' }],
  zoneCode: [{ required: true, message: '专区编码不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
})

const formRef = ref() // 表单 Ref

// 自动生成专区编码
const generateZoneCode = async () => {
  const maxRetries = 5
  let attempt = 0
  
  while (attempt < maxRetries) {
    try {
      // 获取当前时间信息
      const now = new Date()
      const year = now.getFullYear().toString().slice(-2)
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hour = String(now.getHours()).padStart(2, '0')
      const minute = String(now.getMinutes()).padStart(2, '0')
      
      // 生成随机数（3位）
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      
      // 组合编码：ZONE_年月日时分_随机数
      const baseCode = `ZONE_${year}${month}${day}${hour}${minute}_${randomNum}`
      
      // 检查编码是否已存在
      const existingData = await ReportZoneApi.getPage({
        pageNo: 1,
        pageSize: 1,
        zoneCode: baseCode
      })
      
      // 如果不存在，返回此编码
      if (!existingData.list || existingData.list.length === 0) {
        return baseCode
      }
      
      // 如果存在，增加尝试次数继续生成
      attempt++
      
      // 添加短暂延时避免连续生成相同时间戳
      await new Promise(resolve => setTimeout(resolve, 100))
      
    } catch (error) {
      console.warn(`生成专区编码失败，尝试次数：${attempt + 1}`, error)
      attempt++
      
      // 最后一次尝试失败时，使用纯时间戳 + UUID 后4位
      if (attempt === maxRetries) {
        const timestamp = Date.now().toString()
        const uuid = crypto.randomUUID().replace(/-/g, '').slice(-4).toUpperCase()
        return `ZONE_${timestamp}_${uuid}`
      }
    }
  }
  
  // 兜底方案：使用完整时间戳
  return `ZONE_${Date.now()}_${Math.random().toString(36).slice(-4).toUpperCase()}`
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增专区' : '编辑专区'
  formType.value = type
  resetForm()
  
  // 加载部门数据
  deptOptions.value = handleTree(await DeptApi.getSimpleDeptList())
  
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const data = await ReportZoneApi.get(id)
      Object.assign(formData.value, data)
      
      // 设置已选择的部门
      if (data.reportableOrgs) {
        await nextTick()
        const deptIds = data.reportableOrgs.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
        deptIds.forEach(deptId => {
          treeRef.value?.setChecked(deptId, true, false)
        })
      }
    } finally {
      formLoading.value = false
    }
  } else {
    // 新增时自动生成专区编码
    formData.value.zoneCode = await generateZoneCode()
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
    const data = { ...formData.value } as ReportZoneVO
    
    // 处理可填报机构ID列表
    const checkedDeptIds = treeRef.value?.getCheckedKeys(false) || []
    data.reportableOrgs = checkedDeptIds.join(',')
    
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
    status: 0, // 默认开启（启用状态）
    remark: '',
    reportableOrgs: '',
  }
  
  // 重置部门树状态
  treeNodeAll.value = false
  deptExpand.value = true
  checkStrictly.value = true
  treeRef.value?.setCheckedNodes([])
  
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

/** 全选/全不选 */
const handleCheckedTreeNodeAll = () => {
  treeRef.value.setCheckedNodes(treeNodeAll.value ? deptOptions.value : [])
}

/** 展开/折叠全部 */
const handleCheckedTreeExpand = () => {
  const nodes = treeRef.value?.store.nodesMap
  for (let node in nodes) {
    if (nodes[node].expanded === deptExpand.value) {
      continue
    }
    nodes[node].expanded = deptExpand.value
  }
}
</script>
