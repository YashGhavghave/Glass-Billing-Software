# 03 - Project Structure & Architecture

## Overview
This document explains the complete architecture of the Windoor application and the detailed file structure you'll be creating.

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────┐
│   Web Browser   │
│   (React App)   │
└────────┬────────┘
         │ HTTPS
         │ REST API
┌────────▼────────┐
│  Express Server │
│   (Node.js)     │
└────────┬────────┘
         │ Prisma ORM
┌────────▼────────┐
│   PostgreSQL    │
│    Database     │
└─────────────────┘

External Services:
- AWS S3 (File Storage)
- Stripe (Payments)
- SendGrid (Emails)
```

### Architecture Pattern: MVC + Service Layer

```
Frontend (React)
├── Views (Components)
├── Controllers (Hooks/State)
└── Models (Types/Interfaces)

Backend (Express)
├── Routes (API Endpoints)
├── Controllers (Request Handlers)
├── Services (Business Logic)
├── Models (Prisma Schema)
└── Middleware (Auth, Validation)
```

---

## 📁 Complete Project Structure

### Root Level Structure

```
windoor-app/
├── client/                 # React frontend
├── server/                 # Node.js backend
├── docker/                 # Docker configurations
├── docs/                   # Documentation
├── .git/                   # Git repository
├── .gitignore             # Git ignore file
├── docker-compose.yml     # Docker compose config
└── README.md              # Project readme
```

---

## 🎨 Client (Frontend) Structure

### Complete Client Directory

```
client/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   ├── manifest.json
│   └── robots.txt
│
├── src/
│   ├── api/                    # API integration
│   │   ├── client.ts           # Axios instance
│   │   ├── auth.api.ts         # Auth endpoints
│   │   ├── products.api.ts     # Product endpoints
│   │   ├── quotes.api.ts       # Quote endpoints
│   │   ├── orders.api.ts       # Order endpoints
│   │   └── inventory.api.ts    # Inventory endpoints
│   │
│   ├── assets/                 # Static assets
│   │   ├── images/
│   │   │   ├── logo.svg
│   │   │   └── placeholder.png
│   │   ├── icons/
│   │   │   └── window-types/
│   │   └── fonts/
│   │
│   ├── components/             # Reusable components
│   │   ├── common/             # Common UI components
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.test.tsx
│   │   │   │   └── Button.module.css
│   │   │   ├── Input/
│   │   │   │   ├── Input.tsx
│   │   │   │   └── Input.module.css
│   │   │   ├── Modal/
│   │   │   │   ├── Modal.tsx
│   │   │   │   └── Modal.module.css
│   │   │   ├── Card/
│   │   │   ├── Table/
│   │   │   ├── Dropdown/
│   │   │   ├── Pagination/
│   │   │   └── Spinner/
│   │   │
│   │   ├── layout/             # Layout components
│   │   │   ├── Header/
│   │   │   │   ├── Header.tsx
│   │   │   │   └── Header.module.css
│   │   │   ├── Sidebar/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Sidebar.module.css
│   │   │   ├── Footer/
│   │   │   └── Layout/
│   │   │
│   │   ├── designer/           # Window designer components
│   │   │   ├── Canvas/
│   │   │   │   ├── Canvas.tsx
│   │   │   │   └── Canvas.utils.ts
│   │   │   ├── Toolbar/
│   │   │   │   └── Toolbar.tsx
│   │   │   ├── PropertiesPanel/
│   │   │   │   └── PropertiesPanel.tsx
│   │   │   ├── WindowTypes/
│   │   │   │   ├── Casement.tsx
│   │   │   │   ├── Sliding.tsx
│   │   │   │   └── TiltTurn.tsx
│   │   │   └── DesignValidator/
│   │   │       └── DesignValidator.ts
│   │   │
│   │   ├── quote/              # Quote components
│   │   │   ├── QuoteForm/
│   │   │   ├── QuoteSummary/
│   │   │   ├── QuoteList/
│   │   │   └── QuotePDF/
│   │   │
│   │   └── inventory/          # Inventory components
│   │       ├── StockTable/
│   │       ├── StockForm/
│   │       └── LowStockAlert/
│   │
│   ├── features/               # Feature modules (Redux slices/hooks)
│   │   ├── auth/
│   │   │   ├── authSlice.ts
│   │   │   ├── authHooks.ts
│   │   │   └── authTypes.ts
│   │   ├── products/
│   │   │   ├── productsSlice.ts
│   │   │   └── productsTypes.ts
│   │   ├── quotes/
│   │   └── orders/
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useWindowSize.ts
│   │   └── useClickOutside.ts
│   │
│   ├── pages/                  # Page components
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   └── ForgotPasswordPage.tsx
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx
│   │   ├── designer/
│   │   │   └── DesignerPage.tsx
│   │   ├── quotes/
│   │   │   ├── QuoteListPage.tsx
│   │   │   ├── QuoteCreatePage.tsx
│   │   │   └── QuoteDetailPage.tsx
│   │   ├── orders/
│   │   │   ├── OrderListPage.tsx
│   │   │   └── OrderDetailPage.tsx
│   │   ├── inventory/
│   │   │   └── InventoryPage.tsx
│   │   ├── products/
│   │   │   ├── ProductsPage.tsx
│   │   │   └── ProductDetailPage.tsx
│   │   ├── customers/
│   │   │   └── CustomersPage.tsx
│   │   └── settings/
│   │       └── SettingsPage.tsx
│   │
│   ├── routes/                 # Routing configuration
│   │   ├── AppRoutes.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── RouteConfig.ts
│   │
│   ├── store/                  # State management (Zustand)
│   │   ├── index.ts
│   │   ├── authStore.ts
│   │   ├── designerStore.ts
│   │   └── uiStore.ts
│   │
│   ├── styles/                 # Global styles
│   │   ├── index.css
│   │   ├── tailwind.css
│   │   └── variables.css
│   │
│   ├── types/                  # TypeScript types
│   │   ├── index.ts
│   │   ├── api.types.ts
│   │   ├── user.types.ts
│   │   ├── product.types.ts
│   │   ├── quote.types.ts
│   │   └── order.types.ts
│   │
│   ├── utils/                  # Utility functions
│   │   ├── calculations/
│   │   │   ├── materialCalculator.ts
│   │   │   └── priceCalculator.ts
│   │   ├── validators/
│   │   │   ├── formValidators.ts
│   │   │   └── designValidators.ts
│   │   ├── formatters/
│   │   │   ├── dateFormatter.ts
│   │   │   ├── currencyFormatter.ts
│   │   │   └── dimensionFormatter.ts
│   │   ├── constants.ts
│   │   └── helpers.ts
│   │
│   ├── App.tsx                 # Main App component
│   ├── App.test.tsx
│   ├── index.tsx               # Entry point
│   └── setupTests.ts
│
├── .env                        # Environment variables
├── .env.example                # Environment template
├── .gitignore
├── package.json
├── tsconfig.json               # TypeScript config
├── tailwind.config.js          # Tailwind CSS config
└── README.md
```

---

## 🔧 Server (Backend) Structure

### Complete Server Directory

```
server/
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── seed.ts                 # Seed data
│   └── migrations/             # Migration history
│       └── [timestamp]_init/
│
├── src/
│   ├── config/                 # Configuration files
│   │   ├── database.ts         # DB connection
│   │   ├── redis.ts            # Redis config (optional)
│   │   ├── aws.ts              # AWS S3 config
│   │   └── email.ts            # Email config
│   │
│   ├── controllers/            # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── product.controller.ts
│   │   ├── quote.controller.ts
│   │   ├── order.controller.ts
│   │   ├── inventory.controller.ts
│   │   └── upload.controller.ts
│   │
│   ├── middleware/             # Express middleware
│   │   ├── auth.middleware.ts       # JWT verification
│   │   ├── error.middleware.ts      # Error handling
│   │   ├── validate.middleware.ts   # Request validation
│   │   ├── upload.middleware.ts     # File upload
│   │   ├── rateLimit.middleware.ts  # Rate limiting
│   │   └── logger.middleware.ts     # Request logging
│   │
│   ├── routes/                 # API routes
│   │   ├── index.ts            # Route aggregator
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── product.routes.ts
│   │   ├── quote.routes.ts
│   │   ├── order.routes.ts
│   │   └── inventory.routes.ts
│   │
│   ├── services/               # Business logic
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── product.service.ts
│   │   ├── quote/
│   │   │   ├── quote.service.ts
│   │   │   ├── calculator.service.ts
│   │   │   └── material.service.ts
│   │   ├── order.service.ts
│   │   ├── inventory.service.ts
│   │   ├── email.service.ts
│   │   ├── pdf.service.ts
│   │   └── cnc.service.ts      # CNC file generation
│   │
│   ├── types/                  # TypeScript types
│   │   ├── index.d.ts
│   │   ├── express.d.ts        # Express type extensions
│   │   └── models.ts           # Model types
│   │
│   ├── utils/                  # Utility functions
│   │   ├── validation/
│   │   │   ├── schemas.ts      # Joi/Zod schemas
│   │   │   └── rules.ts
│   │   ├── helpers/
│   │   │   ├── dateHelper.ts
│   │   │   ├── hashHelper.ts
│   │   │   └── tokenHelper.ts
│   │   ├── errors/
│   │   │   ├── AppError.ts
│   │   │   ├── ValidationError.ts
│   │   │   └── errorCodes.ts
│   │   └── logger.ts           # Winston logger
│   │
│   ├── app.ts                  # Express app setup
│   └── server.ts               # Server entry point
│
├── tests/                      # Test files
│   ├── unit/
│   │   ├── services/
│   │   └── utils/
│   ├── integration/
│   │   └── api/
│   └── setup.ts
│
├── uploads/                    # Temporary uploads
├── logs/                       # Log files
├── .env
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── jest.config.js              # Jest configuration
└── README.md
```

---

## 🗃️ Database Schema Overview

### Entity Relationship Diagram (ERD)

```
┌─────────────┐
│    Users    │
└──────┬──────┘
       │ 1:N
┌──────▼──────┐
│  Companies  │
└──────┬──────┘
       │ 1:N
┌──────▼──────┐       ┌──────────────┐
│   Projects  │──────>│WindowsDesigns│
└──────┬──────┘  1:N  └──────────────┘
       │
       │ 1:N
┌──────▼──────┐
│   Quotes    │
└──────┬──────┘
       │ 1:1
┌──────▼──────┐       ┌──────────────┐
│   Orders    │──────>│   Payments   │
└─────────────┘  1:1  └──────────────┘

┌──────────────┐
│   Profiles   │──┐
└──────────────┘  │
                  │ Used By
┌──────────────┐  │ Designs
│   Hardware   │──┤
└──────────────┘  │
                  │
┌──────────────┐  │
│  GlassTypes  │──┘
└──────────────┘

┌──────────────┐       ┌──────────────┐
│  Inventory   │──────>│  Suppliers   │
└──────────────┘  N:1  └──────────────┘
```

### Core Tables Summary

1. **users**: Authentication and user profiles
2. **companies**: Manufacturer/dealer companies
3. **profiles**: Window/door frame profiles
4. **hardware**: Hinges, locks, handles, etc.
5. **glass_types**: Glass specifications
6. **projects**: Customer projects
7. **window_designs**: Design configurations
8. **quotes**: Price quotations
9. **orders**: Production orders
10. **inventory**: Stock management
11. **suppliers**: Material suppliers
12. **payments**: Payment transactions

---

## 🔄 Data Flow Architecture

### Quote Creation Flow

```
1. User Input (Designer)
   ↓
2. Design Validation
   ↓
3. Material Calculation
   ↓
4. Price Calculation
   ↓
5. Quote Generation
   ↓
6. Save to Database
   ↓
7. Generate PDF
   ↓
8. Send Email
```

### Order Processing Flow

```
1. Quote Approval
   ↓
2. Create Order
   ↓
3. Process Payment
   ↓
4. Reserve Inventory
   ↓
5. Generate CNC Files
   ↓
6. Production Queue
   ↓
7. Manufacturing
   ↓
8. Quality Check
   ↓
9. Shipping
   ↓
10. Delivery Confirmation
```

---

## 🔐 Security Architecture

### Authentication Flow

```
1. User Login Request
   ↓
2. Validate Credentials
   ↓
3. Generate JWT Token
   ↓
4. Return Token to Client
   ↓
5. Client Stores in localStorage
   ↓
6. Include in API Headers
   ↓
7. Server Validates Token
   ↓
8. Grant/Deny Access
```

### Authorization Levels

```
Super Admin
    ├── Company Admin
    │   ├── Production Manager
    │   └── Sales Manager
    │       └── Sales Rep
    ├── Dealer
    │   └── Dealer Staff
    └── Customer
```

---

## 📡 API Architecture

### RESTful Endpoint Structure

```
/api/v1/
├── /auth
│   ├── POST   /register
│   ├── POST   /login
│   ├── POST   /logout
│   ├── POST   /refresh-token
│   └── POST   /forgot-password
│
├── /users
│   ├── GET    /
│   ├── GET    /:id
│   ├── PUT    /:id
│   ├── DELETE /:id
│   └── PATCH  /:id/password
│
├── /products
│   ├── GET    /profiles
│   ├── POST   /profiles
│   ├── PUT    /profiles/:id
│   ├── GET    /hardware
│   ├── POST   /hardware
│   └── GET    /glass-types
│
├── /quotes
│   ├── GET    /
│   ├── POST   /
│   ├── GET    /:id
│   ├── PUT    /:id
│   ├── DELETE /:id
│   ├── POST   /:id/send
│   └── GET    /:id/pdf
│
├── /orders
│   ├── GET    /
│   ├── POST   /
│   ├── GET    /:id
│   ├── PATCH  /:id/status
│   └── GET    /:id/cnc-files
│
└── /inventory
    ├── GET    /
    ├── POST   /
    ├── PUT    /:id
    └── GET    /low-stock
```

---

## 💾 Caching Strategy

### Redis Caching (Optional)

```
Cache Keys:
- user:{userId}           → TTL: 1 hour
- products:all            → TTL: 15 minutes
- quote:{quoteId}         → TTL: 30 minutes
- inventory:levels        → TTL: 5 minutes
```

---

## 📊 File Upload Strategy

### Storage Structure

```
AWS S3 Bucket:
windoor-app/
├── uploads/
│   ├── profiles/
│   │   └── {userId}/
│   │       └── avatar.jpg
│   ├── products/
│   │   └── {productId}/
│   │       └── image.jpg
│   ├── designs/
│   │   └── {designId}/
│   │       ├── preview.png
│   │       └── drawing.dxf
│   └── documents/
│       └── {orderId}/
│           ├── quote.pdf
│           └── invoice.pdf
```

---

## 🧪 Testing Architecture

### Testing Pyramid

```
       ┌──────────────┐
       │ E2E Tests    │  ← Few, slow, high confidence
       ├──────────────┤
       │ Integration  │  ← Some, medium speed
       │ Tests        │
       ├──────────────┤
       │ Unit Tests   │  ← Many, fast, specific
       └──────────────┘
```

---

## 📝 Code Organization Principles

### 1. Single Responsibility
Each file/module has one clear purpose

### 2. DRY (Don't Repeat Yourself)
Reusable components and utilities

### 3. Separation of Concerns
- UI Logic (Components)
- Business Logic (Services)
- Data Logic (Models)

### 4. Dependency Injection
Pass dependencies instead of importing

### 5. Error Handling
Centralized error handling middleware

---

## ✅ Architecture Checklist

Before proceeding:

- [ ] Understand the overall system architecture
- [ ] Familiar with frontend structure
- [ ] Familiar with backend structure
- [ ] Understand data flow
- [ ] Understand security model
- [ ] Understand API structure
- [ ] Know where each type of code belongs

---

## 🎯 Next Steps

Now that you understand the architecture:

➡️ **Next**: [04 - Git & Version Control Setup](./04_git_setup.md)

---

**Status**: ✅ Architecture Documented
**Last Updated**: February 2026
