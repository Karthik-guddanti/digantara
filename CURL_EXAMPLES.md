# API Request Examples

## 🚨 Common Errors

### Error: "socket hang up"
This happens when you use the **wrong HTTP method**.

- ❌ **GET requests should NOT have a body**
- ✅ Use **POST** to create jobs
- ✅ Use **GET** (without body) to retrieve jobs

---

## ✅ Correct Way to Create a Job

### Using cURL (Linux/Mac/Git Bash)

```bash
curl -X POST http://localhost:8000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My New Job 2",
    "description": "This is a test job 2",
    "cronSchedule": "*/2 * * * *",
    "type": "email",
    "data": {
      "to": "test2@example.com",
      "subject": "Test Email"
    }
  }'
```

### Using cURL (Windows PowerShell)

```powershell
curl -X POST http://localhost:8000/api/jobs `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"My New Job 2\",\"description\":\"This is a test job 2\",\"cronSchedule\":\"*/2 * * * *\",\"type\":\"email\",\"data\":{\"to\":\"test2@example.com\",\"subject\":\"Test Email\"}}'
```

### Using PowerShell Invoke-RestMethod

```powershell
$body = @{
    name = "My New Job 2"
    description = "This is a test job 2"
    cronSchedule = "*/2 * * * *"
    type = "email"
    data = @{
        to = "test2@example.com"
        subject = "Test Email"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:8000/api/jobs -Method Post -Body $body -ContentType "application/json"
```

### Using Postman

1. **Method:** `POST`
2. **URL:** `http://localhost:8000/api/jobs`
3. **Headers:**
   - `Content-Type: application/json`
4. **Body (raw JSON):**
```json
{
  "name": "My New Job 2",
  "description": "This is a test job 2",
  "cronSchedule": "*/2 * * * *",
  "type": "email",
  "data": {
    "to": "test2@example.com",
    "subject": "Test Email"
  }
}
```

---

## 📋 Other API Calls

### Get All Jobs
```bash
curl http://localhost:8000/api/jobs
```

### Get Specific Job
```bash
curl http://localhost:8000/api/jobs/{jobId}
```

### Update a Job
```bash
curl -X PUT http://localhost:8000/api/jobs/{jobId} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "paused",
    "cronSchedule": "*/5 * * * *"
  }'
```

### Delete a Job
```bash
curl -X DELETE http://localhost:8000/api/jobs/{jobId}
```

### Check Scheduler Status
```bash
curl http://localhost:8000/api/jobs/scheduler/status
```

### Health Check
```bash
curl http://localhost:8000/health
```

---

## 🎯 Your Specific Request (Fixed)

**Your request was:**
- Method: GET ❌
- Body: Present ❌
- Header: x-api-key ❌ (not needed)

**Corrected request:**
- Method: **POST** ✅
- Body: Present ✅
- Headers: Only `Content-Type` ✅

### Correct cURL Command

```bash
curl -X POST http://localhost:8000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My New Job 2",
    "description": "This is a test job 2",
    "cronSchedule": "*/2 * * * *",
    "type": "email",
    "data": {
      "to": "test2@example.com",
      "subject": "Test Email"
    }
  }'
```

---

## 🐛 Troubleshooting

### 1. Server Not Running
```bash
# Check if server is running
curl http://localhost:8000/health

# Start server if not running
cd task-scheduler-microservice
npm start
```

### 2. Connection Refused
- Make sure MongoDB is running
- Make sure the server is listening on port 8000

### 3. Invalid Cron Schedule
Valid examples:
- `*/2 * * * *` - Every 2 minutes
- `0 9 * * *` - Every day at 9 AM
- `*/5 * * * *` - Every 5 minutes
- `0 0 1 * *` - First day of month

### 4. Missing Required Fields
Required fields:
- `name` (string)
- `cronSchedule` (string, valid cron format)
- `type` (email, data-processing, report, notification)

---

## 🎉 Expected Response

When you successfully create a job:

```json
{
  "success": true,
  "message": "Job created and scheduled successfully",
  "data": {
    "_id": "65f8a1b2c3d4e5f6g7h8i9j0",
    "name": "My New Job 2",
    "description": "This is a test job 2",
    "cronSchedule": "*/2 * * * *",
    "type": "email",
    "data": {
      "to": "test2@example.com",
      "subject": "Test Email"
    },
    "status": "active",
    "lastRun": null,
    "nextRun": "2024-10-27T12:02:00.000Z",
    "createdAt": "2024-10-27T12:00:00.000Z",
    "updatedAt": "2024-10-27T12:00:00.000Z"
  }
}
```

---

## 📝 Notes

- No authentication required (this is an intern-level project)
- Server runs on port 8000 by default
- Jobs run continuously after creation (based on cron schedule)
- Redis is optional (app works without it)

