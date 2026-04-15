# Buckett

Buckett is an open-source, self-hosted file manager for project-based uploads. It gives teams a clean admin interface to upload, organize, preview, rename, export, and manage files inside projects and folders.

## Features

- Project-based file management
- Folder and file organization
- Drag-and-drop uploads
- Upload into existing folders
- Rename projects, folders, and files
- Copy public file URLs with one click
- Preview supported files and images
- CSV export
- Activity logging
- Multiple users
- Light mode, dark mode, and system mode
- Custom accent colors
- Docker-ready deployment

## Default login

- Username: admin
- Password: admin123

> Change these values in your environment before using Buckett in production.

## Local development

1. Install dependencies
2. Start the API server
3. Start the frontend

Use these commands:

- npm install
- npm run server
- npm run dev

Or run both together:

- npm run dev:all

The app will be available in the browser and the API runs on port 3001.

## Docker installation

Buckett includes a Docker setup for simple self-hosting.

### Start with Docker Compose

1. Copy the example environment file
2. Build and start the container
3. Open Buckett in your browser

Commands:

- cp .env.example .env
- docker-compose up -d --build

Then open:

- http://localhost:3001

### Persistent storage

Docker Compose mounts the following folders so your files and settings stay available after restarts:

- uploads
- data

## Environment variables

Available settings:

- PUBLIC_BASE_URL
- ADMIN_USERNAME
- ADMIN_PASSWORD

See [.env.example](.env.example) for the defaults.

## Public repository notes

This repository is prepared for GitHub and excludes personal uploaded files, backups, runtime data, build output, and local environment files.

## License

MIT
