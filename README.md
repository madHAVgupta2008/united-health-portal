# 🏥 United Health Financial Portal

<div align="center">

![United Health Portal](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase)
![Gemini AI](https://img.shields.io/badge/Gemini-AI_Powered-4285F4?style=for-the-badge&logo=google)

**Curing "Bill Shock" Through Real-Time Cost Orchestration**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Screenshots](#-screenshots) • [Team](#-team)

</div>

---

## 📋 Overview

United Health Financial Portal is a comprehensive healthcare financial management platform that empowers users to manage their medical expenses with confidence. Upload insurance documents, track hospital bills, and leverage AI-powered analysis to understand your healthcare costs.

### ✨ Key Highlights

- 🔐 **Secure Authentication** - Email verification with Supabase Auth
- 📄 **Smart Document Management** - Upload & organize insurance documents
- 💰 **Bill Tracking** - Monitor hospital bills with status tracking
- 🤖 **AI-Powered Analysis** - Analyze bills & insurance documents with Gemini AI
- 📊 **Dynamic Dashboard** - Real-time overview of your healthcare finances
- � **Modern UI** - Beautiful dark theme with Plus Jakarta Sans typography

---

## 🚀 Features

### 🔐 Authentication & Profile
- Secure email/password authentication
- Email verification required
- Profile management with persistent caching
- Session handling with auto-recovery

### 📋 Insurance Management
- Upload insurance documents (PDF, images)
- **✨ AI-Powered Analysis** - Extract policy details, coverage, benefits, and exclusions
- Track document status (pending, approved, rejected)
- Download & view documents
- Delete with confirmation

### 🧾 Bill Management
- Upload and track hospital bills
- **✨ AI-Powered Analysis** - Itemized breakdown, coverage estimation, savings tips
- Payment status tracking (paid, pending, overdue)
- Expense analytics & filtering

### 🤖 AI Assistant
- Real-time chat powered by Google Gemini 2.5 Flash
- Healthcare-focused responses
- Context-aware conversation history
- Clear chat functionality

### 📊 Dashboard
- Welcome message with user's name
- Active claims counter
- Pending bills summary
- Recent activity feed
- Quick action shortcuts

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18.3 | UI Framework |
| TypeScript 5.8 | Type Safety |
| Vite 5.4 | Build Tool |
| Tailwind CSS | Styling |
| shadcn/ui | UI Components |
| React Router 6 | Navigation |
| TanStack Query | Data Fetching |
| React Hook Form + Zod | Form Handling |

### Backend & Services
| Service | Purpose |
|---------|---------|
| Supabase Auth | Authentication |
| Supabase PostgreSQL | Database |
| Supabase Storage | File Storage |
| Supabase Edge Functions | Serverless Functions |
| Google Gemini AI | AI Analysis & Chat |

---

## 📦 Getting Started

### Prerequisites
- **Node.js** v18+
- **npm** v9+
- **Supabase Account**
- **Google AI API Key**

### Installation

```bash
# Clone the repository
git clone https://github.com/madHAVgupta2008/united-health-portal.git
cd united-health-portal

# Install frontend dependencies
cd frontend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials
```

### Environment Variables

Create `frontend/.env`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Running Locally

```bash
# Start frontend
cd frontend
npm run dev

# The app will be available at http://localhost:8080
```

---

## 📁 Project Structure

```
united-health-portal/
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── bill/         # Bill-related components
│   │   │   ├── insurance/    # Insurance-related components
│   │   │   ├── layout/       # Layout components
│   │   │   └── ui/           # shadcn/ui components
│   │   ├── contexts/         # React contexts (Auth, Database)
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services (AI, Profile)
│   │   └── integrations/     # Supabase client
│   └── package.json
├── backend/
│   └── supabase/
│       ├── functions/        # Edge Functions (gemini-chat)
│       └── migrations/       # Database migrations
└── README.md
```

---

## �️ Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | User profile information |
| `hospital_bills` | Bill records with AI analysis |
| `insurance_documents` | Insurance documents with AI analysis |
| `chat_messages` | AI chat conversation history |

---

## 🔒 Security

- ✅ JWT-based authentication
- ✅ Row-level security (RLS) policies
- ✅ Email verification required
- ✅ Secure file upload validation
- ✅ API keys stored in environment variables
- ✅ Profile caching with user ID validation

---

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy dist/ folder
```

### Backend (Supabase)
```bash
cd backend
npx supabase functions deploy gemini-chat
```


## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Supabase](https://supabase.com/) - Backend infrastructure
- [Google Gemini](https://ai.google.dev/) - AI capabilities
- [Lucide](https://lucide.dev/) - Icon library
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework

---

## � License

This project is licensed under the MIT License.

---

<div align="center">

**Made with ❤️ by Team Phenox**

⭐ Star us on GitHub — it motivates us a lot!

</div>
