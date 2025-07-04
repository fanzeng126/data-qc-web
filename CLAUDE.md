# CLAUDE.md
Always respond in 中文
**核心理念**：个人开发优先效率，代码清晰直接，避免过度设计。只在提升复用性和开发效率时才引入必要的设计模式。每次重点关注要求的核心逻辑实现，边缘化的逻辑不要拓展太多，一笔带过即可，适当清晰地解释重要概念。
当提出开发问题时，请提供简单直接的解决方案，专注于实际可行性而非复杂的架构讨论。
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Vue 3 + TypeScript + Element Plus** web application for **pharmaceutical data quality control** (数据质量控制平台). Built on the YuDao open-source admin framework, it provides comprehensive drug data management, quality control rules, batch processing, and analytics capabilities.

## Development Commands

### Setup & Development
```bash
# Install dependencies (uses pnpm, required >=8.6.0)
pnpm install

# Local development with hot reload
pnpm dev

# Development server (dev environment)
pnpm dev-server
```

### Code Quality & Validation
```bash
# TypeScript type checking
pnpm ts:check

# ESLint linting
pnpm lint:eslint

# Prettier formatting
pnpm lint:format

# Stylelint checking
pnpm lint:style
```

### Building
```bash
# Development build
pnpm build:dev

# Test environment build
pnpm build:test

# Staging build
pnpm build:stage

# Production build
pnpm build:prod
```

**Always run type checking and linting before committing changes.**

## Architecture Overview

### Core Technology Stack
- **Vue 3.5.12** with Composition API
- **TypeScript 5.3.3** for type safety
- **Vite 5.1.4** for build tooling
- **Element Plus 2.9.1** for UI components
- **Pinia 2.1.7** for state management
- **UnoCSS 0.58.5** for atomic CSS

### Key Architectural Patterns

**1. Modular Service Layer**
- API services in `src/api/` organized by business domain
- TypeScript interfaces for all API responses
- Centralized error handling and request interceptors

**2. Component Architecture**
- Reusable components in `src/components/`
- Domain-specific components in `src/views/[module]/`
- Consistent component naming: PascalCase with descriptive names

**3. State Management**
- Pinia stores in `src/store/modules/`
- Modular stores by feature (user, app, dict, permission, etc.)
- Composition API pattern with `defineStore`

**4. Multi-Environment Configuration**
- Environment-specific configs (`.env.local`, `.env.dev`, `.env.prod`)
- Runtime configuration via `src/config/`
- Feature flags and API endpoint management

## Business Domain Context

### Core Modules
- **DataQC** (`src/views/dataqc/`): Drug data quality control, batch imports, usage tracking
- **Drug Management** (`src/views/drug/`): Hospital data, catalogs, inbound/outbound operations
- **System** (`src/views/system/`): User management, roles, permissions, audit logs
- **AI Integration** (`src/views/ai/`): Chat, knowledge base, image generation, workflows

### Key Business Entities
- **Drug Data**: Pharmaceutical product information and metadata
- **Hospital Data**: Healthcare facility-specific drug information  
- **Quality Rules**: Configurable validation rules for data integrity
- **Batch Operations**: Large-scale data import and processing workflows

## Development Guidelines

### File Organization
```
src/api/[domain]/           # API services by business domain
src/views/[domain]/         # Page components by business domain
src/components/[feature]/   # Reusable components
src/types/                  # TypeScript definitions
src/utils/                  # Utility functions and helpers
```

### Component Patterns
- Use Composition API (`<script setup lang="ts">`)
- Props and emits with TypeScript interfaces
- Consistent form handling with Element Plus components
- Table components follow the project's Table wrapper pattern

### API Service Patterns
- Each domain has its own API module (e.g., `src/api/dataqc/`)
- Use TypeScript interfaces for request/response types
- Follow RESTful conventions with consistent error handling
- Leverage the existing request interceptor setup

### Form and CRUD Patterns
- Use `src/components/Form/` wrapper for consistent form layouts
- Table operations follow the project's CRUD patterns
- Modal dialogs for create/edit operations
- Consistent validation using Element Plus rules

### Internationalization
- All user-facing text should use `$t()` functions
- Message keys in `src/locales/zh-CN.ts` and `src/locales/en.ts`
- Follow the existing nested key structure for organization

## Build and Deployment

### Environment-Specific Builds
The project uses multiple environment configurations:
- **Local**: Development with local API endpoints
- **Dev**: Development server environment  
- **Test**: Testing environment
- **Stage**: Staging/pre-production
- **Prod**: Production environment

Each environment has its own build command and configuration file.

### Bundle Optimization
- Vite handles code splitting automatically
- Large dependencies are externalized where appropriate
- Compression enabled for production builds
- Tree shaking configured for optimal bundle size

## Special Considerations

### Multi-Tenant Architecture
The application supports multi-tenant SaaS deployment with tenant-specific data isolation.

### Permission System
Role-based access control is implemented throughout the application. Always check existing permission patterns before adding new features.

### Data Processing
The drug data quality control domain involves complex data validation rules and batch processing. Understand the existing quality control patterns before modifying data processing logic.

### AI Integration
The application includes AI-powered features for chat, document processing, and workflow automation. These features integrate with external AI services and require specific configuration.
