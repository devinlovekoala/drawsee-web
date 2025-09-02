# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development Commands
```bash
# Start development server
npm run dev

# Build the project (with TypeScript checking)
npm run build

# Build without TypeScript checking (faster)
npm run build-skip-ts

# Lint the code
npm run lint

# Preview production build
npm run preview
```

### Important Notes on Commands
- Always run `npm run lint` before committing to ensure code quality
- Use `npm run build` for production builds to catch TypeScript errors
- Development server runs on Vite with hot reload

## Project Architecture

### Technology Stack
- **Frontend Framework**: React 18.3.1 with TypeScript 5.6.2
- **Build Tool**: Vite 6.0.5
- **Styling**: Tailwind CSS 3.4.13 (注意：不是最新的4.x版本)
- **UI Components**: Radix UI 3.2.1 + custom components
- **Icons**: Lucide React 0.474.0
- **HTTP Client**: Alova 3.2.8 (替代axios)
- **Animations**: Framer Motion 12.5.0
- **Flow Diagrams**: @xyflow/react 12.4.4
- **State Management**: React Context (Zustand未使用)
- **Math Rendering**: KaTeX + react-katex
- **Markdown**: react-markdown with rehype plugins
- **Data Visualization**: D3.js 7.9.0

### Project Structure Philosophy
This is "昭析(DrawSee)" - an AI-powered thinking visualization tool using tree-structured conversations. The architecture follows a domain-driven approach:

```
src/
├── about/              # Landing page components (marketing site)
├── api/               # HTTP layer with Alova
│   ├── methods/       # API methods by domain
│   └── types/         # TypeScript interfaces
├── app/               # Main application shell
│   ├── components/    # Shared app components
│   ├── contexts/      # React Context providers
│   └── pages/         # Page-level components
├── assets/           # Static resources
├── common/           # Shared utilities and constants
└── hooks/           # Custom React hooks
```

### Core Application Flow
1. **Authentication**: Token-based auth with SaToken backend
2. **Conversation Management**: Tree-structured conversations with nodes
3. **Flow Visualization**: Interactive diagrams using ReactFlow
4. **AI Integration**: Multiple AI models (DeepSeek V3, Doubao, etc.)
5. **PDF Analysis**: Specialized PDF circuit analysis capabilities

### Key Architectural Patterns

#### Context-Based State Management
- `AppContext`: Global app state (user, conversations, UI state)
- `FlowContext`: Flow-specific state and operations
- `DocumentContext`: Document-related state management

#### Node-Based Architecture
The app uses a node-based system for conversations:
- Each conversation is a tree of nodes
- Node types: Query, Answer, Knowledge, PDF Analysis, Circuit Analysis
- Nodes support markdown, LaTeX, and embedded media

#### API Layer Design
```typescript
// Uses Alova instead of axios
import alova from '@/api/index.ts'
import { useRequest } from 'alova/client'

// All API methods are domain-organized:
// - auth.methods.ts
// - flow.methods.ts  
// - knowledge.methods.ts
// - circuit.methods.ts
// - document.methods.ts
```

### Component Architecture

#### UI Component Hierarchy
- **Base Components**: `src/app/components/ui/` - Radix UI wrappers
- **Feature Components**: Domain-specific components in respective page folders
- **Layout Components**: Sidebar, navigation, modals

#### Styling Approach
- Primary: Tailwind CSS classes in `className`
- Custom styles: Separate CSS files (never inline CSS strings)
- Animation: Framer Motion for complex animations
- Icons: Lucide React exclusively

## Development Guidelines

### Code Quality Standards
- **No ESLint errors**: Especially unused variables/parameters
- **No `any` types**: Use proper TypeScript interfaces
- **File size limit**: Keep files under 300-400 lines
- **Performance**: Use `useMemo`, `useCallback` for optimization
- **Modularity**: High cohesion, low coupling

### File Organization
```
app/pages/[domain]/
├── [domain].tsx           # Main page component
├── components/           # Domain-specific components
│   ├── ui/              # Domain UI components  
│   ├── forms/           # Form components
│   └── modals/          # Modal components
├── hooks/               # Domain hooks
├── types/               # Domain types
├── utils/               # Domain utilities
└── styles/              # Domain-specific CSS
```

### TypeScript Usage
- Define interfaces in `types/` directories
- Use proper typing for all API responses
- Export types from domain-specific type files
- Never use implicit or explicit `any`

### API Integration Patterns
```typescript
// Standard pattern for API calls
const { data, loading, error, send } = useRequest(apiMethod(), {
  immediate: false,  // Don't auto-execute
  force: true       // Skip cache
});

// Error handling
send().then(data => {
  // Success logic
}).catch(error => {
  toast.error(`操作失败，${error.message}`);
});
```

### Component Development
- Use functional components with hooks
- Implement proper prop types with TypeScript
- Follow the established naming convention (PascalCase)
- Include comprehensive comments for complex logic
- Use Tailwind for styling, CSS files for complex custom styles

### Performance Considerations
- Avoid unnecessary re-renders with `React.memo`, `useMemo`, `useCallback`
- Lazy load page components where appropriate
- Optimize images and assets
- Use proper key props in lists

### Special Features

#### PDF Circuit Analysis
- Supports specialized PDF analysis for circuit documents
- Uses streaming responses via SSE (Server-Sent Events)
- Handles large PDF documents with content truncation

#### Flow Diagram System  
- Built on ReactFlow for interactive node-based conversations
- Custom node types for different content (text, images, videos, PDFs)
- Auto-layout using D3.js algorithms
- Export capabilities (image download)

#### Multi-Model AI Support
- Integrates multiple AI models (DeepSeek V3, Doubao)
- Model-specific optimizations for different task types
- Streaming response handling for real-time feedback

### Backend Integration
- **Base URL**: Configurable in `src/api/index.ts`
- **Authentication**: Bearer token in headers
- **Response Format**: Nested response structure with error handling
- **File Uploads**: FormData support with proper Content-Type handling

### Testing & Quality Assurance
- ESLint configuration with strict rules
- TypeScript strict mode enabled
- Recommended to test API integrations thoroughly
- Verify responsive design across devices

### Cursor Rules Integration
The project includes specific Cursor IDE rules that emphasize:
- Chinese language responses by default
- Windows environment compatibility
- 2-space indentation
- Comprehensive commenting
- Performance optimization focus
- Modern, beautiful UI design standards

## Important Notes

### Version Constraints
- **Tailwind CSS**: Currently 3.4.13 (not 4.x) - upgrade carefully
- **React**: 18.3.1 - stable version
- **Node**: Ensure compatibility with TypeScript 5.6.2

### Security Considerations
- Never commit API tokens or sensitive data
- Use proper authentication headers
- Validate all user inputs
- Handle file uploads securely

### Deployment Considerations  
- Build process includes TypeScript checking
- Assets are properly optimized
- Environment variables for API endpoints
- Static site deployment compatible (Vite build)

### Performance Monitoring
- Monitor for Recalculate Style issues in CSS
- Use React DevTools for render optimization
- Track bundle size with build output
- Monitor API response times