# DEV Role Switching Guide

## Quick Switch Between Teacher and Student

The app now supports easy role switching in DEV mode for testing both dashboards.

### How to Switch Roles

**File:** `apps/frontend/src/store/authStore.js`
**Line:** 9

Change this line:
```javascript
const DEV_ROLE = 'teacher'; // Change to 'student' to test student UI
```

**To test Student:**
```javascript
const DEV_ROLE = 'student';
```

**To test Teacher:**
```javascript
const DEV_ROLE = 'teacher';
```

### What Happens

1. Save the file
2. React hot-reloads automatically (if dev server is running)
3. App logs you out and back in with the new role
4. Redirects to appropriate dashboard:
   - `teacher` → `/teacher/dashboard`
   - `student` → `/student/dashboard`

### Mock Users Available

**Demo Teacher**
- ID: `dev-teacher-id`
- Name: Demo Teacher
- Email: demo@teacher.com
- Role: teacher

**Demo Student**
- ID: `dev-student-id`
- Name: Demo Student
- Email: demo@student.com
- Role: student

### Important Notes

- ✅ This is DEV ONLY - marked with `// DEV AUTH BYPASS – REMOVE BEFORE PROD`
- ✅ Real authentication is NOT modified
- ✅ Backend is NOT called in bypass mode
- ✅ No login screen shown
- ✅ Token is always `DEV_FAKE_JWT_TOKEN`
- ✅ Both dashboards are fully functional

### Testing Workflows

**To test Teacher features:**
```
DEV_ROLE = 'teacher' → Create class → Manage quizzes → View results
```

**To test Student features:**
```
DEV_ROLE = 'student' → Join class → Take quiz → View grades
```

### Switching Back to Real Auth

When you're done testing and need real authentication:

1. Open `apps/frontend/src/store/authStore.js`
2. Change: `const DEV_BYPASS_AUTH = false;`
3. Save file
4. App will reload and show login screen
5. Real authentication will be required
