# Admin Scripts

This directory contains utility scripts for managing the HSRP platform.

## Populate Subject Users

To create a batch of 20 test subject users, run:

```bash
npm run populate-subjects
```

### What the Script Does

1. Connects to your MongoDB database
2. Creates 20 subject users with:
   - Realistic names (e.g., Alice Chen, Bob Wang, etc.)
   - Email addresses (e.g., alice.chen@example.com)
   - Default password: `password123`
   - Role: SUBJECT
3. Skips users that already exist (idempotent)
4. Displays a summary of created and skipped users

### ⚠️ Security Notes

- These are **test accounts only** - do not use in production
- All accounts share the same default password: `password123`
- Delete or update these accounts before deploying to production

## Create Admin User

To create an admin user, run:

```bash
npm run create-admin
```

### Default Admin Credentials

By default, the script creates an admin user with:
- **Email:** `admin@hsrp.com`
- **Password:** `admin123456`

### Custom Admin Credentials

You can customize the admin user by setting environment variables:

```bash
ADMIN_EMAIL=your-email@example.com \
ADMIN_PASSWORD=your-secure-password \
ADMIN_FIRST_NAME=Your \
ADMIN_LAST_NAME=Name \
npm run create-admin
```

Or add them to your `.env` file:

```env
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=your-secure-password
ADMIN_FIRST_NAME=Your
ADMIN_LAST_NAME=Name
```

### What the Script Does

1. Connects to your MongoDB database
2. Checks if an admin user with the specified email already exists
3. If exists and not admin, upgrades the user to admin role
4. If doesn't exist, creates a new admin user
5. Displays the login credentials

### ⚠️ Security Notes

- **Change the default password immediately** after first login
- Use a strong, unique password for production environments
- Never commit `.env` files with real credentials to version control
- Consider using environment variables in production

### Converting Existing Users to Admin

If you already have a user account and want to make it an admin:

```bash
ADMIN_EMAIL=existing-user@example.com npm run create-admin
```

The script will detect the existing user and upgrade their role to admin.

## Prerequisites

Before running any scripts, ensure:
1. **MongoDB is running** - Start MongoDB service
2. `.env` file is configured with correct `MONGODB_URI`
3. Dependencies are installed: `npm install`

## Troubleshooting

### Connection Issues

If you see connection errors, verify:
1. MongoDB is running (`sudo systemctl start mongod` on Linux or `brew services start mongodb-community` on macOS)
2. `MONGODB_URI` in `.env` is correct (default: `mongodb://localhost:27017/hsrp`)
3. Network connectivity to database

### Permission Errors

Ensure the MongoDB user has write permissions to the database.
