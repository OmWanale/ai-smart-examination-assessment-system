# API Reference

Base URL: `http://localhost:5000/api`

---

## Authentication APIs

### 1. Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "student"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "student@example.com",
      "name": "John Doe",
      "role": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 2. Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "student@example.com",
      "name": "John Doe",
      "role": "student",
      "avatar": null
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 3. Get Current User
**GET** `/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "student@example.com",
      "name": "John Doe",
      "role": "student",
      "avatar": null,
      "classes": [],
      "isEmailVerified": false,
      "createdAt": "2026-01-31T10:00:00.000Z"
    }
  }
}
```

---

### 4. Google OAuth
**GET** `/auth/google`

Redirects to Google OAuth consent screen.

---

### 5. Google OAuth Callback
**GET** `/auth/google/callback`

Handled by Google OAuth. Redirects to frontend with token:
```
http://localhost:3000/auth/callback?token=<jwt_token>
```

---

## Testing with cURL

### Register:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@example.com","password":"teacher123","name":"Jane Teacher","role":"teacher"}'
```

### Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@example.com","password":"teacher123"}'
```

### Get Me:
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <your_token_here>"
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Please provide email, password, and name"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Requires teacher role."
}
```

---

## Class Management APIs

### 6. Create Class (Teacher Only)
**POST** `/classes`

**Headers:**
```
Authorization: Bearer <teacher_token>
```

**Request Body:**
```json
{
  "name": "Mathematics 101",
  "description": "Introduction to Algebra and Calculus"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Class created successfully",
  "data": {
    "class": {
      "id": "507f1f77bcf86cd799439012",
      "name": "Mathematics 101",
      "description": "Introduction to Algebra and Calculus",
      "joinCode": "A3B7K9",
      "teacher": {
        "id": "507f1f77bcf86cd799439011",
        "name": "Jane Teacher",
        "email": "teacher@example.com"
      },
      "studentCount": 0,
      "createdAt": "2026-01-31T10:00:00.000Z"
    }
  }
}
```

---

### 7. Join Class by Code (Student Only)
**POST** `/classes/join`

**Headers:**
```
Authorization: Bearer <student_token>
```

**Request Body:**
```json
{
  "joinCode": "A3B7K9"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully joined class",
  "data": {
    "class": {
      "id": "507f1f77bcf86cd799439012",
      "name": "Mathematics 101",
      "description": "Introduction to Algebra and Calculus",
      "teacher": {
        "id": "507f1f77bcf86cd799439011",
        "name": "Jane Teacher",
        "email": "teacher@example.com"
      },
      "studentCount": 1,
      "createdAt": "2026-01-31T10:00:00.000Z"
    }
  }
}
```

---

### 8. Get My Classes
**GET** `/classes`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200) - Teacher:**
```json
{
  "success": true,
  "count": 2,
  "data": {
    "classes": [
      {
        "id": "507f1f77bcf86cd799439012",
        "name": "Mathematics 101",
        "description": "Introduction to Algebra",
        "joinCode": "A3B7K9",
        "teacher": {
          "id": "507f1f77bcf86cd799439011",
          "name": "Jane Teacher",
          "email": "teacher@example.com"
        },
        "studentCount": 5,
        "students": [
          {
            "id": "507f1f77bcf86cd799439013",
            "name": "John Student",
            "email": "student@example.com"
          }
        ],
        "createdAt": "2026-01-31T10:00:00.000Z"
      }
    ]
  }
}
```

**Response (200) - Student:**
```json
{
  "success": true,
  "count": 3,
  "data": {
    "classes": [
      {
        "id": "507f1f77bcf86cd799439012",
        "name": "Mathematics 101",
        "description": "Introduction to Algebra",
        "teacher": {
          "id": "507f1f77bcf86cd799439011",
          "name": "Jane Teacher",
          "email": "teacher@example.com"
        },
        "studentCount": 5,
        "createdAt": "2026-01-31T10:00:00.000Z"
      }
    ]
  }
}
```

---

### 9. Get Class Details
**GET** `/classes/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "class": {
      "id": "507f1f77bcf86cd799439012",
      "name": "Mathematics 101",
      "description": "Introduction to Algebra",
      "joinCode": "A3B7K9",
      "teacher": {
        "id": "507f1f77bcf86cd799439011",
        "name": "Jane Teacher",
        "email": "teacher@example.com",
        "avatar": null
      },
      "students": [
        {
          "id": "507f1f77bcf86cd799439013",
          "name": "John Student",
          "email": "student@example.com"
        }
      ],
      "studentCount": 1,
      "quizCount": 0,
      "createdAt": "2026-01-31T10:00:00.000Z",
      "isTeacher": true,
      "isStudent": false
    }
  }
}
```

---

## Testing with cURL

### Authentication

#### Register:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@example.com","password":"teacher123","name":"Jane Teacher","role":"teacher"}'
```

#### Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@example.com","password":"teacher123"}'
```

#### Get Me:
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <your_token_here>"
```

### Classes

#### Create Class (Teacher):
```bash
curl -X POST http://localhost:5000/api/classes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <teacher_token>" \
  -d '{"name":"Mathematics 101","description":"Intro to Math"}'
```

#### Join Class (Student):
```bash
curl -X POST http://localhost:5000/api/classes/join \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <student_token>" \
  -d '{"joinCode":"A3B7K9"}'
```

#### Get My Classes:
```bash
curl -X GET http://localhost:5000/api/classes \
  -H "Authorization: Bearer <token>"
```

#### Get Class Details:
```bash
curl -X GET http://localhost:5000/api/classes/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer <token>"
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Please provide email, password, and name"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Requires teacher role."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Class not found with this join code"
}
```

---

## Quiz Management APIs

### 10. Create Quiz (Teacher Only)
**POST** `/quizzes`

**Headers:**
```
Authorization: Bearer <teacher_token>
```

**Request Body:**
```json
{
  "classId": "507f1f77bcf86cd799439012",
  "title": "Algebra Basics Quiz",
  "description": "Test your algebra knowledge",
  "difficulty": "medium",
  "durationMinutes": 30,
  "questions": [
    {
      "questionText": "What is 2 + 2?",
      "options": ["3", "4", "5", "6"],
      "correctOptionIndex": 1
    },
    {
      "questionText": "Solve: x + 5 = 10",
      "options": ["3", "5", "7", "10"],
      "correctOptionIndex": 1
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Quiz created successfully",
  "data": {
    "quiz": {
      "id": "507f1f77bcf86cd799439020",
      "title": "Algebra Basics Quiz",
      "description": "Test your algebra knowledge",
      "difficulty": "medium",
      "durationMinutes": 30,
      "questionCount": 2,
      "totalMarks": 2,
      "isActive": true,
      "createdAt": "2026-01-31T10:00:00.000Z"
    }
  }
}
```

---

### 10.1 Generate Quiz with AI (Teacher Only)
**POST** `/quizzes/ai-generate`

**Headers:**
```
Authorization: Bearer <teacher_token>
```

**Request Body:**
```json
{
  "classId": "507f1f77bcf86cd799439012",
  "title": "Algebra Basics Quiz",
  "description": "AI-generated quiz on algebra",
  "topic": "Algebra Basics",
  "difficulty": "medium",
  "numberOfQuestions": 5,
  "durationMinutes": 30
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "AI quiz generated successfully",
  "data": {
    "quiz": {
      "id": "507f1f77bcf86cd799439021",
      "title": "Algebra Basics Quiz",
      "description": "AI-generated quiz on algebra",
      "difficulty": "medium",
      "durationMinutes": 30,
      "questionCount": 5,
      "totalMarks": 5,
      "isActive": true,
      "createdAt": "2026-01-31T10:05:00.000Z"
    }
  }
}
```

---

### 11. Get Quizzes for Class
**GET** `/quizzes/class/:classId`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200) - Student:**
```json
{
  "success": true,
  "count": 2,
  "data": {
    "quizzes": [
      {
        "id": "507f1f77bcf86cd799439020",
        "title": "Algebra Basics Quiz",
        "description": "Test your algebra knowledge",
        "difficulty": "medium",
        "durationMinutes": 30,
        "questionCount": 2,
        "totalMarks": 2,
        "createdAt": "2026-01-31T10:00:00.000Z",
        "hasSubmitted": false
      }
    ]
  }
}
```

---

### 12. Get Quiz Details
**GET** `/quizzes/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200) - Student (without answers):**
```json
{
  "success": true,
  "data": {
    "quiz": {
      "id": "507f1f77bcf86cd799439020",
      "title": "Algebra Basics Quiz",
      "description": "Test your algebra knowledge",
      "difficulty": "medium",
      "durationMinutes": 30,
      "questions": [
        {
          "questionIndex": 0,
          "questionText": "What is 2 + 2?",
          "options": ["3", "4", "5", "6"]
        }
      ],
      "totalMarks": 2,
      "hasSubmitted": false,
      "createdAt": "2026-01-31T10:00:00.000Z"
    }
  }
}
```

**Response (200) - Teacher (with answers):**
```json
{
  "success": true,
  "data": {
    "quiz": {
      "id": "507f1f77bcf86cd799439020",
      "title": "Algebra Basics Quiz",
      "questions": [
        {
          "questionText": "What is 2 + 2?",
          "options": ["3", "4", "5", "6"],
          "correctOptionIndex": 1
        }
      ],
      "totalMarks": 2,
      "isActive": true
    }
  }
}
```

---

## Submission APIs

### 13. Submit Quiz (Student Only)
**POST** `/submissions`

**Headers:**
```
Authorization: Bearer <student_token>
```

**Request Body:**
```json
{
  "quizId": "507f1f77bcf86cd799439020",
  "answers": [
    {
      "questionIndex": 0,
      "selectedOptionIndex": 1
    },
    {
      "questionIndex": 1,
      "selectedOptionIndex": 1
    }
  ],
  "timeTakenMinutes": 15
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Quiz submitted successfully",
  "data": {
    "submission": {
      "id": "507f1f77bcf86cd799439030",
      "quiz": "507f1f77bcf86cd799439020",
      "score": 2,
      "totalQuestions": 2,
      "percentage": "100.00",
      "timeTakenMinutes": 15,
      "submittedAt": "2026-01-31T10:30:00.000Z"
    }
  }
}
```

---

### 14. Get Quiz Leaderboard
**GET** `/submissions/quiz/:quizId/leaderboard?limit=10`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "count": 3,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "student": {
          "id": "507f1f77bcf86cd799439013",
          "name": "John Student",
          "email": "student@example.com"
        },
        "score": 10,
        "totalQuestions": 10,
        "percentage": "100.00",
        "timeTakenMinutes": 15,
        "submittedAt": "2026-01-31T10:30:00.000Z"
      }
    ]
  }
}
```

---

### 15. Get All Submissions for Quiz (Teacher Only)
**GET** `/submissions/quiz/:quizId`

**Headers:**
```
Authorization: Bearer <teacher_token>
```

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "data": {
    "submissions": [
      {
        "id": "507f1f77bcf86cd799439030",
        "student": {
          "id": "507f1f77bcf86cd799439013",
          "name": "John Student",
          "email": "student@example.com"
        },
        "score": 10,
        "totalQuestions": 10,
        "percentage": "100.00",
        "timeTakenMinutes": 15,
        "submittedAt": "2026-01-31T10:30:00.000Z"
      }
    ]
  }
}
```

---

### 16. Get Submission Details
**GET** `/submissions/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "submission": {
      "id": "507f1f77bcf86cd799439030",
      "quiz": {
        "id": "507f1f77bcf86cd799439020",
        "title": "Algebra Basics Quiz"
      },
      "student": {
        "id": "507f1f77bcf86cd799439013",
        "name": "John Student",
        "email": "student@example.com"
      },
      "score": 2,
      "totalQuestions": 2,
      "percentage": "100.00",
      "timeTakenMinutes": 15,
      "submittedAt": "2026-01-31T10:30:00.000Z",
      "answers": [
        {
          "questionIndex": 0,
          "questionText": "What is 2 + 2?",
          "options": ["3", "4", "5", "6"],
          "selectedOptionIndex": 1,
          "correctOptionIndex": 1,
          "isCorrect": true
        }
      ]
    }
  }
}
```

---

## Testing with cURL

### Authentication

#### Register:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@example.com","password":"teacher123","name":"Jane Teacher","role":"teacher"}'
```

#### Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@example.com","password":"teacher123"}'
```

#### Get Me:
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <your_token_here>"
```

### Classes

#### Create Class (Teacher):
```bash
curl -X POST http://localhost:5000/api/classes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <teacher_token>" \
  -d '{"name":"Mathematics 101","description":"Intro to Math"}'
```

#### Join Class (Student):
```bash
curl -X POST http://localhost:5000/api/classes/join \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <student_token>" \
  -d '{"joinCode":"A3B7K9"}'
```

#### Get My Classes:
```bash
curl -X GET http://localhost:5000/api/classes \
  -H "Authorization: Bearer <token>"
```

#### Get Class Details:
```bash
curl -X GET http://localhost:5000/api/classes/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer <token>"
```

### Quizzes

#### Create Quiz (Teacher):
```bash
curl -X POST http://localhost:5000/api/quizzes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <teacher_token>" \
  -d '{
    "classId":"507f1f77bcf86cd799439012",
    "title":"Math Quiz",
    "difficulty":"medium",
    "durationMinutes":30,
    "questions":[
      {
        "questionText":"What is 2+2?",
        "options":["3","4","5","6"],
        "correctOptionIndex":1
      }
    ]
  }'
```

#### Generate Quiz with AI (Teacher):
```bash
curl -X POST http://localhost:5000/api/quizzes/ai-generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <teacher_token>" \
  -d '{
    "classId":"507f1f77bcf86cd799439012",
    "topic":"Algebra Basics",
    "difficulty":"medium",
    "numberOfQuestions":5,
    "durationMinutes":30
  }'
```

#### Get Quizzes for Class:
```bash
curl -X GET http://localhost:5000/api/quizzes/class/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer <token>"
```

#### Get Quiz Details:
```bash
curl -X GET http://localhost:5000/api/quizzes/507f1f77bcf86cd799439020 \
  -H "Authorization: Bearer <token>"
```

### Submissions

#### Submit Quiz (Student):
```bash
curl -X POST http://localhost:5000/api/submissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <student_token>" \
  -d '{
    "quizId":"507f1f77bcf86cd799439020",
    "answers":[
      {"questionIndex":0,"selectedOptionIndex":1}
    ],
    "timeTakenMinutes":15
  }'
```

#### Get Leaderboard:
```bash
curl -X GET http://localhost:5000/api/submissions/quiz/507f1f77bcf86cd799439020/leaderboard \
  -H "Authorization: Bearer <token>"
```

#### Get All Submissions (Teacher):
```bash
curl -X GET http://localhost:5000/api/submissions/quiz/507f1f77bcf86cd799439020 \
  -H "Authorization: Bearer <teacher_token>"
```

#### Get Submission Details:
```bash
curl -X GET http://localhost:5000/api/submissions/507f1f77bcf86cd799439030 \
  -H "Authorization: Bearer <token>"
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Please provide email, password, and name"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Requires teacher role."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Class not found with this join code"
}
```
```
