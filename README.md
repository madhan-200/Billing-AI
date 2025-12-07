# BillerAGI - AI-Powered Billing Automation Platform

![BillerAGI](https://img.shields.io/badge/BillerAGI-v1.0.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-v18+-green)
![React](https://img.shields.io/badge/React-v18.3-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue)

**BillerAGI** is a complete end-to-end billing automation platform that eliminates manual billing analyst work through AI-powered invoice validation, automated client query handling, and intelligent payment reminders.

## 🚀 Features

### Core Automation
- ✅ **Automated Invoice Generation** - PDFKit-powered professional invoices with company branding
- ✅ **AI Validation Engine** - Gemini API validates invoices for accuracy, duplicates, and anomalies
- ✅ **Smart Scheduling** - Node-Cron automated daily billing and reminder execution
- ✅ **Email Delivery** - Nodemailer integration with professional HTML templates
- ✅ **Cloud Storage** - Cloudinary PDF storage with signed URLs
- ✅ **Payment Tracking** - Complete payment lifecycle management

### AI Capabilities
- 🤖 **Invoice Validation** - AI verifies amounts, taxes, discounts against contract terms
- 🤖 **Anomaly Detection** - Flags suspicious patterns and duplicates
- 🤖 **Client AI Assistant** - Handles 80-90% of client queries automatically
- 🤖 **Smart Escalation** - Routes complex queries to human staff
- 🤖 **Billing Insights** - AI-generated suggestions for process improvement

### Dashboard Features
- 📊 **Real-Time Metrics** - Animated cards with count-up effects (GSAP)
- 📈 **Interactive Charts** - Revenue trends, payment status, invoice volume (Recharts)
- 📋 **Invoice Management** - Searchable, filterable table with status tracking
- 🎨 **Smooth Animations** - GSAP-powered transitions and micro-interactions
- 🔒 **Secure Authentication** - JWT-based admin access

### Compliance & Audit
- 📝 **Complete Audit Trail** - Every action logged with timestamps
- 🔍 **AI Decision Logging** - Full transparency on AI validations
- 📊 **Compliance Reports** - Generate audit reports for any date range
- 🛡️ **Security First** - Environment variables, signed URLs, authentication

## 🏗️ Architecture

```
BillerAGI/
├── backend/                 # Node.js Express Backend
│   ├── database/           # PostgreSQL models & schema
│   ├── modules/
│   │   ├── ai/            # Gemini AI integration
│   │   ├── invoice/       # PDF generation & storage
│   │   ├── email/         # Nodemailer templates
│   │   ├── scheduler/     # Cron jobs
│   │   └── audit/         # Logging & compliance
│   ├── routes/            # REST API endpoints
│   ├── middleware/        # JWT authentication
│   └── server.js          # Express server
│
└── frontend/               # React Dashboard
    ├── src/
    │   ├── components/    # React components
    │   ├── utils/         # API client & animations
    │   └── main.jsx       # App entry point
    └── vite.config.js     # Vite configuration
```

## 📋 Prerequisites

- **Node.js** v18 or higher
- **PostgreSQL** (Neon account recommended)
- **Gemini API Key** (Google AI)
- **Cloudinary Account** (for PDF storage)
- **Gmail Account** (for SMTP or use SendGrid)

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd BillerAGI
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `.env` file:
```env
# Server
PORT=5000
NODE_ENV=development

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Billing System <your-email@gmail.com>

# JWT
JWT_SECRET=your_secure_random_secret
JWT_EXPIRES_IN=7d

# Company Details
COMPANY_NAME=Your Company Name
COMPANY_ADDRESS=123 Business Street, City, State 12345
COMPANY_EMAIL=billing@yourcompany.com
COMPANY_PHONE=+1-234-567-8900
COMPANY_TAX_ID=12-3456789

# Scheduler (Cron format)
BILLING_CRON_SCHEDULE=0 9 * * *
REMINDER_CRON_SCHEDULE=0 10 * * *

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 3. Database Setup
```bash
# Connect to your Neon PostgreSQL database
psql "postgresql://your-connection-string"

# Run the schema
\i database/schema.sql
```

### 4. Frontend Setup
```bash
cd ../frontend
npm install
```

Create `.env` file (optional):
```env
VITE_API_URL=http://localhost:5000/api
```

## 🚀 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Access the application:
- **Frontend Dashboard**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health

### Default Login Credentials
- **Username**: `admin`
- **Password**: `admin123`

(Create admin user via `/api/auth/register` endpoint first)

## 📚 API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register admin user
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verify token

#### Invoices
- `GET /api/invoices` - List all invoices
- `POST /api/invoices/:id/validate` - AI validate invoice
- `POST /api/invoices/:id/send` - Send invoice email
- `GET /api/invoices/:id/pdf` - Download PDF

#### AI Insights
- `GET /api/insights/validation` - AI validation reports
- `GET /api/insights/trends` - Billing trends
- `POST /api/insights/query` - Client AI assistant
- `GET /api/insights/suggestions` - AI suggestions

## 🎯 Workflow

1. **Scheduler Triggers** (Daily at 9 AM)
2. **Find Due Contracts** from database
3. **Generate Invoice PDF** with PDFKit
4. **AI Validation** via Gemini API
5. **Upload to Cloudinary** for storage
6. **Send Email** if validated
7. **Log All Actions** for audit trail
8. **Dashboard Updates** in real-time

## 🤖 AI Features

### Invoice Validation
- Verifies amounts against contract terms
- Checks tax calculations (rate × subtotal)
- Validates discount applications
- Detects duplicate invoices
- Flags anomalies with confidence scores

### Client AI Assistant
- Answers invoice questions automatically
- Explains line items and amounts
- Handles payment inquiries
- Escalates complex issues to humans
- Learns from interactions

## 🎨 Dashboard Features

### Animated Components (GSAP)
- **Metric Cards**: Count-up animations, scale-in effects
- **Invoice Table**: Stagger fade-in for rows
- **Charts**: Smooth transitions and data updates
- **Page Transitions**: Fade and scale animations
- **Notifications**: Slide-in/out effects

### Charts (Recharts)
- **Revenue Trends**: Line chart with monthly data
- **Payment Status**: Pie chart breakdown
- **Invoice Volume**: Bar chart visualization

## 🔒 Security

- ✅ JWT token authentication
- ✅ Environment variables for secrets
- ✅ Signed URLs for PDF downloads
- ✅ Password hashing with bcrypt
- ✅ CORS configuration
- ✅ SQL injection protection

## 📊 Monitoring & Logging

### Winston Logger
- **Error Logs**: `logs/error.log`
- **Combined Logs**: `logs/combined.log`
- **Audit Logs**: `logs/audit.log`
- **AI Decisions**: `logs/ai-decisions.log`

### Audit Trail
- Every invoice generation logged
- AI validation decisions recorded
- Email delivery status tracked
- Payment receipts documented
- Admin actions monitored

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy

**Backend (Render)**
1. Connect GitHub repository
2. Add environment variables
3. Deploy from `main` branch

**Frontend (Netlify/Vercel)**
1. Connect GitHub repository
2. Build command: `npm run build`
3. Publish directory: `dist`

## 📝 Environment Variables

See `.env.example` files in both `backend/` and `frontend/` directories for complete lists.

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test:api
npm run test:invoice
npm run test:ai-validation
npm run test:email
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **Gemini API** - AI validation and client assistance
- **Cloudinary** - PDF storage and delivery
- **Neon** - Serverless PostgreSQL
- **GSAP** - Animation library
- **Recharts** - Chart visualization

## 📧 Support

For issues and questions:
- Create an issue on GitHub
- Email: support@billeragi.com

---

**Built with ❤️ using Node.js, React, PostgreSQL, and AI**
