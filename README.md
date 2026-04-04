# React + MySQL Blog App

A lightweight blogging application built with React (Vite) and MySQL.

## Tech Stack

- **Frontend:** React 18, React Router, Vite
- **Backend:** Node.js, Express
- **Database:** MySQL

## Prerequisites

- Node.js 18+
- MySQL 8.0+

## Setup

### 1. Database

Make sure MySQL is running. The app auto-creates the `blog_app` database and `posts` table on startup.

### 2. Backend

```bash
cd server
cp .env.example .env    # Edit with your MySQL credentials
npm install
npm run dev
```

The API runs at `http://localhost:5000`.

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

## API Endpoints

| Method | Endpoint         | Description     |
|--------|-----------------|-----------------|
| GET    | /api/posts       | List all posts  |
| GET    | /api/posts/:id   | Get single post |
| POST   | /api/posts       | Create post     |
| PUT    | /api/posts/:id   | Update post     |
| DELETE | /api/posts/:id   | Delete post     |

## Features

- Create, read, update, delete blog posts
- Clean, responsive UI
- Auto-initializes database schema
- Vite dev server with API proxy
