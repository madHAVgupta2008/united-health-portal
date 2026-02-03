# 🏥 United Health Financial Portal

<div align="center">

![United Health Portal](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=for-the-badge&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.4.19-646CFF?style=for-the-badge&logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-2.93.3-3ECF8E?style=for-the-badge&logo=supabase)

**A modern, secure healthcare financial management platform**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📋 Overview

United Health Financial Portal is a comprehensive web application designed to streamline healthcare financial management. The platform enables users to manage insurance documents, track hospital bills, and get AI-powered assistance for healthcare-related queries.

### ✨ Key Highlights

- 🔐 **Secure Authentication** - Powered by Supabase with email verification
- 📄 **Document Management** - Upload and manage insurance documents
- 💰 **Bill Tracking** - Monitor and pay hospital bills
- 🤖 **AI Assistant** - Get instant help with healthcare queries using Google Gemini AI
- 📊 **Analytics Dashboard** - Track your healthcare expenses and insurance status
- 🎨 **Modern UI** - Beautiful, responsive design with dark mode support

---

## 🚀 Features

### User Management
- ✅ User registration and authentication
- ✅ Profile management with personal information
- ✅ Secure session handling
- ✅ Password reset functionality

### Insurance Management
- 📤 Upload insurance documents (PDF, images)
- 📋 View insurance history
- 🔍 Track document status (pending, approved, rejected)
- 💾 Secure cloud storage

### Bill Management
- 🧾 Upload and track hospital bills
- 💳 View payment status
- 📈 Monitor bill history
- 📊 Expense analytics

### AI-Powered Chat
- 💬 Real-time chat with AI assistant
- 🧠 Powered by Google Gemini AI
- 📚 Context-aware responses
- 🔒 Secure conversation history

### Dashboard
- 📊 Overview of insurance and bills
- 📈 Financial analytics
- 🎯 Quick access to key features
- 📱 Responsive design for all devices

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.19
- **Language**: TypeScript 5.8.3
- **Styling**: Tailwind CSS 3.4.17
- **UI Components**: shadcn/ui (Radix UI)
- **Routing**: React Router DOM 6.30.1
- **State Management**: TanStack Query 5.83.0
- **Form Handling**: React Hook Form 7.61.1
- **Validation**: Zod 3.25.76

### Backend & Services
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage
- **AI**: Google Gemini AI
- **Real-time**: Supabase Realtime

### Development Tools
- **Linting**: ESLint 9.32.0
- **Testing**: Vitest 3.2.4
- **Package Manager**: npm

---

## 📦 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/united-health-portal.git
   cd united-health-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the `frontend` directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Set up Supabase**
   
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the migrations from `backend/supabase/migrations/`
   - Configure authentication settings
   - Set up storage buckets for documents

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to `http://localhost:5173`

---

## 📁 Project Structure

```
united-health-portal/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── layout/      # Layout components (Sidebar, Dashboard)
│   │   │   └── ui/          # shadcn/ui components
│   │   ├── contexts/        # React contexts (Auth, Database)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── integrations/    # External service integrations
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── lib/             # Utility functions
│   │   └── App.tsx          # Main application component
│   ├── public/              # Static assets
│   └── package.json         # Frontend dependencies
├── backend/                 # Backend configuration
│   └── supabase/            # Supabase configuration
│       ├── migrations/      # Database migrations
│       └── config.toml      # Supabase config
├── package.json             # Root package.json
└── README.md                # This file
```

---

## 🔧 Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Code Quality
```bash
npm run lint         # Run ESLint
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
```

---

## 🔐 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGc...` |
| `VITE_GEMINI_API_KEY` | Google Gemini API key | `AIzaSy...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_APP_NAME` | Application name | `United Health Portal` |
| `VITE_APP_ENV` | Environment | `development` |

---

## 🗄️ Database Schema

### Tables

- **profiles** - User profile information
- **hospital_bills** - Hospital bill records
- **insurance_documents** - Insurance document metadata
- **chat_messages** - AI chat conversation history

For detailed schema, see `backend/supabase/migrations/001_initial_schema.sql`

---

## 🎨 UI Components

This project uses [shadcn/ui](https://ui.shadcn.com/) components built on top of Radix UI. All components are:
- ✅ Fully accessible (ARIA compliant)
- ✅ Customizable with Tailwind CSS
- ✅ Type-safe with TypeScript
- ✅ Dark mode compatible

---

## 🔒 Security

- **Authentication**: Secure JWT-based authentication via Supabase
- **Authorization**: Row-level security (RLS) policies
- **Data Encryption**: All data encrypted at rest and in transit
- **File Upload**: Validated file types and size limits
- **API Keys**: Environment variables for sensitive data

---

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**
   ```bash
   vercel deploy
   ```

3. **Set environment variables** in your hosting platform

### Backend (Supabase)

The backend is fully managed by Supabase. No additional deployment needed.

---

## 📚 Documentation

- [Supabase Setup Guide](backend/SUPABASE_SETUP.md)
- [Backend Setup](backend/BACKEND_SETUP.md)
- [Deployment Guide](DEPLOYMENT.md)
- [API Documentation](docs/API.md) *(coming soon)*

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

---

## 🐛 Bug Reports

Found a bug? Please open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Your Name** - *Initial work* - [YourGitHub](https://github.com/yourusername)

---

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Google Gemini](https://ai.google.dev/) for AI capabilities
- [Lucide](https://lucide.dev/) for the icon library
- [Tailwind CSS](https://tailwindcss.com/) for the styling framework

---

## 📞 Support

For support, email support@unitedhealthportal.com or join our Slack channel.

---

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Integration with insurance providers
- [ ] Automated bill payment
- [ ] Prescription management
- [ ] Appointment scheduling

---

<div align="center">

**Made with ❤️ by the United Health Team**

⭐ Star us on GitHub — it motivates us a lot!

</div>
