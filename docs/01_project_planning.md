# 01 - Project Planning & Requirements

## Overview
This document outlines the complete requirements and planning for the Windoor application - a comprehensive window and door manufacturing ERP and quoting system.

---

## 🎯 Project Goals

### Primary Objectives
1. **Simplify Quote Generation**: Replace manual calculations with automated system
2. **Improve Design Accuracy**: Visual design tool to prevent errors
3. **Streamline Production**: Automated CNC file generation
4. **Enhance Customer Experience**: Self-service portal for quote viewing
5. **Manage Inventory**: Real-time tracking of materials and supplies

### Success Metrics
- Quote generation time: < 5 minutes (vs 30+ minutes manual)
- Design errors: < 2% (vs 15% manual)
- Customer satisfaction: > 90%
- System uptime: 99.5%

---

## 👥 User Roles & Permissions

### 1. Super Admin
**Capabilities:**
- Full system access
- User management (create, edit, delete users)
- System configuration
- View all reports and analytics
- Manage pricing rules
- Configure product catalog

### 2. Company Admin (Manufacturer)
**Capabilities:**
- Manage dealers
- View all quotes and orders
- Manage inventory
- Configure company-specific pricing
- Generate production reports
- Manage suppliers

### 3. Dealer/Distributor
**Capabilities:**
- Create quotes for customers
- Manage own customer list
- View order status
- Access product catalog
- Submit orders to manufacturer

### 4. Sales Representative
**Capabilities:**
- Create quotes
- Follow up with customers
- View assigned projects
- Generate sales reports

### 5. Customer
**Capabilities:**
- View quotes
- Approve/reject quotes
- Track order status
- Download invoices and documents
- Update profile information

### 6. Production Manager
**Capabilities:**
- View production queue
- Download CNC files
- Update production status
- Manage work orders
- Track material usage

---

## 📋 Functional Requirements

### A. User Management Module

#### Registration & Authentication
```
Feature: User Registration
- Email-based registration
- Email verification required
- Password strength validation (min 8 chars, 1 uppercase, 1 number, 1 special)
- Role assignment by admin
- Company association for dealers

Feature: Login System
- Email/password authentication
- "Remember me" functionality
- Password reset via email
- Session management (7-day expiry)
- Multi-device login support

Feature: Profile Management
- Update personal information
- Change password
- Upload profile picture
- Manage notification preferences
- Two-factor authentication (optional)
```

### B. Product Catalog Module

#### Profile Management (Frame/Sash)
```
Features:
- Add/edit/delete profiles
- Categorize by type: Frame, Sash, Mullion, Transom
- Specify dimensions: width, height, thickness
- Set material type: PVC, UPVC, Aluminum, Wood, Composite
- Define colors and finishes
- Set pricing per meter/piece
- Upload product images
- Assign to suppliers
- Track stock levels
- Set reorder points
```

#### Hardware Management
```
Features:
- Catalog all hardware items
- Categories: Hinges, Locks, Handles, Rollers, Seals, Screws
- Specifications: size, material, finish
- Compatibility rules (which hardware fits which profiles)
- Pricing per piece
- Stock tracking
- Supplier information
```

#### Glass Types
```
Features:
- Glass categories: Single, Double, Triple glazed
- Thickness options: 4mm, 6mm, 8mm, etc.
- Special types: Tempered, Laminated, Low-E, Tinted
- Pricing per square meter
- U-value and energy ratings
- Availability status
```

### C. Window/Door Designer Module

#### Design Canvas
```
Features:
- Drag-and-drop interface
- Preset window types:
  * Casement (single/double)
  * Sliding (2-panel, 3-panel)
  * Tilt & Turn
  * Fixed
  * Awning
  * Bay/Bow windows
- Custom dimension input (width x height in mm)
- Add/remove mullions (vertical/horizontal)
- Add/remove transoms
- Grid designer for divided lights
- Opening direction selector
- Real-time dimension display
- Snap-to-grid functionality
- Zoom in/out controls
```

#### Material Selection
```
Features:
- Select frame profile from catalog
- Select sash profile
- Choose hardware set
- Select glass type
- Pick color/finish
- Preview selected materials
- Material compatibility validation
```

#### Design Validation
```
validation Rules:
- Minimum/maximum dimensions check
- Structural integrity validation
- Hardware compatibility check
- Weight capacity verification
- Building code compliance check
- Wind load calculations
- Glass size limitations
```

### D. Quotation Module

#### Quote Creation
```
Features:
- Create quote from design
- Add multiple windows/doors to single quote
- Specify quantity for each item
- Apply discounts (percentage or fixed amount)
- Add custom line items
- Include installation cost (optional)
- Set validity period (default 30 days)
- Add notes and terms & conditions
```

#### Automatic Calculations
```
Calculated Items:
- Frame material length
- Glass area
- Hardware quantity
- Sealant/weatherstrip length
- Fasteners quantity
- Labor cost estimation
- Material cost subtotal
- Markup percentage
- Tax calculation
- Grand total

Formula Examples:
Frame Length = 2 × (Width + Height)
Glass Area = (Width - Frame_Thickness) × (Height - Frame_Thickness)
```

#### Quote Management
```
Features:
- Save as draft
- Send to customer (email)
- Mark as sent/pending/approved/rejected
- Revise existing quotes
- Clone quotes
- Compare quote versions
- Generate quote number (format: Q-YYYY-MM-####)
- Set follow-up reminders
```

### E. Order Management Module

#### Order Processing
```
Workflow:
1. Quote approval by customer
2. Convert quote to order
3. Generate order number (format: ORD-YYYY-MM-####)
4. Payment processing
5. Production scheduling
6. Manufacturing
7. Quality control
8. Packaging
9. Shipping
10. Delivery confirmation

Features:
- Order status tracking
- Expected delivery date
- Production priority levels
- Order notes and special instructions
- Attach reference documents
```

#### Production Management
```
Features:
- Production queue view
- Generate cutting lists
- Generate CNC machine files (DXF/CSV format)
- Material allocation from inventory
- Track work-in-progress
- Quality checkpoints
- Production time tracking
- Assign to production team
```

### F. Inventory Management Module

#### Stock Management
```
Features:
- Real-time stock levels
- Multi-location inventory
- Minimum stock alerts
- Automatic reorder suggestions
- Stock adjustments (add/remove)
- Transfer between locations
- Stock valuation
- Inventory aging reports
```

#### Purchase Orders
```
Features:
- Create purchase orders to suppliers
- Track PO status
- Receive inventory
- Match PO to invoice
- Update stock on receipt
- Supplier performance tracking
```

#### Material Usage
```
Features:
- Track material consumption per order
- Waste tracking and reporting
- Material yield optimization
- Cost analysis per project
```

### G. Customer Portal

#### For Customers
```
Features:
- View all quotes
- Approve/reject quotes digitally
- Download quote PDFs
- Track order status
- Upload reference images
- Message dealer/sales rep
- View order history
- Download invoices
- Make payments
```

### H. Reporting & Analytics

#### Sales Reports
```
Reports:
- Daily/weekly/monthly sales
- Sales by dealer
- Sales by product type
- Quote conversion rate
- Revenue trends
- Top customers
- Sales forecast
```

#### Inventory Reports
```
Reports:
- Current stock levels
- Stock movement
- Low stock items
- Dead stock identification
- Inventory value
- Supplier performance
- Material usage analysis
```

#### Production Reports
```
Reports:
- Production efficiency
- Average production time
- Order completion rate
- Material waste percentage
- Quality defect rate
- Capacity utilization
```

---

## 🔧 Technical Requirements

### Performance Requirements
- Page load time: < 2 seconds
- API response time: < 500ms
- Design tool responsiveness: 60 fps
- Support 100+ concurrent users
- Database query optimization

### Security Requirements
- HTTPS encryption
- Password hashing (bcrypt)
- JWT token authentication
- SQL injection prevention
- XSS attack prevention
- CSRF protection
- Role-based access control (RBAC)
- Data encryption at rest
- Regular security audits
- GDPR compliance

### Browser Support
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Responsive Design
- Desktop: 1920×1080 and above
- Laptop: 1366×768 and above
- Tablet: 768×1024 (iPad)
- Mobile: 375×667 and above (iPhone SE and up)

### Database Requirements
- PostgreSQL 15+
- Automated backups (daily)
- Point-in-time recovery
- Replication for high availability
- Expected data volume: 100GB in first year

### API Requirements
- RESTful API design
- JSON data format
- API versioning (/api/v1/)
- Rate limiting (100 requests/minute per user)
- API documentation (Swagger/OpenAPI)

---

## 📊 Data Model Overview

### Core Entities
```
1. Users
2. Companies
3. Profiles (Materials)
4. Hardware
5. Glass Types
6. Designs
7. Quotes
8. Orders
9. Inventory
10. Suppliers
11. Customers
12. Payments
13. Notifications
```

### Relationships
```
- User belongs to Company
- Quote has many Designs
- Design uses Profiles, Hardware, Glass
- Quote converts to Order
- Order consumes Inventory
- Inventory supplied by Supplier
- Payment links to Order
```

---

## 🎨 UI/UX Requirements

### Design Principles
1. **Simplicity**: Minimal clicks to complete tasks
2. **Clarity**: Clear labels and instructions
3. **Consistency**: Uniform design patterns
4. **Feedback**: Immediate response to user actions
5. **Accessibility**: WCAG 2.1 AA compliance

### Color Scheme
```
Primary: #2563eb (Blue)
Secondary: #7c3aed (Purple)
Success: #10b981 (Green)
Warning: #f59e0b (Orange)
Error: #ef4444 (Red)
Neutral: #6b7280 (Gray)
Background: #f9fafb (Light Gray)
```

### Typography
```
Headings: Inter (Bold)
Body: Inter (Regular)
Monospace: Fira Code (for codes/dimensions)
```

---

## 📱 Mobile App Requirements (Future)

### Phase 2 Features
- Native iOS/Android apps
- Offline mode for dealers
- Camera integration for site measurements
- Push notifications
- AR visualization (augmented reality preview)

---

## 🔄 Integration Requirements

### Third-Party Services
```
1. Payment Gateway: Stripe
2. Email Service: SendGrid
3. SMS Service: Twilio (optional)
4. Cloud Storage: AWS S3
5. Maps: Google Maps API (for customer locations)
6. Analytics: Google Analytics
```

### Export/Import
```
Supported Formats:
- Export quotes: PDF, Excel
- Export designs: DXF, PNG, SVG
- Export CNC files: DXF, CSV, TXT
- Import inventory: CSV, Excel
- Import products: CSV
```

---

## ✅ Acceptance Criteria

### Minimum Viable Product (MVP)
```
Must Have:
✅ User authentication
✅ Basic window designer (casement, sliding)
✅ Quote generation with auto-calculation
✅ Product catalog management
✅ Basic inventory tracking
✅ Order management
✅ PDF quote generation
✅ Customer portal (view quotes)

Nice to Have:
- Payment processing
- Advanced window types
- 3D visualization
- Mobile app
- AR features
```

### MVP Success Criteria
- 10 beta users successfully create quotes
- < 5 bugs reported per 100 transactions
- 90% user satisfaction in survey
- System handles 50 concurrent users

---

## 📅 Development Phases

### Phase 1: Foundation (Weeks 1-2)
- Project setup
- Database design
- Basic authentication
- User management

### Phase 2: Core Features (Weeks 3-8)
- Product catalog
- Window designer
- Quote calculator
- Basic inventory

### Phase 3: Advanced Features (Weeks 9-12)
- Order management
- Production workflow
- Customer portal
- Payment integration

### Phase 4: Polish (Weeks 13-14)
- Testing
- Bug fixes
- Performance optimization
- Documentation

### Phase 5: Deployment (Weeks 15-16)
- Production setup
- Data migration
- User training
- Launch

---

## 💰 Cost Estimation

### Development Costs
```
Solo Developer: 16 weeks × 40 hours = 640 hours
Team (3 developers): ~8 weeks

Infrastructure (Monthly):
- Hosting (AWS/DigitalOcean): $50-200
- Database: $25-100
- Storage (S3): $10-50
- Email service: $15-50
- Domain & SSL: $15
Total: ~$115-415/month
```

### Third-Party Services (Annual)
```
- Stripe: 2.9% + $0.30 per transaction
- SendGrid: $15-120/month
- Total: Variable based on usage
```

---

## 🚀 Next Steps

After reviewing this document:

1. ✅ Approve requirements
2. ➡️ Move to [02 - Development Environment Setup](./docs/02_environment_setup.md)
3. Begin implementation

---

## 📝 Notes

- This is a living document - update as requirements evolve
- Get stakeholder approval before proceeding
- Review with team for feasibility
- Prioritize features based on user feedback

**Status**: ✅ Ready for Development
**Last Updated**: February 2026
