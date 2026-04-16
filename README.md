# Buckett

Buckett is an open-source, self-hosted file manager for project-based uploads. It gives teams a clean admin interface to upload, organize, preview, rename, export, and manage files inside projects and folders.

> Important security note: Buckett is intentionally lightweight and currently uses a simple username and password system. It is not designed as a hardened security platform for sensitive, confidential, or highly regulated documents.

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

Buckett supports both a normal Docker Compose installation and a Dockge installation.

### Option 1: regular Docker Compose

Use this when you cloned or downloaded the repository onto your own server or computer.

1. Open a terminal in the project root
2. Copy the example environment file
3. Start the container
4. Open Buckett in your browser

Commands:

- cp .env.example .env
- docker compose up -d --remove-orphans

If your system uses the older Compose command, this also works:

- docker-compose up -d --remove-orphans

This uses [docker-compose.yml](docker-compose.yml).

Then open:

- http://localhost:3001

### Option 2: Dockge on an external server

Use this when you want to deploy through Dockge on a remote server.

Use [docker-compose.dockge.yml](docker-compose.dockge.yml). This version pulls the latest published Buckett image from GitHub Container Registry, which makes updates much more reliable in Dockge.

Recommended steps:

1. Create a new stack in Dockge
2. Paste the contents of [docker-compose.dockge.yml](docker-compose.dockge.yml)
3. Set your own values for PUBLIC_BASE_URL, ADMIN_USERNAME, and ADMIN_PASSWORD
4. Optionally set BUCKETT_TAG to a fixed release such as v1.0.0 for fully predictable updates
5. Deploy the stack

Most reliable update flow in Dockge:

1. Wait until the GitHub Actions image build has finished after push or release
2. In Dockge, change BUCKETT_TAG from the old version to the new version, for example from v0.1.7 to v1.0.0
3. Save and Redeploy the stack

Using a fixed version tag is more reliable than only using latest, because some Docker and Dockge setups can keep using a cached latest image until the container is recreated.

If the package is not yet visible on your server, wait until the GitHub Actions build has completed after push.

### Troubleshooting

If you see an error about not being able to connect to the Docker daemon, Docker Desktop or Docker Engine is not running yet.

If you see a Dockerfile not found error, make sure you either:

- run the normal setup from the project root folder
- or use the Dockge stack that builds from GitHub

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

## Versioning and releases

Project history and future release notes are tracked here:

- [CHANGELOG.md](CHANGELOG.md)
- [VERSIONING.md](VERSIONING.md)

## Public repository notes

This repository is prepared for GitHub and excludes personal uploaded files, backups, runtime data, build output, and local environment files.

## License

MIT
