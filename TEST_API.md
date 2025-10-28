# API Testing Guide

## Quick Test Commands

### 1. Start the Server
```bash
cd task-scheduler-microservice
npm start
```

### 2. Create a Job (Runs Every 2 Minutes)
```bash
curl -X POST http://localhost:8000/api/jobs ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test Email Job\",\"description\":\"Test job every 2 minutes\",\"cronSchedule\":\"*/2 * * * *\",\"type\":\"email\",\"data\":{\"to\":\"test@example.com\",\"subject\":\"Test Email\"}}"
```

**Expected Output in Console:**
```
════════════════════════════════════════════════════════════
🚀 EXECUTING JOB: "Test Email Job"
════════════════════════════════════════════════════════════
📋 Job ID: 65xxx...
📍 Job Type: email
⏰ Schedule: */2 * * * *
📅 Previous Last Run: Never
🕐 Current Run: 12/20/2024, 10:30:00 AM
⏭️  Next Run: 12/20/2024, 10:32:00 AM
════════════════════════════════════════════════════════════
```

### 3. Get All Jobs
```bash
curl http://localhost:8000/api/jobs
```

### 4. Check Scheduler Status
```bash
curl http://localhost:8000/api/jobs/scheduler/status
```

## What You'll See

When a job runs (every 2 minutes in the example above):

1. **Execution Output** - Shows current run, next run, and job details
2. **Job runs automatically** - The cron scheduler handles the timing
3. **Last Run is Updated** - Each execution updates the last run time
4. **Next Run is Calculated** - Shows when the job will run next
5. **Duration Logged** - Shows how long the job took to execute

## Key Features

✅ Jobs automatically reschedule after each execution  
✅ Clear logging shows last run, current run, and next run times  
✅ Job remains active after execution (continues running)  
✅ Distributed locking prevents duplicate executions (if Redis is available)  
✅ Beautiful console output with clear formatting  

