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

1. Start Docker Desktop
2. Open a terminal in the project root
3. Copy the example environment file
4. Build and start the container
5. Open Buckett in your browser

Commands:

- cp .env.example .env
- docker compose up -d --remove-orphans

If your system uses the older Compose command, this also works:

- docker-compose up -d --remove-orphans

Then open:

- http://localhost:3001

### Troubleshooting

If you see an error about not being able to connect to the Docker daemon, Docker Desktop is not running yet.

If you see a Dockerfile not found error, make sure you run the command from the project root folder.

### Dockge installation

If you install Buckett through Dockge on an external server, the stack usually only contains the Compose file and not the full repository. In that case, a local Dockerfile cannot be found.

Use the dedicated Dockge stack from [docker-compose.dockge.yml](docker-compose.dockge.yml). It builds directly from the public GitHub repository.

Recommended steps:

1. Create a new stack in Dockge
2. Paste the contents of [docker-compose.dockge.yml](docker-compose.dockge.yml)
3. Set your own values for PUBLIC_BASE_URL, ADMIN_USERNAME, and ADMIN_PASSWORD
4. Deploy the stack

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
