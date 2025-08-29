# CANNA Visit Report Application

A comprehensive, production-ready application for managing shop visits, customer relationships, and sales reporting in the cannabis/hydroponics industry.

## 🚀 Features

- **Visit Management**: Create, edit, and track shop visits with detailed reporting
- **Customer Database**: Manage customer information and contact details
- **Analytics Dashboard**: View performance metrics and sales trends
- **User Management**: Role-based access control with admin panel
- **File Uploads**: Photo and document management for visit reports
- **PDF Generation**: Export visit reports as professional PDFs
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠 Technology Stack

### Frontend
- **React 18** - Modern UI framework
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - High-quality component library
- **React Router** - Client-side routing
- **Framer Motion** - Smooth animations
- **Recharts** - Data visualization

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **PostgreSQL** - Robust relational database
- **JWT** - Secure authentication
- **Multer** - File upload handling
- **bcryptjs** - Password hashing

### DevOps & Deployment
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy and load balancing
- **PostgreSQL** - Production database

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- Docker & Docker Compose (for containerized deployment)

## 🚀 Quick Start

### Development Setup

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd canna-visit-report-app
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your database credentials and JWT secret
```

3. **Set up PostgreSQL database:**
```bash
# Create database
createdb canna_visits

# Run schema
psql -d canna_visits -f database/schema.sql
```

4. **Start development servers:**
```bash
# Start both frontend and backend
npm run dev:full

# Or start separately:
npm run server:dev  # Backend on :3001
npm run dev         # Frontend on :5173
```

### Docker Deployment

1. **Using Docker Compose (Recommended):**
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

2. **Manual Docker build:**
```bash
# Build image
docker build -t canna-app .

# Run with external PostgreSQL
docker run -d \
  --name canna-app \
  -p 3001:3001 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/canna_visits" \
  -e JWT_SECRET="your-secret-key" \
  canna-app
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | Secret key for JWT tokens | Required |
| `JWT_EXPIRES_IN` | Token expiration time | 7d |
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment mode | development |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |
| `MAX_FILE_SIZE` | Max upload file size | 10485760 (10MB) |

### Database Configuration

The application uses PostgreSQL with the following main tables:
- `users` - User authentication and profiles
- `customers` - Shop/customer information
- `shop_visits` - Visit reports and data
- `configurations` - System settings and dropdown options
- `audit_logs` - User action tracking

## 👥 User Roles

- **Admin**: Full system access, user management, configuration
- **Manager**: View all reports, manage team data
- **User/Sales Rep**: Create and manage own visit reports

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection
- CORS configuration

## 📱 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Visit Management
- `GET /api/visits` - List all visits
- `POST /api/visits` - Create new visit
- `PUT /api/visits/:id` - Update visit
- `DELETE /api/visits/:id` - Delete visit

### Customer Management
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### File Upload
- `POST /api/upload/single` - Upload single file
- `POST /api/upload/multiple` - Upload multiple files

## 🚀 Production Deployment

### Using Docker Compose (Recommended)

1. **Update production environment:**
```bash
# Edit docker-compose.yml with production values
# Change passwords, secrets, and domain names
```

2. **Deploy:**
```bash
docker-compose -f docker-compose.yml up -d
```

### Manual Deployment

1. **Set up PostgreSQL database**
2. **Configure environment variables**
3. **Build and start the application:**
```bash
npm run build
npm run server:start
```

### Environment Setup

For production deployment:
- Use strong, unique passwords
- Configure SSL certificates
- Set up database backups
- Configure monitoring and logging
- Use environment-specific secrets

## 🔍 Monitoring & Maintenance

### Health Checks
- Application: `GET /api/health`
- Database: Built into Docker Compose

### Logging
- Application logs via Morgan
- Error tracking in console
- Audit logs in database

### Backup Strategy
- Regular PostgreSQL backups
- File upload backups
- Environment configuration backups

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is open-source and available under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the API endpoints
- Check Docker logs: `docker-compose logs`
- Verify database connectivity

## 🔄 Migration from Base44

This application has been completely refactored to remove all Base44 dependencies:

- ✅ Replaced Base44 SDK with custom API client
- ✅ Implemented standalone authentication
- ✅ Created independent database schema
- ✅ Added file upload handling
- ✅ Removed all proprietary dependencies
- ✅ Added Docker deployment configuration
- ✅ Included comprehensive documentation

The application is now 100% open-source and ready for production deployment.