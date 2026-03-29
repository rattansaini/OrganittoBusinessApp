# 🌿 Organitto - Ayurvedic Business Management Platform

Complete business management solution for Ayurvedic product companies. Track expenses, manage products, calculate costs, monitor batches, manage inventory, ensure compliance, and collaborate with your team.

![Version](https://img.shields.io/badge/version-1.0.0-green)
![PWA](https://img.shields.io/badge/PWA-enabled-blue)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

### 📊 Dashboard
- Real-time business overview
- Expense tracking and analytics
- Investment monitoring
- Activity feed
- Quick actions

### 💰 Financial Management
- **Expense Tracking**: Record and categorize all business expenses
- **Approval Workflow**: Multi-level expense approval system
- **Investment Tracking**: Monitor capital investments and ROI
- **Reports & Analytics**: Comprehensive financial reports
- **Budget Management**: Set and track budgets by category
- **Vendor Management**: Track vendor relationships and payments

### 🧪 Product Development
- **Product Pipeline**: Manage products from idea to market
- **Stage-based Workflow**: Idea → Research → Formulation → Testing → Production → Market
- **Formula Management**: Version control for product formulas
- **Cost Calculator**: Accurate production cost calculations
- **Ingredient Database**: Comprehensive ingredient management
- **Task Management**: Track product development tasks
- **Testing Records**: Document product testing results

### 📦 Operations
- **Batch Tracking**: Complete batch traceability
- **Inventory Management**: Real-time ingredient stock levels
- **Quality Control**: Quality checkpoints and certifications
- **Expiration Alerts**: Automated expiry notifications
- **Production Planning**: Plan and schedule production runs

### 🏢 Vendor Management
- **Vendor Profiles**: Detailed vendor information
- **Price Tracking**: Historical price data
- **Invoice Management**: Track and manage invoices
- **Performance Metrics**: Vendor reliability scores
- **Communication History**: Notes and transaction logs

### 📋 Compliance & Licensing
- **License Management**: Track business licenses and certifications
- **Renewal Reminders**: Automated renewal notifications
- **Document Storage**: Secure certificate storage
- **Audit Trail**: Complete compliance history
- **Status Monitoring**: Real-time compliance status

### 💬 Team Collaboration
- **Real-time Chat**: Instant team communication
- **Chat Rooms**: Organized by department and product
- **File Sharing**: Share documents and images
- **@Mentions**: Tag team members in discussions
- **Emoji Reactions**: Quick message responses
- **Message Editing**: Edit and delete messages
- **Offline Support**: Queue messages when offline

### 📱 Progressive Web App (PWA)
- **Install on Any Device**: Works on mobile, tablet, and desktop
- **Offline Functionality**: Access cached data without internet
- **Background Sync**: Auto-sync when connection restored
- **Push Notifications**: Real-time alerts (optional)
- **Native Experience**: Full-screen app-like interface
- **Auto-updates**: Seamless app updates

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/organitto.git
   cd organitto
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Set up database**

   The database migrations are located in `supabase/migrations/`.

   Apply migrations via Supabase Dashboard:
   - Go to SQL Editor in your Supabase project
   - Copy and paste each migration file in order
   - Execute them one by one

5. **Start development server**
   ```bash
   npm run dev
   ```

   Open http://localhost:5173

## 🏗️ Build for Production

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Production build
npm run build

# Preview production build
npm run preview
```

The optimized build will be in the `dist/` directory.

### Build Output

- **Code Splitting**: Separate chunks for vendors (React, Supabase, Charts)
- **Asset Organization**: Images, fonts, and assets in organized folders
- **Minification**: Optimized with esbuild
- **Source Maps**: Disabled for security (enable for debugging)
- **Gzip**: Build sizes shown with gzip compression

## 📦 Deployment

### Deploy to Production

1. Build the application
2. Configure environment variables in your hosting platform
3. Deploy the `dist/` folder
4. Ensure service worker is served with proper headers

See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive deployment guide.

### Recommended Platforms

- **Vercel**: Zero-config deployment
- **Netlify**: Automatic deployments from Git
- **AWS Amplify**: Full AWS integration
- **Cloudflare Pages**: Global CDN

### Database Setup

1. Create production Supabase project
2. Apply all migrations from `supabase/migrations/`
3. Verify Row Level Security policies are active
4. Configure database backups
5. Set up connection pooling for better performance

## 🔧 Technology Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library
- **Recharts** - Data visualization
- **date-fns** - Date utilities

### Backend & Database
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Real-time subscriptions
  - Row Level Security
  - Authentication
  - Storage (for file uploads)

### PWA Features
- **Service Worker** - Offline functionality
- **Cache API** - Asset and data caching
- **Background Sync** - Offline data sync
- **Web App Manifest** - Installability
- **Push Notifications** - Real-time alerts (optional)

## 📁 Project Structure

```
organitto/
├── public/              # Static assets
│   ├── manifest.json   # PWA manifest
│   ├── service-worker.js # Service worker
│   ├── offline.html    # Offline fallback
│   └── robots.txt      # SEO configuration
├── src/
│   ├── components/     # React components
│   ├── contexts/       # React contexts (Auth, etc.)
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities and libraries
│   ├── pages/          # Page components
│   ├── App.tsx         # Root component
│   └── main.tsx        # Entry point
├── supabase/
│   └── migrations/     # Database migrations
├── .env.example        # Environment variables template
├── DEPLOYMENT.md       # Deployment guide
├── package.json        # Dependencies
├── tailwind.config.js  # Tailwind configuration
├── tsconfig.json       # TypeScript configuration
└── vite.config.ts      # Vite configuration
```

## 🎨 Design System

### Colors

- **Primary** (`#2D5016`): Forest green - main brand color
- **Sage** (`#6B8E23`): Olive green - secondary actions
- **Accent** (`#E67E22`): Orange - highlights and CTAs
- **Cream** (`#F5F1E8`): Light beige - backgrounds
- **Dark Brown** (`#8B7355`): Brown - text and borders

### Typography

- **Headings**: Cormorant Garamond (serif)
- **Body**: Nunito (sans-serif)

### Components

All components follow Ayurvedic-inspired design with:
- Natural color palette
- Rounded corners (8px, 12px, 16px)
- Soft shadows
- Smooth transitions
- Accessibility-first approach

## 🔐 Security

### Row Level Security (RLS)

All database tables have RLS enabled with policies that:
- Users can only access their own data
- Admins have elevated permissions
- Sensitive operations require authentication
- Public access is explicitly defined

### Authentication

- Supabase Auth with email/password
- Secure session management
- Protected routes
- Auto-logout on token expiry

### Best Practices

- Environment variables for secrets
- HTTPS required in production
- Security headers configured
- XSS and SQL injection prevention
- No sensitive data in client code

## 📊 Performance

### Optimization Strategies

- **Code Splitting**: Vendor chunks separated
- **Lazy Loading**: Routes loaded on demand
- **Image Optimization**: WebP format recommended
- **Caching**: Service worker caching
- **Database Indexes**: Optimized queries
- **Real-time Optimization**: Targeted subscriptions

### Target Metrics

- Lighthouse Performance: 90+
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- API Response Time: <500ms

## 🧪 Testing

```bash
# Type checking
npm run typecheck

# Linting
npm run lint
```

### Manual Testing Checklist

- [ ] User authentication flows
- [ ] Expense creation and approval
- [ ] Product pipeline stages
- [ ] Batch tracking
- [ ] Chat functionality
- [ ] Offline mode
- [ ] Install prompt
- [ ] Cross-browser compatibility
- [ ] Mobile responsiveness

## 🐛 Troubleshooting

### Service Worker Not Updating

1. Unregister old service worker:
   - DevTools → Application → Service Workers → Unregister
2. Clear cache and hard reload
3. Re-register service worker

### Database Connection Issues

1. Verify Supabase URL and anon key in `.env`
2. Check RLS policies in Supabase Dashboard
3. Verify internet connection
4. Check Supabase project status

### Build Errors

1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Clear build cache: `rm -rf dist .vite`
4. Run `npm run build` again

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics ID | No |
| `VITE_SENTRY_DSN` | Sentry error tracking | No |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Design inspired by Ayurvedic principles and natural aesthetics
- Icons by [Lucide](https://lucide.dev)
- Fonts from [Google Fonts](https://fonts.google.com)
- Backend powered by [Supabase](https://supabase.com)

## 📧 Support

For support, email support@organitto.app or open an issue on GitHub.

## 🗺️ Roadmap

### Version 1.1 (Planned)
- [ ] Mobile apps (iOS & Android)
- [ ] Advanced analytics dashboard
- [ ] Bulk operations
- [ ] Export to PDF/Excel
- [ ] Email notifications
- [ ] Multi-language support

### Version 1.2 (Future)
- [ ] AI-powered insights
- [ ] Inventory forecasting
- [ ] Supplier integration APIs
- [ ] Custom report builder
- [ ] E-commerce integration

---

Made with 🌿 for Ayurvedic entrepreneurs
