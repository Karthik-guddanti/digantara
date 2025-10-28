# Task Scheduler Microservice

A simple, clean task scheduler microservice built with Node.js, Express, MongoDB, and Redis. This is an intern-level project that demonstrates:
- SOLID principles
- Cron job scheduling
- Redis caching and distributed locking
- Clean code architecture

## 🎯 What This Does

This microservice allows you to:
1. **Schedule Jobs**: Create jobs with a cron schedule (e.g., "Run this email every day at 9 AM")
2. **Execute Jobs**: Automatically execute jobs based on their schedule
3. **Manage Jobs**: Create, read, update, and delete jobs via RESTful API
4. **Prevent Duplicates**: Uses Redis distributed locking to ensure jobs run only once even with multiple instances

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (running locally or via Docker)
- Redis (removed for simplicity; app runs without Redis)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp env.example .env

# 3. Start the server
npm start
```

That's it! The server will start on `http://localhost:8000`

## 📝 Features

- **Job Scheduling**: Cron-based job scheduling with node-cron
- **Distributed Locking**: Redis-based locking for multi-instance deployments
- **Caching**: Redis caching for better performance
- **SOLID Principles**: Clean, maintainable code structure
- **Docker Support**: Easy deployment with Docker Compose
- **Error Handling**: Comprehensive error handling and logging

## 🏗️ Architecture

### SOLID Principles Implementation

- **Single Responsibility**: Each class has one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Derived classes are substitutable for base classes
- **Interface Segregation**: Clients depend only on interfaces they use
- **Dependency Inversion**: High-level modules don't depend on low-level modules

### Technology Stack

- **Backend**: Node.js 18, Express.js
- **Database**: MongoDB 7.0
- **Cache**: Redis 7.2
- **Scheduling**: node-cron, cron-parser
- **Containerization**: Docker, Docker Compose
- **Load Balancer**: Nginx

## 📁 Project Structure

```
server/
├── config/
│   ├── db.js              # MongoDB connection
│   └── redis.js           # Redis configuration
├── controllers/
│   └── jobController.js   # HTTP request handlers
├── middleware/
│   ├── errorHandler.js    # Error handling middleware
│   ├── logger.js          # Logging middleware
│   ├── security.js        # Security middleware
│   └── validation.js      # Input validation
├── models/
│   └── Job.js             # MongoDB job schema
├── repositories/
│   ├── IJobRepository.js  # Repository interface
│   └── JobRepository.js    # MongoDB repository implementation
├── routes/
│   └── jobRoutes.js       # API route definitions
├── services/
│   ├── IJobService.js     # Service interface
│   ├── JobService.js       # Business logic service
│   ├── RedisService.js     # Redis operations service
│   └── SchedulerService.js # Job scheduling service
├── utils/
│   └── logger.js           # Centralized logging
├── Dockerfile              # Multi-stage Docker build
├── docker-compose.yml      # Development environment
├── docker-compose.prod.yml # Production environment
├── nginx.conf              # Load balancer configuration
└── init-mongo.js           # MongoDB initialization script
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- MongoDB (if running locally)
- Redis (if running locally)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd task-scheduler
   ```

2. **Install dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Environment configuration**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

5. **Or run locally**
   ```bash
   # Start MongoDB and Redis locally
   # Then run:
   npm run dev
   ```

### Production Deployment

1. **Environment setup**
   ```bash
   cp env.prod.example .env.prod
   # Update production environment variables
   ```

2. **Deploy with Docker Compose**
   ```bash
   docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
   ```

## 📚 API Documentation

### Base URL
- Development: `http://localhost:8000`

### Endpoints

#### 1. Create a Job
Create a new scheduled job.

```bash
curl -X POST http://localhost:8000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Daily Email Report",
    "description": "Send daily email report",
    "cronSchedule": "0 9 * * *",
    "type": "email",
    "data": {
      "to": "admin@example.com",
      "subject": "Daily Report"
    }
  }'
```

#### 2. Get All Jobs
List all jobs with pagination.

```bash
curl http://localhost:8000/api/jobs
```

With filters:
```bash
curl "http://localhost:8000/api/jobs?page=1&limit=10&status=active&type=email"
```

#### 3. Get Job by ID
Get a specific job.

```bash
curl http://localhost:8000/api/jobs/{jobId}
```

#### 4. Update Job
Update an existing job.

```bash
curl -X PUT http://localhost:8000/api/jobs/{jobId} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "paused",
    "cronSchedule": "0 10 * * *"
  }'
```

#### 5. Delete Job
Delete a job.

```bash
curl -X DELETE http://localhost:8000/api/jobs/{jobId}
```

#### 6. Get Scheduler Status
Check scheduler status.

```bash
curl http://localhost:8000/api/jobs/scheduler/status
```

#### 7. Health Check
Check if the service is running.

```bash
curl http://localhost:8000/health
```

### Job Types

- `email`: Email notification job
- `data-processing`: Data processing job
- `report`: Report generation job
- `notification`: General notification job

### Cron Schedule Format

Use standard cron format with 5 fields:
```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, Sunday = 0 or 7)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

**Common Examples:**
- `0 9 * * *` - Every day at 9:00 AM
- `*/5 * * * *` - Every 5 minutes
- `0 */2 * * *` - Every 2 hours
- `0 0 * * 1` - Every Monday at midnight
- `30 14 1 * *` - Every 1st of the month at 2:30 PM

## 🔧 Configuration

### Environment Variables

Edit the `.env` file to configure the service:

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/task-scheduler` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password (optional) | - |
| `PORT` | Server port | `8000` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `JOB_LOCK_TTL` | Lock timeout in milliseconds | `30000` |
| `SCHEDULER_INTERVAL` | How often to check for new jobs (ms) | `10000` |

## 🐳 Docker Commands

### Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and start
docker-compose up --build -d
```

### Production
```bash
# Deploy production stack
docker-compose -f docker-compose.prod.yml up -d

# Scale API instances
docker-compose -f docker-compose.prod.yml up --scale api=3 -d

# Update services
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Monitoring & Health Checks

### Health Endpoints
- `/health` - Basic health check
- `/api/jobs/scheduler/status` - Detailed scheduler status

### Monitoring Tools
- **Redis Commander**: `http://localhost:8081` (development)
- **Mongo Express**: `http://localhost:8082` (development)

### Logs
All services use structured JSON logging with different levels:
- `error`: Error conditions
- `warn`: Warning conditions
- `info`: Informational messages
- `debug`: Debug-level messages

## 🔒 Security Features

- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: API rate limiting with Nginx
- **Security Headers**: XSS protection, content type validation
- **Non-root User**: Docker containers run as non-root user
- **Environment Isolation**: Separate development/production configs

## 🚀 Scaling Considerations

### Horizontal Scaling
- Multiple API instances with load balancing
- Redis-based distributed locking prevents duplicate job execution
- Stateless API design for easy scaling

### Vertical Scaling
- Resource limits configured in Docker Compose
- Memory optimization for Redis and MongoDB
- Connection pooling for database connections

### High Availability
- Health checks for all services
- Automatic restart policies
- Graceful shutdown handling
- Data persistence with Docker volumes

## 🧪 Quick Test

Here's a simple test to verify everything works:

### 1. Start the server
```bash
npm start
```

### 2. Create a test job that runs every minute
```bash
curl -X POST http://localhost:8000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Email Job",
    "description": "Test job that runs every minute",
    "cronSchedule": "*/1 * * * *",
    "type": "email",
    "data": {
      "to": "test@example.com",
      "subject": "Test Email"
    }
  }'
```

### 3. Check all jobs
```bash
curl http://localhost:8000/api/jobs
```

### 4. Check scheduler status
```bash
curl http://localhost:8000/api/jobs/scheduler/status
```

You should see the job executing every minute in the console logs!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following SOLID principles
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check Redis service is running
   - Verify connection string in environment variables

2. **MongoDB Connection Failed**
   - Ensure MongoDB is accessible
   - Check authentication credentials

3. **Jobs Not Executing**
   - Verify cron schedule format
   - Check scheduler status endpoint
   - Review application logs

4. **Docker Build Fails**
   - Ensure Docker BuildKit is enabled
   - Check Dockerfile syntax
   - Verify all dependencies are available

### Logs
```bash
# View API logs
docker-compose logs -f api

# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f mongodb redis
```

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review application logs
3. Create an issue in the repository
4. Contact the development team
#   d i g a n t a r a  
 