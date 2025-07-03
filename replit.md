# Upstage Demo Showcase

## Overview

This is a comprehensive developer showcase for Upstage's three AI services, built as an interactive web application. The platform demonstrates Document Parse, Information Extract, and Solar LLM capabilities through live demos, multi-language code examples, and developer-friendly documentation. The application serves as both a demo platform and educational resource for developers wanting to integrate Upstage's AI services.

## System Architecture

The application follows a full-stack monorepo architecture with clear separation between client and server components:

### Frontend Architecture
- **Framework**: React with TypeScript and Vite for fast development and building
- **UI Framework**: Shadcn/UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **File Handling**: React Dropzone for drag-and-drop file uploads

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **File Processing**: Multer for multipart form data handling
- **API Integration**: Custom Upstage API client for external service communication

### Database Architecture
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon Database)
- **Schema Management**: Drizzle Kit for migrations and schema management

## Key Components

### Core AI Service Integrations
1. **Document Parse Service**: Converts documents to structured HTML/Markdown with layout preservation
2. **Information Extract Service**: Extracts structured data using custom JSON schemas
3. **Solar LLM Service**: Provides advanced reasoning and Q&A capabilities

### Interactive Demo Components
- **File Upload Component**: Drag-and-drop interface with progress tracking and validation
- **Code Block Component**: Syntax-highlighted code examples with copy-to-clipboard functionality
- **Demo Components**: Service-specific interactive demos for each AI capability
- **Navigation Component**: Smooth scrolling navigation with mobile-responsive design

### Developer Experience Features
- **Multi-language Code Examples**: Python, JavaScript, cURL, and Java implementations
- **Real-time API Integration**: Live demos using actual Upstage API endpoints
- **Responsive UI**: Mobile-first design with adaptive layouts
- **Toast Notifications**: User feedback for actions and errors

## Data Flow

### File Processing Workflow
1. User uploads document through drag-and-drop interface
2. Frontend validates file type and size constraints
3. File is sent to backend via multipart form data
4. Backend processes file using appropriate Upstage API service
5. Results are returned and displayed in interactive UI components

### API Request Flow
1. Frontend components trigger API calls through custom hooks
2. TanStack Query manages request state and caching
3. Backend routes handle authentication and forward requests to Upstage APIs
4. Responses are processed and formatted for frontend consumption
5. UI updates with results or error states

### Database Operations
1. User actions and API usage are tracked in PostgreSQL database
2. Drizzle ORM provides type-safe database operations
3. Schema includes users, documents, and API usage tracking tables
4. Database operations support future analytics and user management features

## External Dependencies

### Core Dependencies
- **Upstage API**: External AI service provider for all three core capabilities
- **Neon Database**: PostgreSQL database hosting service
- **Radix UI**: Headless UI component library for accessibility
- **TanStack Query**: Server state management and caching
- **Lucide React**: Icon library for consistent UI elements

### Development Dependencies
- **Vite**: Build tool and development server
- **TypeScript**: Type safety and developer experience
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler for production builds

### API Integration
- **Environment Variables**: UPSTAGE_API_KEY required for API access
- **Error Handling**: Comprehensive error handling for API failures
- **Rate Limiting**: Consideration for API usage limits and quotas

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite compiles React application to static assets
2. **Backend Build**: ESBuild bundles server code for Node.js runtime
3. **Database Migration**: Drizzle Kit applies schema changes to PostgreSQL
4. **Environment Configuration**: API keys and database URLs configured via environment variables

### Production Setup
- **Static Assets**: Frontend build output served from `/dist/public` directory
- **Server Runtime**: Express server handles API routes and serves static files
- **Database Connection**: PostgreSQL connection via environment variable
- **API Authentication**: Upstage API key required for service functionality

### Development Workflow
- **Hot Module Replacement**: Vite provides fast development server with HMR
- **Type Checking**: TypeScript compilation ensures type safety
- **Database Development**: In-memory storage option for local development
- **API Mocking**: Fallback handling when API keys are not configured

## Changelog

```
Changelog:
- July 01, 2025. Initial setup and basic structure
- July 01, 2025. Enhanced to detailed, functionality-focused content:
  - Added comprehensive README with technical documentation
  - Implemented production-ready architecture patterns
  - Enhanced hero section with detailed service explanations
  - Added comprehensive implementation guide section
  - Included enterprise architecture patterns and code examples
  - Added performance, security, and compliance documentation
  - Configured API key (up_DYMaQNy182Y6aGaRJNQxXnvTcQ5di) for live demos
  - Focused on educational content over UI aesthetics
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```