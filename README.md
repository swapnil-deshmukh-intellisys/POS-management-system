# POS & Inventory Management System

A high-performance, visually stunning full-stack POS and Inventory Management System. It features modern dashboard metrics, category operations, stock and warehouse filters, a checkout billing interface, and secure credentials authentication.

## Technical Stack
- **Frontend**: React + Vite + TypeScript + Tailwind CSS v4 + Outfit/Inter fonts
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: Neon PostgreSQL / Local Dockerized PostgreSQL Fallback
- **Orchestration**: Docker Compose

## Quick Start (with Docker)

### Prerequisites
- Docker & Docker Compose installed on your system.

### Running the Project
To spin up all services (Database, Backend, and Frontend) simultaneously, navigate to the root directory and run:

```bash
docker compose up --build
```

- **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- **Backend REST API**: [http://localhost:5000/api](http://localhost:5000/api)
- **PostgreSQL Database**: Port `5432`

---

## Local Setup (Without Docker - Developer Mode)

### 1. Database & Environment Configuration
Create a `.env` file inside the `backend` folder:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:pos_secure_password@localhost:5432/pos_db?schema=public" # Or your Neon Database Connection String
JWT_SECRET="pos_super_secret_jwt_key_2026"
```

### 2. Run the Backend API
```bash
cd backend
npm install
npx prisma db push
npm run seed
npm run dev
```

### 3. Run the Frontend App
```bash
cd ../frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.
