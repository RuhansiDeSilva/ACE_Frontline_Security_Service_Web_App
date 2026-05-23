# ACE Front-Line Security Solutions

A comprehensive security staffing and management platform built with **Spring Boot 3.5.10**, **React 18**, and **AI/ML** capabilities for intelligent risk assessment and resource optimization.

---

## 📋 Project Overview

ACE Front-Line Security Solutions is an enterprise security management system designed to streamline security operations for multiple clients. The platform manages security officers, shift scheduling, payroll, invoicing, and includes AI-powered risk assessment to optimize security deployment based on client characteristics and threat levels.

**Key Stakeholders:**
- **Clients**: Organizations requiring security services
- **Security Officers**: Field personnel providing security services  
- **Managers**: Area managers, operational managers overseeing operations
- **Administrators**: Accountants, directors handling finance and operations
- **Leadership**: Executive officers and company chairman

---

## 🎯 Core Features

### For Clients
- 📊 Dashboard with service invoices and payments
- 📋 Shift schedule visibility
- 💬 Feedback submission
- 💳 Payment processing and proof upload
- 📧 Email notifications for service updates

### For Security Officers
- 👤 Profile management and leave requests
- 💰 Loan and advance request systems
- 📄 Payslip access and salary history
- 📝 Attendance and shift tracking
- 🔐 QR-based verification system

### For Administrators
- 💼 Payroll management and approval workflows
- 📊 Invoice and billing management
- 💳 Payment verification and reconciliation
- 📈 Financial reports and statistics
- 🎖️ Officer assignments and schedules

### For AI/ML Engine
- 🤖 **Risk Assessment**: Predict security risk levels for client sites
- 📊 **Officer Requirement Prediction**: Calculate optimal number of officers needed
- 🎯 **Intelligent Deployment**: Data-driven security resource optimization

---

## 🛠️ Technology Stack

### Backend
- **Framework**: Spring Boot 3.5.10
- **Language**: Java 21
- **Database**: MySQL 8.0
- **Security**: JWT (JSON Web Tokens) + Spring Security
- **ORM**: JPA/Hibernate
- **API**: RESTful endpoints
- **PDF Generation**: iTextPDF 5.5.13.3
- **Email**: Spring Mail + Gmail SMTP
- **Task Scheduling**: Spring Scheduling (@EnableScheduling)
- **Build Tool**: Maven

### Frontend
- **Framework**: React 18.3.1
- **Language**: TypeScript
- **Build Tool**: Vite 5.4.21
- **UI Components**: Shadcn UI + Radix UI
- **Styling**: Tailwind CSS + PostCSS
- **State Management**: TanStack React Query
- **HTTP Client**: Axios
- **Forms**: React Hook Form
- **Charts**: Chart.js
- **PDF/Export**: html2canvas, jsPDF
- **QR Code**: qrcode.react
- **Date Handling**: date-fns
- **Animations**: Framer Motion
- **Testing**: Vitest

### ML/AI Service
- **Framework**: FastAPI
- **Language**: Python
- **ML Libraries**: scikit-learn 1.6.1, joblib
- **Server**: Uvicorn
- **Models**: Pre-trained Random Forest models for classification and regression

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                       │
│            Running on http://localhost:5173                 │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTPS/REST API
┌────────────────▼────────────────────────────────────────────┐
│                 Backend (Spring Boot)                       │
│            Running on http://localhost:8090                 │
│  • REST Controllers (36+ endpoints)                         │
│  • JWT Authentication & Authorization                       │
│  • JPA/Hibernate ORM Layer                                  │
│  • Service & Business Logic Layer                           │
│  • Scheduled Jobs (Cron tasks)                              │
│  • Email Notifications                                      │
└────────────────┬────────────────────────────────────────────┘
                 │ Database
┌────────────────▼────────────────────────────────────────────┐
│              MySQL Database (security_db)                   │
│  • 45+ JPA Repositories                                     │
│  • Complex Domain Models                                    │
│  • Transaction Management                                   │
└─────────────────────────────────────────────────────────────┘
                 │ ML Predictions
┌────────────────▼────────────────────────────────────────────┐
│         ML Service (FastAPI + Python)                       │
│  • Risk Assessment Model                                    │
│  • Officer Requirement Predictor                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
Ace-Front-Line-Security-Solutions/
├── 📂 src/main/java/
│   └── com/security/Ace/Front/Line/Security/Solutions/
│       ├── controller/          # 36+ REST API controllers
│       ├── service/             # Business logic
│       ├── entity/              # Domain models (45+ entities)
│       ├── repository/          # JPA repositories
│       ├── config/              # Security, CORS, strategy configs
│       ├── dto/                 # Data transfer objects
│       ├── scheduler/           # Scheduled tasks
│       ├── validator/           # Custom validators
│       ├── exception/           # Custom exceptions
│       └── util/                # Utility classes
│
├── 📂 frontend/
│   ├── src/
│   │   ├── components/          # React components (UI, layouts)
│   │   │   ├── ui/              # Shadcn UI components
│   │   │   ├── client/          # Client-facing components
│   │   │   ├── inquiry/         # Inquiry management
│   │   │   ├── profile/         # User profile components
│   │   │   ├── shift-schedule/  # Shift scheduling
│   │   │   └── website/         # Public website
│   │   ├── pages/               # Page-level components (40+ pages)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # API clients, utilities, helpers
│   │   ├── services/            # Service layer
│   │   ├── data/                # Mock data & types
│   │   ├── config/              # Network configuration
│   │   └── utils/               # Utility functions
│   ├── vite.config.ts           # Vite configuration
│   ├── tailwind.config.ts       # Tailwind CSS config
│   ├── tsconfig.json            # TypeScript config
│   └── package.json
│
├── 📂 ml-service/
│   ├── app.py                   # FastAPI application
│   ├── requirements.txt         # Python dependencies
│   ├── final_model_package.pkl  # Risk assessment model
│   └── final_model2_package.pkl # Officer requirement model
│
├── 📂 uploads/                  # File storage
│   ├── cv/                      # CV documents
│   ├── photos/staff/            # Staff photos
│   └── payment-proofs/          # Payment verification documents
│
├── pom.xml                      # Maven configuration
├── mvnw                         # Maven wrapper (Unix)
├── mvnw.cmd                     # Maven wrapper (Windows)
└── README.md                    # This file
```

---

## 🚀 Getting Started

### Prerequisites
- **Java 21** (OpenJDK or Oracle JDK)
- **Node.js 18+** and npm
- **MySQL 8.0+**
- **Python 3.9+** (for ML service)
- **Git**

### 1. Clone Repository
```bash
git clone https://github.com/RuhansiDeSilva/ACE_Frontline_Security_Service_Web_App.git
cd ACE_Frontline_Security_Service_Web_App
```

### 2. Database Setup
```sql
-- Create database
CREATE DATABASE security_db;

-- The application will auto-create tables via Hibernate DDL (ddl-auto=update)
```

### 3. Backend Setup

#### Configure Database Connection
Edit `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/security_db
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD

# Update JWT secret (keep it at least 256 bits)
jwt.secret=YOUR_SECRET_KEY

# Configure email (Gmail)
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
```

#### Build and Run Backend
```bash
# Build
./mvnw clean package

# Run
./mvnw spring-boot:run
# Backend will start on http://localhost:8090
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
# Frontend will start on http://localhost:5173

# Build for production
npm run build

# Run tests
npm test
```

### 5. ML Service Setup

```bash
cd ml-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI server
uvicorn app:app --host 0.0.0.0 --port 8000
# ML API will be available at http://localhost:8000
```

---

## 🔐 Authentication & Authorization

### JWT-Based Authentication
- **Secret**: Configured in `application.properties`
- **Expiration**: 24 hours (86400000 ms)
- **Token Format**: Bearer token in Authorization header

### Role-Based Access Control (RBAC)
```
Roles:
├── ADMIN              # Full system access
├── DIRECTOR           # Financial oversight
├── CHAIRMAN           # Executive level
├── ACCOUNTANT         # Finance & billing
├── EXECUTIVE_OFFICER  # Operations oversight
├── AREA_MANAGER       # Client account management
├── OPERATIONAL_MANAGER# Field operations
├── OFFICER            # Security personnel
└── CLIENT             # Service recipient
```

### Endpoints Security
- Public: `/auth/login`, `/auth/register`
- Protected: All other endpoints require valid JWT

---

## 📊 Database Schema Highlights

### Key Entities (45+ total)
```
Users
├── role (Enum)
├── designation
├── salary info
└── credentials

Clients
├── risk_level (CRITICAL, HIGH, MEDIUM, LOW)
├── status (ACTIVE, SUSPENDED, EXPIRED, TERMINATED)
└── service details

Invoices
├── items (ENTRY_LEVEL_SERVICE, JSO_SERVICE, etc.)
├── deductions (ABSENCE, MISCONDUCT, SLA_BREACH, etc.)
├── status (DRAFT, ISSUED, PAID, OVERDUE, etc.)
└── payments tracking

Payroll
├── salary components
├── deductions
├── approvals
└── payments

Shift Schedules
├── assignment_officers
├── shifts (DAY, NIGHT)
└── attendance tracking

Loans & Advances
├── requests
├── approvals
└── deductions
```

---

## 🔌 API Endpoints (36+ Controllers)

### Core Controllers
| Controller | Purpose | Base Path |
|-----------|---------|-----------|
| AuthController | Authentication & JWT | `/api/auth` |
| UserController | User management | `/api/users` |
| ClientController | Client management | `/api/clients` |
| InvoiceController | Invoice management | `/api/invoices` |
| PaymentController | Payment processing | `/api/payments` |
| PayrollController | Payroll operations | `/api/payroll` |
| ShiftScheduleController | Shift assignments | `/api/shifts` |
| LoanController | Loan requests | `/api/loans` |
| LeaveRequestController | Leave management | `/api/leaves` |
| PredictionController | ML predictions | `/api/predictions` |
| NotificationController | Notifications | `/api/notifications` |
| ReportController | Financial reports | `/api/reports` |

**Example Request:**
```bash
curl -X GET http://localhost:8090/api/users/dashboard \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## 🎨 Frontend Routes (40+ Pages)

### Public Routes
- `/` - Landing page
- `/login` - Staff login
- `/client-login` - Client login
- `/forgot-password` - Password reset
- `/careers` - Job openings

### Client Portal
- `/client/dashboard` - Dashboard
- `/client/invoices` - View invoices
- `/client/payments` - Payment management
- `/client/feedback` - Submit feedback
- `/client/shift-schedule` - Shift visibility

### Staff Portal
- `/dashboard` - Personnel dashboard
- `/profile` - Profile management
- `/leave-requests` - Leave application
- `/loan-requests` - Loan/advance requests
- `/payslips` - Salary information

### Management Portals
- `/admin/payroll` - Payroll management
- `/admin/invoices` - Invoice management
- `/accountant/dashboard` - Finance dashboard
- `/area-manager/dashboard` - Client management
- `/operational-manager/dashboard` - Field operations
- `/director/dashboard` - Strategic oversight
- `/chairman/dashboard` - Executive dashboard

---

## 📧 Email Notifications

### Automated Email Types
- **Credentials**: Initial account creation
- **Invoice Issued**: New invoice notification
- **Payment Reminder**: Pending payment alerts
- **Payment Verified**: Payment confirmation
- **Contract Renewal**: Service renewal notices
- **Contract Expired**: Expiration alerts
- **Overdue Notice**: Payment overdue alerts
- **Payment Rejected**: Failed payment notification
- **Feedback Approved**: Feedback response

**Config:**
```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=company123@gmail.com
# Use App Password for Gmail
spring.mail.password=CHANGE_ME_APP_PASSWORD
```

---

## 🤖 AI/ML Integration

### Risk Assessment Model
**Input Features:**
- Employee count
- Required officers
- Distance to city
- Company assets value
- CCTV count
- Company type
- Location (urban/rural)
- Night activity
- Major events nearby
- Cash handling

**Output:**
- Risk Level: Low (0), Medium (1), High (2)

**Usage:**
```bash
POST /api/predictions/assess-risk
Content-Type: application/json

{
  "company_name": "ABC Corp",
  "employee_count": 500,
  "required_officers": 10,
  "distance_to_city_km": 5.5,
  "company_assets": 500000,
  "cctv_count": 8,
  "company_type": "Retail",
  "urban_rural": "urban",
  "night_activity": true,
  "nearest_city": "Colombo",
  "major_event_nearby": false,
  "cash_handling": true
}
```

---

## ⏰ Scheduled Tasks

```properties
app.jobs.timezone=UTC

# Payment reminders daily at 9:00 AM
app.jobs.payment-reminders-cron=0 0 9 * * *

# Contract expiration checks daily at 9:30 AM
app.jobs.contracts-cron=0 30 9 * * *
```

---

## 🧪 Testing

### Frontend Tests
```bash
cd frontend

# Run tests
npm test

# Watch mode
npm test:watch

# Run linter
npm run lint
```

### Backend Tests
```bash
# Run tests
./mvnw test

# Test with coverage
./mvnw test jacoco:report
```

---

## 📦 Build & Deployment

### Frontend Production Build
```bash
cd frontend
npm run build
# Output: dist/ directory ready for static hosting
```

### Backend Production Build
```bash
./mvnw clean package -DskipTests
# Output: target/Ace-Front-Line-Security-Solutions-0.0.1-SNAPSHOT.jar
```

### Running JAR
```bash
java -jar target/Ace-Front-Line-Security-Solutions-0.0.1-SNAPSHOT.jar
```

---

## 🔧 Configuration Management

### Environment-Specific Configuration
Create `application-{profile}.properties`:
- `application-dev.properties` - Development
- `application-prod.properties` - Production
- `application-test.properties` - Testing

### Strategy Pattern Configuration
```properties
# Options: "project" or "source"
app.strategy.salary=project          # Salary calculation strategy
app.strategy.payment=project          # Payment processing strategy
app.strategy.billing=project          # Billing calculation strategy
```

---

## 📊 Performance Optimization

### Backend
- Database connection pooling (HikariCP)
- JPA query optimization
- Spring Data caching
- Async email sending

### Frontend
- Code splitting with Vite
- React Query for caching
- Lazy component loading
- Image optimization

---

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/AmazingFeature`
2. Commit changes: `git commit -m 'Add AmazingFeature'`
3. Push to branch: `git push origin feature/AmazingFeature`
4. Open Pull Request

### Code Style
- **Backend**: Google Java Style Guide
- **Frontend**: Prettier + ESLint configuration

---

## 📝 License

This project is proprietary software. All rights reserved.

---


---

## 🎉 Acknowledgments

Built with modern technologies and best practices:
- Spring Boot ecosystem
- React and modern JavaScript
- FastAPI for ML services
- Open-source libraries and communities

---

**Last Updated**: May 23, 2026  
**Version**: 0.0.1-SNAPSHOT
