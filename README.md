# Git-Inspired Version Control System (MyGit)

A web-based platform and CLI application inspired by Git and GitHub. This project provides a full-stack version control system with a frontend dashboard to view repositories and issues, and a backend server that acts as the API and also includes a CLI to perform git-like operations (init, add, commit, push, pull, revert). Commits are designed to be pushed to Amazon S3.

## Features
- **Frontend Dashboard**: View user profiles, explore repositories, create repositories, and manage issues.
- **MyGit CLI**: A command-line interface mimicking basic Git commands.
- **REST API**: Backend powered by Express.js and MongoDB Atlas for managing users, repositories, and issues.
- **S3 Integration**: Code snapshots can be stored securely in Amazon S3 (requires configuration).

## Tech Stack
- **Frontend**: React, Vite, React Router, CSS
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Yargs (CLI)

## Project Structure
- `frontend-main/`: The React application.
- `backend-main/`: The Express.js backend and MyGit CLI.

## How to Use

### 1. Backend Setup
1. Navigate to the `backend-main` directory:
   ```bash
   cd backend-main
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend-main` directory and add your MongoDB URI:
   ```
   MONGODB_URI=your_mongodb_connection_string
   ```
4. Start the backend server:
   ```bash
   node index.js start
   ```

### 2. Frontend Setup
1. Navigate to the `frontend-main` directory:
   ```bash
   cd frontend-main
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

### 3. Using the MyGit CLI
From the `backend-main` directory, you can run CLI commands using the `node index.js` entry point:
- Initialize a repository: `node index.js init`
- Add files to staging: `node index.js add <file>`
- Commit changes: `node index.js commit "Your commit message"`
- Push commits to S3: `node index.js push`
- Pull commits: `node index.js pull`
- Revert to a commit: `node index.js revert <commitID>`

## License
MIT
