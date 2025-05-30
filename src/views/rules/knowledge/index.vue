<template>
  <div class="knowledge-container">
    <!-- 页面标题栏 -->
    <div class="page-header">
      <div class="page-title">医疗质控知识库</div>
      <div class="page-actions">
        <button class="btn btn-primary" @click="openNewArticleModal">
          <i class="icon">✏️</i>
          新建知识库文章
        </button>
      </div>
    </div>
    
    <!-- 知识库顶部搜索 -->
    <div class="knowledge-header">
      <div class="search-bar">
        <span class="search-icon">🔍</span>
        <input 
          type="text" 
          v-model="searchTerm"
          @input="handleSearch"
          placeholder="搜索医疗标准、药品监测、质控规范..."
        />
      </div>
    </div>
    
    <!-- 分类导航 -->
    <div class="knowledge-categories">
      <div 
        v-for="category in categories" 
        :key="category.key"
        class="category-item"
        :class="{ active: activeCategory === category.key }"
        @click="switchCategory(category.key)"
      >
        {{ category.label }}
      </div>
    </div>
    
    <!-- 知识卡片列表 -->
    <div class="knowledge-grid">
      <div 
        v-for="article in filteredArticles" 
        :key="article.id"
        class="knowledge-card"
        @click="openArticleModal(article)"
      >
        <div class="knowledge-header-img">
          <div class="knowledge-icon">{{ article.icon }}</div>
        </div>
        <div class="knowledge-body">
          <h3 class="knowledge-title">{{ article.title }}</h3>
          <div class="knowledge-description">
            {{ article.description }}
          </div>
          <div class="knowledge-tags">
            <span 
              v-for="tag in article.tags" 
              :key="tag"
              class="knowledge-tag"
            >
              {{ tag }}
            </span>
          </div>
          <div class="knowledge-meta">
            <div class="knowledge-date">
              <i>🕒</i> {{ formatDate(article.createdAt) }}
            </div>
            <div class="knowledge-views">
              <i>👁️</i> {{ article.views }}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 分页 -->
    <div class="pagination-container">
      <div class="pagination">
        <div class="page-item">
          <a class="page-link" href="#" @click.prevent="previousPage">上一页</a>
        </div>
        <div 
          v-for="page in totalPages" 
          :key="page"
          class="page-item"
          :class="{ active: currentPage === page }"
        >
          <a class="page-link" href="#" @click.prevent="goToPage(page)">{{ page }}</a>
        </div>
        <div class="page-item">
          <a class="page-link" href="#" @click.prevent="nextPage">下一页</a>
        </div>
      </div>
    </div>
    
    <!-- 文章详情模态框 -->
    <div v-if="showArticleModal" class="modal-backdrop" @click="closeArticleModal">
      <div class="modal-container article-modal-container" @click.stop>
        <div class="modal-header">
          <div class="modal-title">文章详情</div>
          <button class="modal-close" @click="closeArticleModal">×</button>
        </div>
        <div class="modal-body">
          <div class="row">
            <div class="col-9 col-md-12">
              <h1 class="article-title">{{ selectedArticle?.title }}</h1>
              
              <div class="article-meta">
                <div class="article-author">
                  <div class="author-avatar">{{ selectedArticle?.author.charAt(0) }}</div>
                  <div class="author-info">
                    <div class="author-name">{{ selectedArticle?.author }}</div>
                    <div class="author-role">{{ selectedArticle?.authorRole }}</div>
                  </div>
                </div>
                
                <div class="article-info">
                  <div class="article-info-item">
                    <i>🕒</i>
                    <span>{{ formatDate(selectedArticle?.createdAt) }}</span>
                  </div>
                  <div class="article-info-item">
                    <i>👁️</i>
                    <span>{{ selectedArticle?.views }}</span>
                  </div>
                </div>
              </div>
              
              <div class="article-content" v-html="selectedArticle?.content"></div>
              
              <div class="related-articles">
                <h3 class="section-title">相关文章</h3>
                <ul class="related-list">
                  <li v-for="related in relatedArticles" :key="related.id" class="related-item">
                    <a href="#" class="related-link" @click.prevent="openArticleModal(related)">
                      {{ related.title }}
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            
            <div class="col-3 d-md-none">
              <div class="recent-box">
                <div class="recent-box-title">最近浏览</div>
                <ul class="recent-list">
                  <li v-for="recent in recentArticles" :key="recent.id" class="recent-item">
                    <a href="#" class="recent-link" @click.prevent="openArticleModal(recent)">
                      <div class="recent-icon">{{ recent.icon }}</div>
                      <span>{{ recent.title }}</span>
                    </a>
                  </li>
                </ul>
              </div>
              
              <div class="recent-box">
                <div class="recent-box-title">热门文章</div>
                <ul class="recent-list">
                  <li v-for="popular in popularArticles" :key="popular.id" class="recent-item">
                    <a href="#" class="recent-link" @click.prevent="openArticleModal(popular)">
                      <div class="recent-icon">{{ popular.icon }}</div>
                      <span>{{ popular.title }}</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 新建文章模态框 -->
    <div v-if="showNewArticleModal" class="modal-backdrop" @click="closeNewArticleModal">
      <div class="modal-container new-article-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-title">新建知识库文章</div>
          <button class="modal-close" @click="closeNewArticleModal">×</button>
        </div>
        <div class="modal-body">
          <form class="new-article-form">
            <div class="form-group">
              <label for="articleTitle">文章标题</label>
              <input 
                type="text" 
                id="articleTitle" 
                class="form-control" 
                v-model="newArticle.title"
                placeholder="请输入文章标题"
              />
            </div>
            
            <div class="form-group">
              <label for="articleCategory">文章分类</label>
              <div class="select-wrapper">
                <select id="articleCategory" class="form-control" v-model="newArticle.category">
                  <option value="">请选择分类</option>
                  <option v-for="cat in categories.slice(1)" :key="cat.key" :value="cat.key">
                    {{ cat.label }}
                  </option>
                </select>
              </div>
            </div>
            
            <div class="form-group">
              <label for="articleSummary">文章摘要</label>
              <textarea 
                id="articleSummary" 
                class="form-control" 
                v-model="newArticle.summary"
                placeholder="请输入文章摘要，简要描述文章内容和要点"
              ></textarea>
            </div>
            
            <div class="form-group">
              <label>文章标签</label>
              <div class="tag-input">
                <div 
                  v-for="(tag, index) in newArticle.tags" 
                  :key="index"
                  class="tag-item"
                >
                  <span>{{ tag }}</span>
                  <span class="remove-tag" @click="removeTag(index)">✕</span>
                </div>
                <input 
                  type="text" 
                  v-model="newTagInput"
                  @keydown.enter.prevent="addTag"
                  placeholder="输入标签，按回车添加"
                />
              </div>
            </div>
            
            <div class="form-group">
              <label>文章内容</label>
              <div class="richtext-editor">
                <div class="editor-toolbar">
                  <button type="button" @click="formatText('bold')">加粗</button>
                  <button type="button" @click="formatText('italic')">斜体</button>
                  <button type="button" @click="formatText('heading')">标题</button>
                  <button type="button" @click="formatText('list')">列表</button>
                  <button type="button" @click="formatText('table')">表格</button>
                </div>
                <div 
                  class="editor-content" 
                  ref="editorContent"
                  contenteditable="true"
                  @input="updateContent"
                ></div>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn btn-outline" @click="closeNewArticleModal">取消</button>
              <button type="button" class="btn btn-primary" @click="saveArticle">保存草稿</button>
              <button type="button" class="btn btn-success" @click="publishArticle">发布文章</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'

// 接口定义
interface Article {
  id: number
  title: string
  description: string
  content: string
  category: string
  tags: string[]
  author: string
  authorRole: string
  createdAt: string
  views: number
  icon: string
}

interface Category {
  key: string
  label: string
}

interface NewArticle {
  title: string
  category: string
  summary: string
  tags: string[]
  content: string
}

// 响应式数据
const searchTerm = ref<string>('')
const activeCategory = ref<string>('all')
const currentPage = ref<number>(1)
const pageSize = ref<number>(8)
const showArticleModal = ref<boolean>(false)
const showNewArticleModal = ref<boolean>(false)
const selectedArticle = ref<Article | null>(null)
const newTagInput = ref<string>('')
const editorContent = ref<HTMLElement | null>(null)

// 分类列表
const categories = ref<Category[]>([
  { key: 'all', label: '全部' },
  { key: '药品标准', label: '药品标准' },
  { key: '监测规范', label: '监测规范' },
  { key: '数据标准', label: '数据标准' },
  { key: '管理制度', label: '管理制度' },
  { key: '技术指南', label: '技术指南' },
  { key: '质控标准', label: '质控标准' },
  { key: '政策法规', label: '政策法规' }
])

// 新文章表单数据
const newArticle = reactive<NewArticle>({
  title: '',
  category: '',
  summary: '',
  tags: [],
  content: ''
})

// 文章列表数据
const articles = ref<Article[]>([
  {
    id: 1,
    title: '医疗卫生机构药品使用监测基本数据集标准V1.0',
    description: '本标准规定了医疗卫生机构药品使用监测的基本数据集，包括患者基本信息、药品使用信息、诊疗信息等核心数据元素的定义、格式和编码规范。',
    content: `
      <p>医疗卫生机构药品使用监测基本数据集标准是规范医疗机构药品使用数据采集、存储和传输的重要技术标准。</p>
      
      <h3>一、标准概述</h3>
      <p>本标准适用于各级各类医疗卫生机构，规定了药品使用监测过程中需要采集的基本数据项目和格式要求。</p>
      
      <h3>二、数据集组成</h3>
      <ul>
        <li><strong>患者基本信息</strong>：包括患者身份标识、年龄、性别、诊断信息等</li>
        <li><strong>药品基本信息</strong>：药品名称、规格、生产企业、批准文号等</li>
        <li><strong>用药信息</strong>：用药剂量、频次、途径、疗程等</li>
        <li><strong>临床信息</strong>：适应症、禁忌症、不良反应等</li>
      </ul>
      
      <h3>三、数据质量要求</h3>
      <p>数据采集应确保完整性、准确性、及时性和一致性，建立数据质量控制机制。</p>
      
      <table style="width:100%; border-collapse:collapse; margin: 16px 0;">
        <thead>
          <tr>
            <th style="border:1px solid #E0E0E0; padding:8px; background-color:#F5F7FA;">数据项</th>
            <th style="border:1px solid #E0E0E0; padding:8px; background-color:#F5F7FA;">数据类型</th>
            <th style="border:1px solid #E0E0E0; padding:8px; background-color:#F5F7FA;">必填</th>
            <th style="border:1px solid #E0E0E0; padding:8px; background-color:#F5F7FA;">说明</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #E0E0E0; padding:8px;">患者ID</td>
            <td style="border:1px solid #E0E0E0; padding:8px;">字符串</td>
            <td style="border:1px solid #E0E0E0; padding:8px;">是</td>
            <td style="border:1px solid #E0E0E0; padding:8px;">患者唯一标识符</td>
          </tr>
          <tr>
            <td style="border:1px solid #E0E0E0; padding:8px;">药品编码</td>
            <td style="border:1px solid #E0E0E0; padding:8px;">字符串</td>
            <td style="border:1px solid #E0E0E0; padding:8px;">是</td>
            <td style="border:1px solid #E0E0E0; padding:8px;">国家药品编码</td>
          </tr>
          <tr>
            <td style="border:1px solid #E0E0E0; padding:8px;">用药日期</td>
            <td style="border:1px solid #E0E0E0; padding:8px;">日期</td>
            <td style="border:1px solid #E0E0E0; padding:8px;">是</td>
            <td style="border:1px solid #E0E0E0; padding:8px;">YYYY-MM-DD格式</td>
          </tr>
        </tbody>
      </table>
    `,
    category: '数据标准',
    tags: ['数据标准', '药品监测', '基本数据集'],
    author: '国家卫健委',
    authorRole: '标准制定机构',
    createdAt: '2024-12-15',
    views: 1256,
    icon: '📊'
  },
  {
    id: 2,
    title: '全国公立医疗卫生机构药品使用监测管理标准',
    description: '规范全国公立医疗卫生机构药品使用监测管理工作，建立统一的监测体系和管理流程，提高药品使用监测的标准化水平。',
    content: `
      <p>全国公立医疗卫生机构药品使用监测管理标准旨在建立统一、规范的药品使用监测管理体系。</p>
      
      <h3>一、监测目标</h3>
      <p>通过建立完善的药品使用监测体系，实现对医疗机构药品使用情况的全面监测和管理。</p>
      
      <h3>二、组织架构</h3>
      <p>建立国家、省、市、县四级监测网络，明确各级职责分工。</p>
      
      <h3>三、监测内容</h3>
      <ul>
        <li>药品采购和库存管理</li>
        <li>药品使用情况监测</li>
        <li>药品不良反应监测</li>
        <li>药品费用控制监测</li>
      </ul>
      
      <h3>四、质量控制</h3>
      <p>建立数据质量控制机制，确保监测数据的准确性和可靠性。</p>
    `,
    category: '管理制度',
    tags: ['管理标准', '药品监测', '公立医院'],
    author: '国家卫健委',
    authorRole: '政策制定部门',
    createdAt: '2024-11-20',
    views: 892,
    icon: '📋'
  },
  {
    id: 3,
    title: '2024国家药品信息标准库V11.0应用指南',
    description: '详细介绍2024年国家药品信息标准库V11.0版本的新增功能、数据结构调整和应用方法，帮助医疗机构正确使用标准库。',
    content: `
      <p>2024国家药品信息标准库V11.0是目前最新版本的国家药品标准化数据库。</p>
      
      <h3>一、版本更新内容</h3>
      <ul>
        <li>新增药品品种5000余种</li>
        <li>优化药品分类体系</li>
        <li>完善药品属性字段</li>
        <li>增强数据检索功能</li>
      </ul>
      
      <h3>二、数据结构</h3>
      <p>标准库采用分层结构设计，包括基本信息层、扩展信息层和关联信息层。</p>
      
      <h3>三、应用场景</h3>
      <p>适用于医院信息系统、药品监管系统、医保支付系统等多个应用场景。</p>
    `,
    category: '药品标准',
    tags: ['药品标准', '标准库', '应用指南'],
    author: '国家药监局',
    authorRole: '标准制定机构',
    createdAt: '2024-10-30',
    views: 1534,
    icon: '💊'
  },
  {
    id: 4,
    title: '医疗机构药品使用监测技术规范',
    description: '规定医疗机构药品使用监测的技术要求、操作流程和质量控制标准，确保监测工作的科学性和规范性。',
    content: `
      <p>医疗机构药品使用监测技术规范是指导医疗机构开展药品监测工作的重要技术文件。</p>
      
      <h3>一、监测流程</h3>
      <p>建立完整的监测流程，包括数据采集、数据处理、分析评价和反馈改进。</p>
      
      <h3>二、技术要求</h3>
      <p>明确监测系统的技术架构、数据接口和安全要求。</p>
      
      <h3>三、质量控制</h3>
      <p>建立多层次的质量控制体系，确保监测数据质量。</p>
    `,
    category: '技术指南',
    tags: ['技术规范', '监测流程', '质量控制'],
    author: '中华医学会',
    authorRole: '学术组织',
    createdAt: '2024-09-15',
    views: 678,
    icon: '🔬'
  },
  {
    id: 5,
    title: '药品不良反应监测与报告管理办法',
    description: '规范药品不良反应监测与报告工作，建立完善的不良反应收集、评价和处置机制，保障用药安全。',
    content: `
      <p>药品不良反应监测是保障公众用药安全的重要手段。</p>
      
      <h3>一、监测范围</h3>
      <p>覆盖所有已上市药品的不良反应监测。</p>
      
      <h3>二、报告要求</h3>
      <p>明确不良反应报告的时限、内容和程序。</p>
      
      <h3>三、处置流程</h3>
      <p>建立科学的不良反应评价和处置流程。</p>
    `,
    category: '监测规范',
    tags: ['不良反应', '监测报告', '用药安全'],
    author: '国家药监局',
    authorRole: '监管部门',
    createdAt: '2024-08-25',
    views: 943,
    icon: '⚠️'
  },
  {
    id: 6,
    title: '医院药品质量管理规范实施细则',
    description: '详细规定医院药品质量管理的具体要求和操作标准，包括药品采购、储存、发放、使用各环节的质量控制措施。',
    content: `
      <p>医院药品质量管理是确保患者用药安全的基础工作。</p>
      
      <h3>一、质量管理体系</h3>
      <p>建立完善的药品质量管理体系和组织架构。</p>
      
      <h3>二、全程质量控制</h3>
      <p>覆盖药品采购、储存、调配、发放、使用全过程。</p>
      
      <h3>三、质量评价</h3>
      <p>建立定期质量评价机制和持续改进措施。</p>
    `,
    category: '质控标准',
    tags: ['质量管理', '药品安全', '管理规范'],
    author: '中国医院协会',
    authorRole: '行业协会',
    createdAt: '2024-07-18',
    views: 756,
    icon: '🏥'
  },
  {
    id: 7,
    title: '互联网+药品监管平台建设标准',
    description: '规范互联网+药品监管平台的建设要求、技术架构和功能模块，推进药品监管信息化建设。',
    content: `
      <p>互联网+药品监管平台是新时代药品监管的重要工具。</p>
      
      <h3>一、平台架构</h3>
      <p>采用云计算、大数据等先进技术构建监管平台。</p>
      
      <h3>二、功能模块</h3>
      <p>包括药品信息管理、监测预警、风险评估等核心功能。</p>
      
      <h3>三、数据安全</h3>
      <p>建立完善的数据安全保护机制。</p>
    `,
    category: '技术指南',
    tags: ['互联网+', '监管平台', '信息化'],
    author: '国家药监局',
    authorRole: '监管部门',
    createdAt: '2024-06-12',
    views: 612,
    icon: '🌐'
  },
  {
    id: 8,
    title: '药品追溯体系建设指导原则',
    description: '指导药品生产、流通、使用各环节建立完善的药品追溯体系，实现药品全生命周期可追溯。',
    content: `
      <p>药品追溯体系是保障药品质量安全的重要手段。</p>
      
      <h3>一、追溯原则</h3>
      <p>建立全程可追溯的药品供应链管理体系。</p>
      
      <h3>二、技术标准</h3>
      <p>统一追溯码标准和数据交换格式。</p>
      
      <h3>三、实施路径</h3>
      <p>分阶段推进药品追溯体系建设。</p>
    `,
    category: '监测规范',
    tags: ['药品追溯', '供应链', '质量安全'],
    author: '国家药监局',
    authorRole: '监管部门',
    createdAt: '2024-05-28',
    views: 834,
    icon: '🔍'
  },
  {
    id: 9,
    title: '基本药物目录管理办法(2024年修订)',
    description: '最新修订的基本药物目录管理办法，明确基本药物的遴选原则、管理要求和使用规范。',
    content: `
      <p>基本药物目录是指导临床合理用药的重要工具。</p>
      
      <h3>一、目录调整</h3>
      <p>定期调整基本药物目录，优化药物品种结构。</p>
      
      <h3>二、使用要求</h3>
      <p>明确基本药物在各级医疗机构的配备使用要求。</p>
      
      <h3>三、监管措施</h3>
      <p>建立基本药物使用监测和评价机制。</p>
    `,
    category: '政策法规',
    tags: ['基本药物', '目录管理', '政策法规'],
    author: '国家卫健委',
    authorRole: '政策制定部门',
    createdAt: '2024-04-15',
    views: 1123,
    icon: '📋'
  },
  {
    id: 10,
    title: '医疗机构药学服务规范',
    description: '规范医疗机构药学服务内容和标准，提升药学服务质量，促进合理用药和患者安全。',
    content: `
      <p>药学服务是现代医疗服务体系的重要组成部分。</p>
      
      <h3>一、服务内容</h3>
      <p>包括药物治疗管理、用药教育、药学监护等。</p>
      
      <h3>二、服务标准</h3>
      <p>明确各类药学服务的质量标准和操作规范。</p>
      
      <h3>三、持续改进</h3>
      <p>建立药学服务质量评价和持续改进机制。</p>
    `,
    category: '质控标准',
    tags: ['药学服务', '合理用药', '服务规范'],
    author: '中国药学会',
    authorRole: '学术组织',
    createdAt: '2024-03-22',
    views: 687,
    icon: '💊'
  }
])

// 计算属性
const filteredArticles = computed(() => {
  let filtered = articles.value

  // 分类过滤
  if (activeCategory.value !== 'all') {
    filtered = filtered.filter(article => article.category === activeCategory.value)
  }

  // 搜索过滤
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    filtered = filtered.filter(article =>
      article.title.toLowerCase().includes(term) ||
      article.description.toLowerCase().includes(term) ||
      article.tags.some(tag => tag.toLowerCase().includes(term))
    )
  }

  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filtered.slice(start, end)
})

const totalPages = computed(() => {
  let filtered = articles.value

  if (activeCategory.value !== 'all') {
    filtered = filtered.filter(article => article.category === activeCategory.value)
  }

  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    filtered = filtered.filter(article =>
      article.title.toLowerCase().includes(term) ||
      article.description.toLowerCase().includes(term) ||
      article.tags.some(tag => tag.toLowerCase().includes(term))
    )
  }

  return Math.ceil(filtered.length / pageSize.value)
})

const relatedArticles = computed(() => {
  if (!selectedArticle.value) return []
  
  return articles.value
    .filter(article => 
      article.id !== selectedArticle.value!.id &&
      article.category === selectedArticle.value!.category
    )
    .slice(0, 3)
})

const recentArticles = computed(() => {
  return [...articles.value]  // ✅ 先创建数组副本
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)
})

const popularArticles = computed(() => {
  return [...articles.value]  // ✅ 先创建数组副本
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)
})

// 方法
const handleSearch = () => {
  currentPage.value = 1
}

const switchCategory = (category: string) => {
  activeCategory.value = category
  currentPage.value = 1
}

const goToPage = (page: number) => {
  currentPage.value = page
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const openArticleModal = (article: Article) => {
  selectedArticle.value = article
  showArticleModal.value = true
  // 增加浏览量
  article.views++
}

const closeArticleModal = () => {
  showArticleModal.value = false
  selectedArticle.value = null
}

const openNewArticleModal = () => {
  showNewArticleModal.value = true
}

const closeNewArticleModal = () => {
  showNewArticleModal.value = false
  resetNewArticleForm()
}

const resetNewArticleForm = () => {
  newArticle.title = ''
  newArticle.category = ''
  newArticle.summary = ''
  newArticle.tags = []
  newArticle.content = ''
  newTagInput.value = ''
  if (editorContent.value) {
    editorContent.value.innerHTML = ''
  }
}

const addTag = () => {
  const tag = newTagInput.value.trim()
  if (tag && !newArticle.tags.includes(tag)) {
    newArticle.tags.push(tag)
    newTagInput.value = ''
  }
}

const removeTag = (index: number) => {
  newArticle.tags.splice(index, 1)
}

const formatText = (format: string) => {
  if (!editorContent.value) return

  const selection = window.getSelection()
  
  switch(format) {
    case 'bold':
      document.execCommand('bold', false)
      break
    case 'italic':
      document.execCommand('italic', false)
      break
    case 'heading':
      const headingLevel = prompt('请输入标题级别 (1-6):', '3')
      if (headingLevel && parseInt(headingLevel) >= 1 && parseInt(headingLevel) <= 6) {
        document.execCommand('formatBlock', false, `h${headingLevel}`)
      }
      break
    case 'list':
      document.execCommand('insertUnorderedList', false)
      break
    case 'table':
      insertTable()
      break
  }
  
  editorContent.value.focus()
}

const insertTable = () => {
  const rows = prompt('请输入行数:', '3')
  const cols = prompt('请输入列数:', '3')
  
  if (rows && cols) {
    const rowNum = parseInt(rows)
    const colNum = parseInt(cols)
    
    let tableHTML = '<table style="width:100%; border-collapse:collapse; margin: 16px 0;">'
    
    // 表头
    tableHTML += '<thead><tr>'
    for (let i = 0; i < colNum; i++) {
      tableHTML += `<th style="border:1px solid #E0E0E0; padding:8px; background-color:#F5F7FA;">列 ${i+1}</th>`
    }
    tableHTML += '</tr></thead>'
    
    // 表体
    tableHTML += '<tbody>'
    for (let i = 0; i < rowNum - 1; i++) {
      tableHTML += '<tr>'
      for (let j = 0; j < colNum; j++) {
        tableHTML += `<td style="border:1px solid #E0E0E0; padding:8px;">单元格 ${i+1}-${j+1}</td>`
      }
      tableHTML += '</tr>'
    }
    tableHTML += '</tbody></table><p></p>'
    
    document.execCommand('insertHTML', false, tableHTML)
  }
}

const updateContent = () => {
  if (editorContent.value) {
    newArticle.content = editorContent.value.innerHTML
  }
}

const saveArticle = () => {
  if (!newArticle.title.trim()) {
    alert('请填写文章标题')
    return
  }
  
  alert('草稿保存成功！')
}

const publishArticle = () => {
  if (!newArticle.title.trim()) {
    alert('请填写文章标题')
    return
  }
  
  if (!newArticle.category) {
    alert('请选择文章分类')
    return
  }
  
  if (!newArticle.summary.trim()) {
    alert('请填写文章摘要')
    return
  }
  
  if (!newArticle.content.trim()) {
    alert('请填写文章内容')
    return
  }
  
  // 创建新文章
  const newId = Math.max(...articles.value.map(a => a.id)) + 1
  const newArticleData: Article = {
    id: newId,
    title: newArticle.title,
    description: newArticle.summary,
    content: newArticle.content,
    category: newArticle.category,
    tags: [...newArticle.tags],
    author: '当前用户',
    authorRole: '系统管理员',
    createdAt: new Date().toISOString().split('T')[0],
    views: 0,
    icon: '📄'
  }
  
  articles.value.unshift(newArticleData)
  alert('文章发布成功！')
  closeNewArticleModal()
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

// 生命周期
onMounted(() => {
  // 组件挂载完成后的初始化操作
  console.log('知识库组件已加载')
})
</script>

<style scoped>


@keyframes slideIn {
  from { transform: scaleX(0); }

  to { transform: scaleX(1); }
}

@keyframes fadeIn {
  from { opacity: 0; }

  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }

  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (width <= 1200px) {
  .knowledge-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
  
  .article-modal-container {
    width: 95%;
  }
}

@media (width <= 992px) {
  .d-md-none { display: none !important; }

  .d-md-block { display: block !important; }

  .col-md-12 { flex: 0 0 100%; max-width: 100%; }
  
  .knowledge-grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .knowledge-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-bar {
    max-width: none;
  }
}

@media (width <= 768px) {
  .knowledge-container {
    padding: 12px;
  }
  
  .knowledge-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .knowledge-categories {
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  
  .knowledge-categories::-webkit-scrollbar {
    display: none;
  }
  
  .category-item {
    min-width: 90px;
    padding: 12px 16px;
    font-size: 13px;
  }
  
  .article-title {
    font-size: 22px;
  }
  
  .article-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .modal-container {
    width: 95%;
    max-height: 95vh;
  }
  
  .new-article-modal {
    width: 95%;
    height: 95vh;
  }
  
  .modal-body {
    padding: 16px;
  }
  
  .editor-toolbar {
    flex-wrap: wrap;
    gap: 4px;
  }
  
  .editor-toolbar button {
    padding: 4px 8px;
    font-size: 11px;
  }
}

@media (width <= 480px) {
  .knowledge-container {
    padding: 8px;
  }
  
  .page-header {
    margin-bottom: 16px;
  }
  
  .knowledge-header {
    margin-bottom: 16px;
  }
  
  .knowledge-categories {
    margin-bottom: 16px;
  }
  
  .search-bar input {
    padding: 10px 14px 10px 36px;
    font-size: 13px;
  }
  
  .btn {
    padding: 8px 12px;
    font-size: 13px;
  }
  
  .knowledge-card {
    border-radius: 6px;
  }
  
  .knowledge-body {
    padding: 16px;
  }
  
  .knowledge-title {
    font-size: 15px;
  }
  
  .knowledge-description {
    font-size: 12px;
  }
}

.knowledge-container {
  min-height: 100vh;
  padding: 16px;
  font-family: "Microsoft YaHei", "Segoe UI", sans-serif;
  background-color: #F5F7FA;
}

/* 页面标题栏 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  color: #212121;
}

.page-actions {
  display: flex;
  gap: 12px;
}

/* 按钮样式 */
.btn {
  display: flex;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  border: none;
  border-radius: 6px;
  transition: all 0.3s ease;
  align-items: center;
  gap: 6px;
}

.btn i,
.btn .icon {
  font-size: 16px;
}

.btn-primary {
  color: white;
  background-color: #1976D2;
}

.btn-primary:hover {
  background-color: #0D47A1;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgb(25 118 210 / 30%);
}

.btn-success {
  color: white;
  background-color: #4CAF50;
}

.btn-success:hover {
  background-color: #2E7D32;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgb(76 175 80 / 30%);
}

.btn-outline {
  color: #1976D2;
  background-color: white;
  border: 1px solid #1976D2;
}

.btn-outline:hover {
  background-color: #F5F7FA;
  transform: translateY(-1px);
}

/* 知识库顶部搜索 */
.knowledge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.search-bar {
  position: relative;
  display: flex;
  max-width: 600px;
  align-items: center;
  flex: 1;
}

.search-bar input {
  width: 100%;
  padding: 12px 16px 12px 40px;
  font-size: 14px;
  background-color: white;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgb(0 0 0 / 5%);
  transition: all 0.3s ease;
}

.search-bar input:focus {
  border-color: #1976D2;
  outline: none;
  box-shadow: 0 0 0 3px rgb(25 118 210 / 10%);
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 14px;
  z-index: 2;
  font-size: 16px;
  color: #9E9E9E;
  transform: translateY(-50%);
}

/* 分类导航 */
.knowledge-categories {
  display: flex;
  margin-bottom: 24px;
  overflow: hidden;
  overflow-x: auto;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgb(0 0 0 / 5%);
}

.category-item {
  position: relative;
  min-width: 100px;
  padding: 14px 16px;
  font-size: 14px;
  text-align: center;
  white-space: nowrap;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
  flex: 1;
}

.category-item.active {
  font-weight: 600;
  color: #1976D2;
  background-color: #F5F7FA;
  border-bottom: 3px solid #1976D2;
}

.category-item:hover:not(.active) {
  color: #1976D2;
  background-color: #F5F7FA;
}

.category-item.active::after {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: #1976D2;
  content: '';
  animation: slideIn 0.3s ease-out;
}

/* 知识卡片网格 */
.knowledge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.knowledge-card {
  display: flex;
  overflow: hidden;
  cursor: pointer;
  background-color: white;
  border: 1px solid transparent;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 6%);
  transition: all 0.3s ease;
  flex-direction: column;
}

.knowledge-card:hover {
  border-color: #1976D2;
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgb(0 0 0 / 12%);
}

.knowledge-header-img {
  position: relative;
  display: flex;
  height: 120px;
  overflow: hidden;
  background: linear-gradient(135deg, #BBDEFB 0%, #E3F2FD 100%);
  align-items: center;
  justify-content: center;
}

.knowledge-icon {
  font-size: 48px;
  opacity: 0.8;
}

.knowledge-body {
  display: flex;
  padding: 20px;
  flex: 1;
  flex-direction: column;
}

.knowledge-title {
  display: -webkit-box;
  margin-bottom: 12px;
  overflow: hidden;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  color: #212121;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.knowledge-description {
  display: -webkit-box;
  margin-bottom: 16px;
  overflow: hidden;
  font-size: 13px;
  line-height: 1.5;
  color: #757575;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  flex: 1;
}

.knowledge-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.knowledge-tag {
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 500;
  color: #1976D2;
  background-color: #E3F2FD;
  border-radius: 12px;
}

.knowledge-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #9E9E9E;
}

.knowledge-date,
.knowledge-views {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 分页样式 */
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-item {
  margin: 0;
}

.page-link {
  display: block;
  padding: 8px 12px;
  font-size: 13px;
  color: #1976D2;
  text-decoration: none;
  cursor: pointer;
  background-color: white;
  border: 1px solid #E0E0E0;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.page-link:hover {
  background-color: #F5F7FA;
  border-color: #1976D2;
}

.page-item.active .page-link {
  color: white;
  background-color: #1976D2;
  border-color: #1976D2;
}

/* 模态框样式 */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  background-color: rgb(0 0 0 / 60%);
  animation: fadeIn 0.3s ease-out;
  align-items: center;
  justify-content: center;
}

.modal-container {
  width: 800px;
  max-width: 95%;
  max-height: 90vh;
  overflow-y: auto;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgb(0 0 0 / 20%);
  animation: slideUp 0.3s ease-out;
}

.article-modal-container {
  width: 1200px;
  height: 85vh;
  max-width: 95%;
}

.new-article-modal {
  width: 900px;
  height: 90vh;
  max-width: 95%;
}

.modal-header {
  display: flex;
  padding: 20px;
  border-bottom: 1px solid #E0E0E0;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #212121;
}

.modal-close {
  display: flex;
  width: 32px;
  height: 32px;
  font-size: 24px;
  color: #757575;
  cursor: pointer;
  background: none;
  border: none;
  border-radius: 50%;
  transition: all 0.3s ease;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: #212121;
  background-color: #F5F7FA;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

/* 文章详情样式 */
.article-title {
  margin-bottom: 20px;
  font-size: 28px;
  font-weight: 600;
  line-height: 1.3;
  color: #212121;
}

.article-meta {
  display: flex;
  padding-bottom: 20px;
  margin-bottom: 24px;
  font-size: 14px;
  color: #757575;
  border-bottom: 1px solid #E0E0E0;
  justify-content: space-between;
  align-items: center;
}

.article-author {
  display: flex;
  align-items: center;
}

.author-avatar {
  display: flex;
  width: 40px;
  height: 40px;
  margin-right: 12px;
  overflow: hidden;
  font-size: 16px;
  font-weight: 600;
  color: #1976D2;
  background-color: #BBDEFB;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.author-name {
  font-weight: 500;
  color: #212121;
}

.author-role {
  font-size: 12px;
  color: #757575;
}

.article-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.article-info-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.article-content {
  margin-bottom: 32px;
  font-size: 15px;
  line-height: 1.7;
  color: #212121;
}

.article-content :deep(p) {
  margin-bottom: 16px;
}

.article-content :deep(h3) {
  margin: 28px 0 16px;
  font-size: 18px;
  font-weight: 600;
  color: #212121;
}

.article-content :deep(ul),
.article-content :deep(ol) {
  padding-left: 24px;
  margin-bottom: 16px;
}

.article-content :deep(li) {
  margin-bottom: 8px;
}

.article-content :deep(table) {
  width: 100%;
  margin: 20px 0;
  font-size: 14px;
  border-collapse: collapse;
}

.article-content :deep(th),
.article-content :deep(td) {
  padding: 12px;
  text-align: left;
  border: 1px solid #E0E0E0;
}

.article-content :deep(th) {
  font-weight: 600;
  color: #212121;
  background-color: #F5F7FA;
}

.related-articles {
  margin-top: 40px;
}

.section-title {
  padding-bottom: 8px;
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 600;
  color: #212121;
  border-bottom: 1px solid #E0E0E0;
}

.related-list {
  padding: 0;
  list-style-type: none;
}

.related-item {
  padding: 12px 0;
  border-bottom: 1px solid #F5F7FA;
}

.related-item:last-child {
  border-bottom: none;
}

.related-link {
  font-size: 14px;
  color: #1976D2;
  text-decoration: none;
  transition: color 0.3s ease;
}

.related-link:hover {
  color: #0D47A1;
  text-decoration: underline;
}

.recent-box {
  margin-bottom: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgb(0 0 0 / 5%);
}

.recent-box-title {
  padding: 16px 20px;
  font-size: 14px;
  font-weight: 600;
  color: #212121;
  border-bottom: 1px solid #E0E0E0;
}

.recent-list {
  padding: 16px 20px;
  list-style-type: none;
}

.recent-item {
  padding: 8px 0;
  border-bottom: 1px solid #F5F7FA;
}

.recent-item:last-child {
  border-bottom: none;
}

.recent-link {
  display: flex;
  font-size: 13px;
  color: #212121;
  text-decoration: none;
  transition: color 0.3s ease;
  align-items: center;
}

.recent-link:hover {
  color: #1976D2;
}

.recent-icon {
  display: flex;
  width: 28px;
  height: 28px;
  margin-right: 10px;
  font-size: 14px;
  color: #1976D2;
  background-color: #E3F2FD;
  border-radius: 6px;
  align-items: center;
  justify-content: center;
}

/* 表单样式 */
.new-article-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #212121;
}

.form-control {
  padding: 10px 12px;
  font-size: 14px;
  background-color: white;
  border: 1px solid #E0E0E0;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.form-control:focus {
  border-color: #1976D2;
  outline: none;
  box-shadow: 0 0 0 3px rgb(25 118 210 / 10%);
}

textarea.form-control {
  min-height: 100px;
  font-family: inherit;
  resize: vertical;
}

.select-wrapper {
  position: relative;
}

.select-wrapper select {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  cursor: pointer;
  background-color: white;
  border: 1px solid #E0E0E0;
  border-radius: 6px;
  transition: all 0.3s ease;
  appearance: none;
}

.select-wrapper::after {
  position: absolute;
  top: 50%;
  right: 12px;
  font-size: 12px;
  color: #757575;
  pointer-events: none;
  content: '▼';
  transform: translateY(-50%);
}

.select-wrapper select:focus {
  border-color: #1976D2;
  outline: none;
  box-shadow: 0 0 0 3px rgb(25 118 210 / 10%);
}

/* 标签输入样式 */
.tag-input {
  display: flex;
  min-height: 48px;
  padding: 10px;
  cursor: text;
  background-color: white;
  border: 1px solid #E0E0E0;
  border-radius: 6px;
  transition: all 0.3s ease;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-input:focus-within {
  border-color: #1976D2;
  box-shadow: 0 0 0 3px rgb(25 118 210 / 10%);
}

.tag-item {
  display: flex;
  padding: 4px 10px;
  font-size: 12px;
  color: #1976D2;
  background-color: #E3F2FD;
  border-radius: 16px;
  align-items: center;
  gap: 6px;
}

.tag-item .remove-tag {
  font-size: 14px;
  color: #757575;
  cursor: pointer;
  transition: color 0.3s ease;
}

.tag-item .remove-tag:hover {
  color: #F44336;
}

.tag-input input {
  min-width: 120px;
  padding: 4px;
  font-size: 14px;
  background: transparent;
  border: none;
  outline: none;
  flex: 1;
}

/* 富文本编辑器样式 */
.richtext-editor {
  min-height: 240px;
  background-color: white;
  border: 1px solid #E0E0E0;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.richtext-editor:focus-within {
  border-color: #1976D2;
  box-shadow: 0 0 0 3px rgb(25 118 210 / 10%);
}

.editor-toolbar {
  display: flex;
  padding: 10px;
  background-color: #F5F7FA;
  border-bottom: 1px solid #E0E0E0;
  border-radius: 6px 6px 0 0;
  gap: 8px;
  flex-wrap: wrap;
}

.editor-toolbar button {
  padding: 6px 10px;
  font-size: 12px;
  color: #757575;
  cursor: pointer;
  background: none;
  border: none;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.editor-toolbar button:hover {
  color: #212121;
  background-color: #E0E0E0;
}

.editor-content {
  min-height: 180px;
  padding: 16px;
  font-size: 14px;
  line-height: 1.6;
  outline: none;
}

.form-actions {
  display: flex;
  padding-top: 20px;
  margin-top: 20px;
  border-top: 1px solid #E0E0E0;
  justify-content: flex-end;
  gap: 12px;
}

/* 栅格布局 */
.row {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -10px;
}

.col {
  padding: 0 10px;
  flex: 1;
}

.col-3 { flex: 0 0 25%; max-width: 25%; }

.col-9 { flex: 0 0 75%; max-width: 75%; }

.col-12 { flex: 0 0 100%; max-width: 100%; }

/* 动画和过渡效果 */
.knowledge-card {
  animation: cardFadeIn 0.6s ease-out;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 隐藏元素过渡 */
.knowledge-card.hidden {
  display: none;
}

/* 知识库容器样式 */
</style>