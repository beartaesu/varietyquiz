# K-연예인 퀴즈 애플리케이션

## Overview

K-연예인 퀴즈는 한국 연예인을 맞히는 웹 기반 퀴즈 게임입니다. 사용자는 연예인 사진을 보고 이름을 입력하여 점수를 획득하며, 타이머 기반의 실시간 퀴즈 진행과 점수 시스템을 제공합니다. React와 Express.js를 기반으로 한 풀스택 웹 애플리케이션으로, 현대적인 UI/UX와 반응형 디자인을 특징으로 합니다.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool
- **UI Library**: shadcn/ui components with Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query for server state management and React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Build System**: Vite with ESBuild for fast development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API architecture with structured route handlers
- **Data Layer**: In-memory storage implementation with interface abstraction for future database integration
- **Middleware**: Custom logging, error handling, and JSON parsing middleware

### Database Design
- **ORM**: Drizzle ORM configured for PostgreSQL with type-safe schema definitions
- **Schema**: Three main entities - celebrities (name, image, debut year, genre, works, difficulty), quiz sessions (progress tracking, scoring), and users (authentication ready)
- **Migrations**: Drizzle Kit for database schema management and migrations

### Development Environment
- **Monorepo Structure**: Organized with separate client, server, and shared directories
- **Shared Types**: Common TypeScript interfaces and schemas shared between frontend and backend
- **Hot Reload**: Vite development server with HMR for rapid development
- **Type Safety**: Full TypeScript coverage across the entire application stack

### Component Architecture
- **Design System**: Modular component library with consistent theming
- **Game Components**: Specialized components for quiz functionality (Timer, QuestionCard, FeedbackDisplay, ResultsModal)
- **Layout Components**: Reusable UI components (GameHeader, various form elements)
- **Custom Hooks**: Reusable logic for timer management, mobile detection, and toast notifications

### Game Logic Implementation
- **Quiz Flow**: Multi-state game progression (playing → feedback → completed)
- **Scoring System**: Points calculation with time-based bonuses
- **Timer System**: Custom hook-based countdown timer with visual progress indicators
- **Answer Validation**: Real-time input validation and feedback display

## External Dependencies

### Core Frameworks
- **React Ecosystem**: React 18, React DOM, React Hook Form with Zod validation
- **Build Tools**: Vite, ESBuild, TypeScript compiler
- **CSS Framework**: Tailwind CSS with PostCSS processing

### UI Component Libraries
- **Radix UI**: Complete set of accessible UI primitives (dialogs, dropdowns, forms, navigation)
- **Styling Utilities**: class-variance-authority for component variants, clsx for conditional classes
- **Icons & Assets**: Lucide React for consistent iconography

### Backend Infrastructure
- **Web Framework**: Express.js with TypeScript support
- **Database**: Neon Database (PostgreSQL) with Drizzle ORM
- **Session Management**: connect-pg-simple for PostgreSQL session storage
- **Development Tools**: tsx for TypeScript execution, drizzle-kit for migrations

### Development & Deployment
- **Replit Integration**: Custom Vite plugins for Replit development environment
- **Error Handling**: Runtime error overlay for development debugging
- **Code Quality**: TypeScript strict mode, ESLint configuration ready

### Utility Libraries
- **State Management**: TanStack React Query for server state caching and synchronization
- **Form Handling**: React Hook Form with Hookform Resolvers for validation
- **Date Handling**: date-fns for time-based calculations
- **Validation**: Zod schema validation with Drizzle integration