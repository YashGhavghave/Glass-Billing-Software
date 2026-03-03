# 02 - Development Environment Setup

## Overview
This guide will walk you through setting up your complete development environment from scratch. Follow each step carefully.

---

## 🖥️ System Requirements

### Minimum Requirements
- **OS**: Windows 10/11, macOS 10.15+, or Ubuntu 20.04+
- **RAM**: 8GB (16GB recommended)
- **Storage**: 20GB free space
- **Internet**: Stable broadband connection

---

## 📦 Step 1: Install Node.js

### For Windows

1. **Download Node.js**
   - Visit: https://nodejs.org/
   - Download LTS version (v18.x or v20.x)
   - Choose "Windows Installer (.msi)"

2. **Run Installer**
   ```
   - Double-click the downloaded .msi file
   - Click "Next" through the wizard
   - ✅ Check "Automatically install necessary tools"
   - Click "Install"
   - Wait for completion (5-10 minutes)
   ```

3. **Verify Installation**
   ```bash
   # Open Command Prompt (cmd) or PowerShell
   # Press Win + R, type "cmd", press Enter
   
   node --version
   # Should show: v18.x.x or v20.x.x
   
   npm --version
   # Should show: 9.x.x or 10.x.x
   ```

### For macOS

1. **Install Homebrew** (if not already installed)
   ```bash
   # Open Terminal (Cmd + Space, type "Terminal")
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install Node.js**
   ```bash
   brew install node@20
   ```

3. **Verify Installation**
   ```bash
   node --version
   npm --version
   ```

### For Ubuntu/Linux

```bash
# Update package list
sudo apt update

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version
npm --version
```

---

## 📝 Step 2: Install Git

### For Windows

1. **Download Git**
   - Visit: https://git-scm.com/download/win
   - Download the installer

2. **Run Installer**
   ```
   - Run the .exe file
   - Click "Next" through most screens
   - Important settings:
     ✅ Use Git from the Windows Command Prompt
     ✅ Use MinTTY as terminal emulator
     ✅ Enable Git Credential Manager
   - Click "Install"
   ```

3. **Configure Git**
   ```bash
   # Open Git Bash (installed with Git)
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   
   # Verify
   git config --list
   ```

### For macOS

```bash
# Install via Homebrew
brew install git

# Configure
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### For Ubuntu/Linux

```bash
sudo apt install git

git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## 💻 Step 3: Install Visual Studio Code

### For All Platforms

1. **Download VS Code**
   - Visit: https://code.visualstudio.com/
   - Download for your OS

2. **Install**
   - Run the installer
   - ✅ Add "Open with Code" to context menu (Windows)
   - ✅ Add to PATH

3. **Install Essential Extensions**
   ```
   Open VS Code
   Press Ctrl+Shift+X (or Cmd+Shift+X on Mac)
   Search and install:
   
   ✅ ES7+ React/Redux/React-Native snippets
   ✅ Prettier - Code formatter
   ✅ ESLint
   ✅ Tailwind CSS IntelliSense
   ✅ Auto Rename Tag
   ✅ GitLens
   ✅ Thunder Client (API testing)
   ✅ Prisma
   ✅ Docker (optional)
   ```

4. **Configure VS Code Settings**
   ```
   Press Ctrl+, (or Cmd+, on Mac) to open Settings
   Search for "format on save" and enable it
   Search for "tab size" and set to 2
   ```

---

## 🗄️ Step 4: Install PostgreSQL

### For Windows

1. **Download PostgreSQL**
   - Visit: https://www.postgresql.org/download/windows/
   - Download the installer (version 15.x)

2. **Run Installer**
   ```
   - Run the .exe file
   - Installation Directory: C:\Program Files\PostgreSQL\15
   - Select Components: ✅ All (PostgreSQL Server, pgAdmin, Command Line Tools)
   - Data Directory: C:\Program Files\PostgreSQL\15\data
   - Set Password: Choose a strong password (save it!)
   - Port: 5432 (default)
   - Locale: Default
   - Click "Next" and "Finish"
   ```

3. **Verify Installation**
   ```bash
   # Open Command Prompt
   psql --version
   # Should show: psql (PostgreSQL) 15.x
   ```

4. **Create Database**
   ```bash
   # Open pgAdmin (installed with PostgreSQL)
   # Or use command line:
   
   psql -U postgres
   # Enter password when prompted
   
   # Create database
   CREATE DATABASE windoor_db;
   
   # Create user
   CREATE USER windoor_user WITH PASSWORD 'your_secure_password';
   
   # Grant privileges
   GRANT ALL PRIVILEGES ON DATABASE windoor_db TO windoor_user;
   
   # Exit
   \q
   ```

### For macOS

```bash
# Install via Homebrew
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Create database
createdb windoor_db

# Access PostgreSQL
psql postgres

# Create user
CREATE USER windoor_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE windoor_db TO windoor_user;
\q
```

### For Ubuntu/Linux

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE windoor_db;
CREATE USER windoor_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE windoor_db TO windoor_user;
\q
```

---

## 🐋 Step 5: Install Docker (Optional but Recommended)

### For Windows

1. **Download Docker Desktop**
   - Visit: https://www.docker.com/products/docker-desktop
   - Download for Windows

2. **Install**
   ```
   - Run installer
   - ✅ Enable WSL 2 (recommended)
   - Restart computer
   - Start Docker Desktop
   - Create Docker account (free)
   ```

3. **Verify**
   ```bash
   docker --version
   docker-compose --version
   ```

### For macOS

```bash
# Download Docker Desktop from docker.com
# Or via Homebrew
brew install --cask docker

# Start Docker Desktop from Applications
# Verify
docker --version
```

### For Ubuntu/Linux

```bash
# Install Docker
sudo apt install docker.io docker-compose

# Add user to docker group
sudo usermod -aG docker $USER

# Restart session or run
newgrp docker

# Verify
docker --version
```

---

## 🛠️ Step 6: Install Additional Tools

### Install Postman or Thunder Client

**Option 1: Thunder Client (VS Code Extension)**
```
Already installed in Step 3
Lightweight, built into VS Code
```

**Option 2: Postman (Standalone)**
```
1. Visit: https://www.postman.com/downloads/
2. Download and install
3. Create free account
4. Use for API testing
```

### Install pgAdmin (Database GUI)

**For Windows**: Already installed with PostgreSQL

**For macOS/Linux**:
```bash
# macOS
brew install --cask pgadmin4

# Ubuntu
sudo apt install pgadmin4
```

---

## 📁 Step 7: Create Project Directory Structure

### Using Command Line

```bash
# Windows (Command Prompt)
cd C:\
mkdir Projects
cd Projects
mkdir windoor-app
cd windoor-app

# macOS/Linux (Terminal)
cd ~
mkdir Projects
cd Projects
mkdir windoor-app
cd windoor-app
```

### Create Complete Structure

```bash
# In windoor-app directory
mkdir client
mkdir server
mkdir docs
mkdir design-files
mkdir testing

# Your structure should look like:
# windoor-app/
# ├── client/          (React frontend)
# ├── server/          (Node.js backend)
# ├── docs/            (Documentation)
# ├── design-files/    (Design assets)
# └── testing/         (Test files)
```

---

## 🔐 Step 8: Set Up Environment Variables

### Create .env Template

1. **Navigate to server directory**
   ```bash
   cd server
   ```

2. **Create .env file**
   ```bash
   # Windows
   type nul > .env
   
   # macOS/Linux
   touch .env
   ```

3. **Edit .env file in VS Code**
   ```bash
   code .env
   ```

4. **Add the following content**:
   ```env
   # Database
   DATABASE_URL="mongodb://localhost:27017/windoor_db"
   
   # JWT Secret (generate a random string)
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   
   # Server
   PORT=5000
   NODE_ENV=development
   
   # Frontend URL
   CLIENT_URL=http://localhost:3000
   
   # Email (SendGrid) - Add later
   SENDGRID_API_KEY=
   FROM_EMAIL=
   
   # Stripe - Add later
   STRIPE_SECRET_KEY=
   STRIPE_PUBLISHABLE_KEY=
   
   # AWS S3 - Add later
   AWS_ACCESS_KEY_ID=
   AWS_SECRET_ACCESS_KEY=
   AWS_REGION=
   AWS_BUCKET_NAME=
   ```

5. **Save the file**

---

## ✅ Step 9: Verify Complete Setup

### Create Verification Script

Create `verify-setup.js` in your project root:

```javascript
// verify-setup.js
const { exec } = require('child_process');

const checks = [
  { name: 'Node.js', command: 'node --version' },
  { name: 'npm', command: 'npm --version' },
  { name: 'Git', command: 'git --version' },
  { name: 'PostgreSQL', command: 'psql --version' },
  { name: 'Docker', command: 'docker --version', optional: true }
];

console.log('🔍 Verifying Development Environment...\n');

checks.forEach(check => {
  exec(check.command, (error, stdout, stderr) => {
    if (error && !check.optional) {
      console.log(`❌ ${check.name}: NOT INSTALLED`);
    } else if (error && check.optional) {
      console.log(`⚠️  ${check.name}: NOT INSTALLED (Optional)`);
    } else {
      console.log(`✅ ${check.name}: ${stdout.trim()}`);
    }
  });
});

console.log('\n✅ Verification complete!');
```

Run it:
```bash
node verify-setup.js
```

Expected output:
```
🔍 Verifying Development Environment...

✅ Node.js: v20.x.x
✅ npm: 10.x.x
✅ Git: git version 2.x.x
✅ PostgreSQL: psql (PostgreSQL) 15.x
✅ Docker: Docker version 24.x.x

✅ Verification complete!
```

---

## 🎯 Step 10: Initialize Git Repository

```bash
# Navigate to project root
cd windoor-app

# Initialize Git
git init

# Create .gitignore
code .gitignore
```

Add to `.gitignore`:
```
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
build/
dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
logs/
*.log

# Editor
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Database
*.sqlite
*.db

# Uploads
uploads/
temp/
```

```bash
# Save and commit
git add .gitignore
git commit -m "Initial commit: Setup project structure"
```

---

## 🚀 Step 11: Test Database Connection

Create `test-db.js` in server directory:

```javascript
// server/test-db.js
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://windoor_user:your_secure_password@localhost:5432/windoor_db'
});

async function testConnection() {
  try {
    await client.connect();
    console.log('✅ Database connection successful!');
    
    const result = await client.query('SELECT NOW()');
    console.log('📅 Current database time:', result.rows[0].now);
    
    await client.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testConnection();
```

Install pg package:
```bash
cd server
npm init -y
npm install pg
```

Run test:
```bash
node test-db.js
```

Should see:
```
✅ Database connection successful!
📅 Current database time: 2026-02-09T...
```

---

## 📋 Troubleshooting Common Issues

### Node.js Not Found
```bash
# Restart terminal/command prompt
# Or add to PATH manually:

# Windows: Add to Environment Variables
# C:\Program Files\nodejs\

# macOS/Linux: Add to ~/.bashrc or ~/.zshrc
export PATH="/usr/local/bin:$PATH"
```

### PostgreSQL Connection Refused
```bash
# Windows: Check if service is running
# Services → PostgreSQL → Start

# macOS
brew services restart postgresql@15

# Linux
sudo systemctl restart postgresql
```

### Port Already in Use
```bash
# Find process using port 5432
# Windows
netstat -ano | findstr :5432

# macOS/Linux
lsof -i :5432

# Kill the process or change PostgreSQL port
```

### Permission Denied
```bash
# Linux/macOS: Use sudo
sudo chown -R $USER:$USER ~/Projects/windoor-app
```

---

## ✅ Setup Checklist

Before proceeding to the next section, verify:

- [ ] Node.js installed and working
- [ ] npm available in terminal
- [ ] Git installed and configured
- [ ] VS Code installed with extensions
- [ ] PostgreSQL installed and running
- [ ] Database `windoor_db` created
- [ ] Database user created with permissions
- [ ] Docker installed (optional)
- [ ] Project directories created
- [ ] .env file created with database URL
- [ ] .gitignore created
- [ ] Initial git commit done
- [ ] Database connection test successful

---

## 🎯 Next Steps

Your development environment is now ready! 

➡️ **Next**: [03 - Project Structure & Architecture](./docs/03_architecture.md)

---

## 📝 Notes

- Save your PostgreSQL password securely
- Never commit .env files to Git
- Take regular backups of your database
- Keep Node.js and dependencies updated

**Status**: ✅ Environment Ready
**Estimated Time**: 2-3 hours
**Last Updated**: February 2026
