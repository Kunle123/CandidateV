# Test Environment Cleanup Guide

This document provides instructions for cleaning up test configurations and moving to production.

## Test Components to Remove/Update

### 1. Test Database
- Database Name: `candidatev_auth_test`
```sql
-- SQL commands to clean up test database
DROP DATABASE IF EXISTS candidatev_auth_test;
```

### 2. Environment Configuration
Update the following in `.env`:
- Generate new `SECRET_KEY`
- Change `POSTGRES_DB` to production database name
- Update `POSTGRES_USER` and `POSTGRES_PASSWORD`
- Set `ENVIRONMENT=production`
- Update `BACKEND_CORS_ORIGINS` to production URLs
- Update `RATE_LIMIT_PER_MINUTE` according to production needs

### 3. Test Files
The following test files can be removed after successful production deployment:
- `/tests/test_db.py` - Database integration tests
- Any pytest fixtures in `/tests/conftest.py`

### 4. Test Data Cleanup
If any tests failed without proper cleanup, run these SQL commands:
```sql
DELETE FROM users WHERE email LIKE '%test@example.com%';
DELETE FROM roles WHERE name LIKE '%test_role%';
```

### 5. Development-only Endpoints
The following endpoints in `main.py` should be removed or secured:
- Root endpoint (`/`) - Currently returns service information
- Any endpoints marked with `@app.get("/debug/...")` or similar debug routes

## Verification Steps
1. Confirm all test databases are dropped
2. Verify no test users/roles remain in production database
3. Check all environment variables are production-ready
4. Remove test and debugging endpoints
5. Update API documentation to remove test endpoints
6. Verify CORS settings are production-appropriate

## Security Checklist
- [ ] Test database dropped or secured
- [ ] Test credentials removed
- [ ] Debug endpoints removed
- [ ] New production SECRET_KEY generated
- [ ] CORS origins restricted to production domains
- [ ] Rate limiting configured for production 