# Audit Service API Documentation

## Overview

The Audit Service provides comprehensive logging and monitoring capabilities for tracking user actions, security events, and system activities. This documentation outlines the available API endpoints and their usage.

## Base URL

```
/api/v1/audit
```

## Authentication

All audit endpoints require authentication. Most endpoints require admin privileges.

Authentication is provided via Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Endpoints

### Get Audit Logs

```http
GET /api/v1/audit/logs
```

Retrieve audit logs with optional filtering.

#### Query Parameters

| Parameter    | Type     | Description                                    |
|-------------|----------|------------------------------------------------|
| action      | string   | Filter by action type                          |
| user_id     | string   | Filter by user ID                              |
| start_date  | string   | Filter logs after this date (ISO format)       |
| end_date    | string   | Filter logs before this date (ISO format)      |
| limit       | integer  | Maximum number of logs to return (default: 100) |
| offset      | integer  | Number of logs to skip (default: 0)            |

#### Response

```json
[
  {
    "id": "uuid",
    "action": "USER_CREATED",
    "details": "string",
    "user_id": "uuid",
    "ip_address": "string",
    "user_agent": "string",
    "created_at": "datetime"
  }
]
```

### Get Audit Summary

```http
GET /api/v1/audit/summary
```

Get summary statistics of audit logs.

#### Response

```json
{
  "total_events": 1000,
  "action_counts": {
    "USER_CREATED": 50,
    "AUTH_LOGIN": 200,
    "AUTH_LOGOUT": 180
  },
  "most_active_users": [
    {
      "user_id": "uuid",
      "event_count": 100
    }
  ],
  "failed_auth_attempts": 20
}
```

### Get Security Events

```http
GET /api/v1/audit/security
```

Get recent security-related events.

#### Query Parameters

| Parameter    | Type     | Description                                    |
|-------------|----------|------------------------------------------------|
| time_window | integer  | Minutes to look back (default: 60)             |
| severity    | string   | Filter by severity (HIGH, MEDIUM, LOW)         |

#### Response

```json
[
  {
    "id": "uuid",
    "action": "SECURITY_SUSPICIOUS_IP",
    "details": "string",
    "severity": "HIGH",
    "created_at": "datetime"
  }
]
```

### Get User Activity

```http
GET /api/v1/audit/users/{user_id}/activity
```

Get activity metrics for a specific user.

#### Response

```json
{
  "user_id": "uuid",
  "total_sessions": 50,
  "failed_login_attempts": 2,
  "average_session_duration": 3600,
  "last_login": "datetime",
  "last_logout": "datetime"
}
```

### Cleanup Old Logs

```http
POST /api/v1/audit/cleanup
```

Remove audit logs older than the specified retention period.

#### Request Body

```json
{
  "retention_days": 90
}
```

#### Response

```json
{
  "deleted_count": 1000,
  "status": "success"
}
```

### Get System Health

```http
GET /api/v1/audit/health
```

Get system health metrics based on audit logs.

#### Response

```json
{
  "total_logs": 10000,
  "logs_last_hour": 100,
  "logs_last_day": 2400,
  "action_distribution": {
    "AUTH_LOGIN": 500,
    "USER_CREATED": 50
  },
  "timestamp": "datetime"
}
```

## Error Responses

### 401 Unauthorized

```json
{
  "detail": "Not authenticated"
}
```

### 403 Forbidden

```json
{
  "detail": "Not enough privileges"
}
```

### 422 Validation Error

```json
{
  "detail": [
    {
      "loc": ["body", "retention_days"],
      "msg": "value is not a valid integer",
      "type": "type_error.integer"
    }
  ]
}
```

## Rate Limiting

- All endpoints are rate-limited to 100 requests per minute per IP address
- The `/audit/cleanup` endpoint is limited to 1 request per hour

## Best Practices

1. Use appropriate filtering to reduce response payload size
2. Implement pagination for large result sets
3. Monitor rate limits and implement appropriate backoff strategies
4. Cache frequently accessed summary data
5. Use appropriate error handling for all API calls

## Security Considerations

1. Always use HTTPS for API requests
2. Keep access tokens secure and rotate regularly
3. Implement proper access control in your application
4. Monitor for suspicious activity patterns
5. Regularly review audit logs for security issues

## Changelog

### v1.0.0 (2024-03-20)
- Initial release of the Audit Service API
- Basic CRUD operations for audit logs
- Security event monitoring
- User activity tracking
- System health metrics 