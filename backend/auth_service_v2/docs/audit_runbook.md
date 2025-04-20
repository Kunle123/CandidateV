# Audit Service Operational Runbook

## Service Overview

The Audit Service is responsible for logging and monitoring all security-relevant events in the authentication service. It provides capabilities for tracking user actions, security events, and system activities.

## Key Components

1. Audit Logger
   - Handles creation and storage of audit logs
   - Manages log retention and cleanup
   - Provides filtering and search capabilities

2. Security Monitor
   - Monitors for suspicious activities
   - Tracks failed authentication attempts
   - Generates security alerts

3. Activity Tracker
   - Tracks user sessions and activities
   - Generates user activity metrics
   - Provides usage statistics

## Operational Tasks

### Daily Operations

1. Monitor System Health
   ```bash
   # Check system health metrics
   curl -H "Authorization: Bearer $ADMIN_TOKEN" https://api.example.com/api/v1/audit/health
   
   # Review recent security events
   curl -H "Authorization: Bearer $ADMIN_TOKEN" https://api.example.com/api/v1/audit/security
   ```

2. Review Alerts
   - Check for security alerts in the monitoring dashboard
   - Investigate any suspicious activity patterns
   - Review failed authentication attempts

3. Database Maintenance
   - Monitor database size and growth
   - Check index performance
   - Verify backup completion

### Weekly Operations

1. Performance Review
   - Review API response times
   - Check rate limit violations
   - Analyze query performance

2. Security Review
   - Review admin access patterns
   - Check for unusual activity patterns
   - Verify security event handling

3. Capacity Planning
   - Review storage utilization
   - Check database connection pool usage
   - Monitor API usage patterns

### Monthly Operations

1. Log Retention
   ```bash
   # Clean up old logs (adjust retention period as needed)
   curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"retention_days": 90}' \
        https://api.example.com/api/v1/audit/cleanup
   ```

2. Compliance Review
   - Verify audit log completeness
   - Check compliance with retention policies
   - Review access control policies

3. Performance Optimization
   - Review and optimize database indices
   - Analyze and tune query performance
   - Update caching strategies

## Monitoring and Alerting

### Key Metrics

1. System Health
   - Total logs per hour/day
   - API response times
   - Database query performance
   - Storage utilization

2. Security Metrics
   - Failed authentication attempts
   - Suspicious IP addresses
   - Unusual activity patterns
   - Admin action frequency

3. User Activity
   - Active user sessions
   - Login frequency
   - User action patterns
   - API usage patterns

### Alert Thresholds

1. Critical Alerts
   - More than 10 failed login attempts per minute for a single user
   - More than 100 failed login attempts per minute system-wide
   - API response time > 1000ms
   - Database connection pool utilization > 80%

2. Warning Alerts
   - More than 5 failed login attempts per minute for a single user
   - More than 50 failed login attempts per minute system-wide
   - API response time > 500ms
   - Database connection pool utilization > 60%

## Troubleshooting

### Common Issues

1. High API Latency
   ```sql
   -- Check for slow queries
   SELECT query, calls, total_time, mean_time
   FROM pg_stat_statements
   ORDER BY total_time DESC
   LIMIT 10;
   ```

2. Database Connection Issues
   ```sql
   -- Check active connections
   SELECT count(*) FROM pg_stat_activity;
   
   -- Check connection states
   SELECT state, count(*) 
   FROM pg_stat_activity 
   GROUP BY state;
   ```

3. Log Storage Issues
   ```sql
   -- Check table sizes
   SELECT pg_size_pretty(pg_total_relation_size('audit_logs'));
   
   -- Check row counts
   SELECT count(*) FROM audit_logs;
   ```

### Recovery Procedures

1. Database Recovery
   ```bash
   # Restore from backup
   pg_restore -d railway -U postgres backup.dump
   
   # Verify data integrity
   psql -d railway -U postgres -c "SELECT count(*) FROM audit_logs;"
   ```

2. Service Recovery
   ```bash
   # Restart audit service
   railway service restart audit-service
   
   # Verify service health
   curl https://api.example.com/api/v1/health
   ```

3. Data Consistency Check
   ```sql
   -- Check for orphaned records
   SELECT * FROM audit_logs 
   WHERE user_id NOT IN (SELECT id FROM users);
   
   -- Check for missing timestamps
   SELECT * FROM audit_logs 
   WHERE created_at IS NULL;
   ```

## Backup and Recovery

### Backup Procedures

1. Database Backup
   ```bash
   # Full backup
   pg_dump -Fc -d railway -U postgres > audit_backup.dump
   
   # Verify backup
   pg_restore -l audit_backup.dump
   ```

2. Configuration Backup
   ```bash
   # Backup environment variables
   railway variables export > env_backup.txt
   
   # Backup service configuration
   railway service config export > service_config.yaml
   ```

### Recovery Procedures

1. Full Service Recovery
   ```bash
   # Restore database
   pg_restore -d railway -U postgres audit_backup.dump
   
   # Restore configuration
   railway variables import env_backup.txt
   railway service config import service_config.yaml
   ```

2. Partial Recovery
   ```bash
   # Restore specific tables
   pg_restore -d railway -U postgres -t audit_logs audit_backup.dump
   
   # Verify recovery
   psql -d railway -U postgres -c "SELECT count(*) FROM audit_logs;"
   ```

## Security Procedures

### Access Control

1. Token Management
   ```bash
   # Generate admin token
   curl -X POST https://api.example.com/api/v1/auth/token \
        -d "username=admin&password=****"
   
   # Revoke token
   curl -X POST https://api.example.com/api/v1/auth/revoke \
        -H "Authorization: Bearer $TOKEN"
   ```

2. Permission Updates
   ```sql
   -- Update user roles
   UPDATE users SET is_admin = true WHERE email = 'admin@example.com';
   
   -- Review permissions
   SELECT email, is_admin FROM users WHERE is_admin = true;
   ```

### Security Monitoring

1. Active Session Review
   ```sql
   -- Check active sessions
   SELECT user_id, count(*) 
   FROM audit_logs 
   WHERE action = 'AUTH_LOGIN' 
   AND created_at > now() - interval '1 day'
   GROUP BY user_id;
   ```

2. Failed Login Analysis
   ```sql
   -- Check failed login patterns
   SELECT ip_address, count(*) 
   FROM audit_logs 
   WHERE action = 'FAILED_AUTH_LOGIN'
   AND created_at > now() - interval '1 hour'
   GROUP BY ip_address
   HAVING count(*) > 10;
   ```

## Compliance and Reporting

### Audit Reports

1. Daily Activity Report
   ```sql
   -- Generate daily summary
   SELECT action, count(*) 
   FROM audit_logs 
   WHERE created_at > now() - interval '1 day'
   GROUP BY action;
   ```

2. Security Incident Report
   ```sql
   -- List security incidents
   SELECT * FROM audit_logs 
   WHERE action LIKE 'SECURITY_%'
   AND created_at > now() - interval '1 day'
   ORDER BY created_at DESC;
   ```

### Compliance Checks

1. Retention Policy Verification
   ```sql
   -- Check oldest logs
   SELECT min(created_at) FROM audit_logs;
   
   -- Check retention compliance
   SELECT count(*) FROM audit_logs 
   WHERE created_at < now() - interval '90 days';
   ```

2. Data Completeness Check
   ```sql
   -- Check for missing data
   SELECT date_trunc('hour', created_at) as hour,
          count(*) as log_count
   FROM audit_logs
   GROUP BY hour
   ORDER BY hour DESC;
   ```

## Emergency Procedures

### Service Degradation

1. High Load Handling
   ```bash
   # Enable maintenance mode
   railway maintenance enable
   
   # Scale up resources
   railway scale up --cpu 2 --memory 4GB
   ```

2. Database Performance Issues
   ```sql
   -- Kill long-running queries
   SELECT pg_terminate_backend(pid) 
   FROM pg_stat_activity 
   WHERE state = 'active'
   AND state_change < now() - interval '5 minutes';
   ```

### Security Incidents

1. Account Lockdown
   ```sql
   -- Lock suspicious accounts
   UPDATE users SET is_active = false 
   WHERE id IN (
       SELECT user_id FROM audit_logs 
       WHERE action = 'FAILED_AUTH_LOGIN'
       GROUP BY user_id 
       HAVING count(*) > 10
   );
   ```

2. Emergency Access Control
   ```bash
   # Enable strict mode
   railway config set STRICT_SECURITY=true
   
   # Restrict API access
   railway firewall update --allow-list="trusted-ips.txt"
   ```

## Contact Information

- **Primary On-Call**: security-oncall@example.com
- **Secondary On-Call**: devops-oncall@example.com
- **Emergency Contact**: emergency@example.com

## Reference Documentation

- [API Documentation](./audit_api.md)
- [Database Schema](./schema.md)
- [Security Policy](./security_policy.md)
- [Compliance Requirements](./compliance.md) 