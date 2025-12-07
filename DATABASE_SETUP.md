# Database Setup Instructions

## Quick Setup

### 1. Connect to Neon PostgreSQL

```bash
psql "postgresql://neondb_owner:npg_Ie7qPXmDKy5L@ep-red-bonus-ah9u6xks-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

### 2. Run the Schema

Once connected, run:

```sql
\i C:/BillerAGI/backend/database/schema.sql
```

Or copy and paste the contents of `backend/database/schema.sql` into the psql terminal.

### 3. Verify Tables Created

```sql
\dt
```

You should see:
- admin_users
- audit_logs
- ai_validation_logs
- client_queries
- contracts
- customers
- email_logs
- invoices
- payments

### 4. Verify Sample Data

```sql
SELECT * FROM customers;
SELECT * FROM contracts;
```

You should see 3 sample customers and 3 sample contracts.

### 5. Create Admin User (After Backend is Running)

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@billeragi.com",
    "password": "Admin@123",
    "full_name": "System Administrator"
  }'
```

## Troubleshooting

### Connection Issues

If you can't connect to Neon:
1. Check your connection string is correct
2. Ensure SSL mode is enabled
3. Verify your Neon database is active

### Schema Errors

If schema creation fails:
1. Drop all tables first: `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`
2. Re-run the schema file
3. Check for syntax errors in the SQL

### Permission Issues

If you get permission errors:
1. Ensure you're using the owner credentials
2. Check your Neon project settings
3. Verify database user has CREATE privileges

## Next Steps

After database setup:
1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm run dev`
3. Access dashboard: http://localhost:5173
4. Login with created admin credentials
