// 上报提交页面组件间通信类型定义

// 当前任务信息
export interface CurrentTaskInfo {
  id: number | null
  taskName: string
  status: number
  startDate: string
  endDate: string
  hospitalId: number | null
  hospitalName: string
  description: string
  currentStep?: number
  submitTime?: Date | string
  completeTime?: Date | string
}

// 文件信息
export interface FileInfo {
  id: number
  name: string
  type: string
  status: 'pending' | 'uploading' | 'uploaded' | 'failed'
  size: number
  recordCount: number
  errorCount?: number
}

// 质控详情
export interface QCDetail {
  tableName: string
  checkItem: string
  passed: boolean
  result: boolean
  errorCount: number
  message: string
}

// 前置质控结果
export interface PreQCResult {
  passed: boolean
  details: QCDetail[]
}

// 后置质控错误表格
export interface ErrorTable {
  tableName: string
  errorType: string
  errorCount: number
  description: string
}

// 后置质控结果
export interface PostQCResult {
  status: 'processing' | 'passed' | 'rejected'
  progress: number
  estimatedTime: string
  rejectReason: string
  rejectTime: string
  reviewer: string
  errorTables: ErrorTable[]
}

// 提交信息
export interface SubmitInfo {
  submitTime: Date | string
  submitter: string
  totalRecords: number
}

// 完成信息
export interface CompleteInfo {
  completeTime: Date | string
  batchNo: string
  qualityScore: number
  reviewComment: string
}

// 模板定义
export interface TableDefinition {
  id: number | string
  fileName: string
  type: string
  fieldCount: number
  downloadCount: number
  requiredFieldsCount: number
  requiredFields: string[]
  color: string
}

// 质控错误
export interface QCError {
  row: number
  column: string
  value: string
  errorType: string
  message: string
  suggestion: string
}

// 步骤组件通用Props
export interface StepBaseProps {
  currentTask: CurrentTaskInfo
  loading: boolean
}

// 步骤组件通用事件
export interface StepBaseEmits {
  'update:loading': (loading: boolean) => void
  'next-step': () => void
  'prev-step': () => void
  'update-task': (task: Partial<CurrentTaskInfo>) => void
  'update-progress': (step: number) => void
}

// 步骤0（准备阶段）Props
export interface Step0Props extends StepBaseProps {
  tableDefinitions: Record<string, TableDefinition>
  loadingTemplates: boolean
}

// 步骤0事件
export interface Step0Emits extends StepBaseEmits {
  'start-upload': () => void
  'preview-template': (templateId: number) => void
  'download-template': () => void
}

// 步骤1（上传文件）Props
export interface Step1Props extends StepBaseProps {
  fileList: FileInfo[]
  allFilesUploaded: boolean
}

// 步骤1事件
export interface Step1Emits extends StepBaseEmits {
  'file-change': (file: any) => void
  'view-file-data': (file: FileInfo) => void
  'reupload-file': (file: FileInfo) => void
  'remove-file': (file: FileInfo) => void
  'start-pre-qc': () => void
}

// 步骤2（前置质控）Props
export interface Step2Props extends StepBaseProps {
  preQCResult: PreQCResult
}

// 步骤2事件
export interface Step2Emits extends StepBaseEmits {
  'view-qc-errors': (row: QCDetail) => void
  'fix-and-reupload': (row: QCDetail) => void
  'back-to-upload': () => void
  'download-qc-report': (type: 'pre' | 'post') => void
  'submit-report': () => void
}

// 步骤3（提交上报）Props
export interface Step3Props extends StepBaseProps {
  submitInfo: SubmitInfo
}

// 步骤3事件
export interface Step3Emits extends StepBaseEmits {
  'refresh-status': () => void
  'view-submit-log': () => void
}

// 步骤4（后置质控）Props
export interface Step4Props extends StepBaseProps {
  postQCResult: PostQCResult
}

// 步骤4事件
export interface Step4Emits extends StepBaseEmits {
  'download-error-data': (row: ErrorTable) => void
  'reupload-table': (row: ErrorTable) => void
  'restart-process': () => void
  'download-qc-report': (type: 'pre' | 'post') => void
}

// 步骤5（上报完成）Props
export interface Step5Props extends StepBaseProps {
  completeInfo: CompleteInfo
}

// 步骤5事件
export interface Step5Emits extends StepBaseEmits {
  'download-reports': () => void
  'download-original-files': () => void
  'view-report-history': () => void
}