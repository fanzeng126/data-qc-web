<template>
  <div :class="prefixCls" class="login-page">
    <div class="login-container">
      <!-- 左侧内容区 -->
      <div class="login-left">
        <div class="logo-section">
          <img alt="" class="logo-img" src="@/assets/imgs/logo.webp" />
          <h1 class="system-title">{{ underlineToHump(appStore.getTitle) }}</h1>
        </div>
        <p class="system-description">
          基于智能规则处理的病案首页质量控制平台，帮助医疗机构提高数据质量，支持精确决策。
        </p>
        
        <div class="login-features">
          <div class="feature-item">
            <div class="feature-icon">✓</div>
            <span>智能规则配置，灵活管理质控标准</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon">✓</div>
            <span>数据自动处理，提高质控效率</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon">✓</div>
            <span>多维度分析，全面把控质量问题</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon">✓</div>
            <span>全流程管理，事前事中事后全覆盖</span>
          </div>
        </div>
      </div>
      
      <!-- 右侧登录表单区 -->
      <div class="login-right">
        <!-- 右上角的主题、语言选择 -->
        <!-- <div class="header-controls">
          <ThemeSwitch />
          <LocaleDropdown />
        </div> -->
        
        <!-- 登录表单 -->
        <div class="login-form-wrapper">
          <LoginForm />
        </div>
        
        <!-- 版权信息 -->
        <div class="login-footer">
          © 2025 陕西方立云科技有限公司 版权所有
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { underlineToHump } from '@/utils'
import { useDesign } from '@/hooks/web/useDesign'
import { useAppStore } from '@/store/modules/app'
import { ThemeSwitch } from '@/layout/components/ThemeSwitch'
import { LocaleDropdown } from '@/layout/components/LocaleDropdown'
import { LoginForm } from './components'

defineOptions({ name: 'Login' })

const { t } = useI18n()
const appStore = useAppStore()
const { getPrefixCls } = useDesign()
const prefixCls = getPrefixCls('login')
</script>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-login;

/* 响应式设计 */
@media (width <= 992px) {
  .login-container {
    width: 90%;
    max-width: 900px;
  }
}

@media (width <= 768px) {
  .login-container {
    flex-direction: column;
    height: auto;
    min-height: 500px;
  }
  
  .login-left, .login-right {
    padding: 2rem;
  }
  
  .login-left {
    .system-description {
      margin-bottom: 1rem;
    }
    
    .login-features {
      margin-top: 1rem;
      
      .feature-item {
        margin-bottom: 0.5rem;
        font-size: 13px;
      }
    }
  }
}

@media (width <= 480px) {
  .login-container {
    width: 95%;
    margin: 10px;
  }
  
  .login-left, .login-right {
    padding: 1.5rem;
  }
  
  .logo-section {
    .system-title {
      font-size: 20px;
    }
  }
}

.#{$prefix-cls} {
  overflow: hidden;
}

.login-page {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background-color: #F5F7FA;
  justify-content: center;
  align-items: center;
}

.login-container {
  display: flex;
  width: 900px;
  height: 500px;
  overflow: hidden;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgb(0 0 0 / 10%);
}

.login-left {
  position: relative;
  display: flex;
  padding: 3rem;
  color: white;
  background-color: #1976D2;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  
  &::before {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 0;
    width: 100%;
    height: 100%;
    background-image: url('@/assets/svgs/login-bg.svg');
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
    content: '';
    opacity: 0.1;
  }
  
  > * {
    position: relative;
    z-index: 1;
  }
}

.logo-section {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  
  .logo-img {
    width: 48px;
    height: 48px;
    margin-right: 12px;
  }
  
  .system-title {
    margin: 0;
    font-size: 24px;
    font-weight: bold;
  }
}

.system-description {
  margin-bottom: 2rem;
  font-size: 14px;
  line-height: 1.6;
  opacity: 0.9;
}

.login-features {
  margin-top: 2rem;
}

.feature-item {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  font-size: 14px;
  
  .feature-icon {
    display: flex;
    width: 24px;
    height: 24px;
    margin-right: 10px;
    font-size: 12px;
    font-weight: bold;
    background-color: rgb(255 255 255 / 20%);
    border-radius: 50%;
    align-items: center;
    justify-content: center;
  }
}

.login-right {
  position: relative;
  display: flex;
  padding: 2rem;
  background-color: white;
  flex: 1;
  flex-direction: column;
}

.header-controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-bottom: 1rem;
}

.login-form-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  
  :deep(.login-form) {
    width: 100%;
    max-width: 320px;
    margin: 0 auto;
    
    .el-form {
      .el-form-item {
        margin-bottom: 20px;
        
        .el-form-item__label {
          padding-bottom: 5px;
          font-size: 14px;
          color: #757575;
        }
        
        .el-input {
          .el-input__wrapper {
            padding: 12px 15px;
            border: 1px solid #E0E0E0;
            border-radius: 5px;
            transition: border-color 0.3s;
            
            &:hover, &.is-focus {
              border-color: #1976D2;
            }
          }
          
          .el-input__inner {
            font-size: 14px;
          }
        }
      }
      
      .el-button {
        width: 100%;
        padding: 12px;
        font-size: 14px;
        border-radius: 5px;
        
        &.el-button--primary {
          background-color: #1976D2;
          border-color: #1976D2;
          
          &:hover {
            background-color: #0D47A1;
            border-color: #0D47A1;
          }
        }
      }
    }
    
    .login-form-title {
      margin-bottom: 2rem;
      font-size: 20px;
      font-weight: 600;
      color: #212121;
      text-align: center;
    }
    
    .remember-forgot {
      display: flex;
      margin-bottom: 1.5rem;
      font-size: 12px;
      color: #757575;
      justify-content: space-between;
      align-items: center;
      
      .el-checkbox {
        .el-checkbox__label {
          font-size: 12px;
          color: #757575;
        }
      }
      
      a {
        font-size: 12px;
        color: #1976D2;
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
}

.login-footer {
  margin-top: 1rem;
  font-size: 12px;
  color: #9E9E9E;
  text-align: center;
}
</style>

<style lang="scss">
// 暗色主题适配
.dark .#{$namespace}-login {
  .login-container {
    background-color: var(--el-bg-color);
  }
  
  .login-right {
    background-color: var(--el-bg-color);
  }
  
  .login-footer {
    color: var(--el-text-color-regular);
  }
  
  :deep(.login-form) {
    .login-form-title {
      color: var(--el-text-color-primary);
    }
    
    .el-form-item__label {
      color: var(--el-text-color-regular) !important;
    }
    
    .remember-forgot {
      color: var(--el-text-color-regular);
      
      .el-checkbox__label {
        color: var(--el-text-color-regular) !important;
      }
    }
  }
}</style>