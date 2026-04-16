# Changelog

All notable changes to Buckett are tracked in this file.

This project follows a simple versioning flow based on Semantic Versioning.

## Unreleased

### Added
- Dockge deployment support for external servers
- clearer Docker and Docker Compose installation instructions
- separate server-friendly stack for GitHub-based deployment
- user passwords can now be updated from the admin settings screen
- a live status panel in the left sidebar showing file count, storage usage, system state, version, and update availability
- a documented product roadmap and wishlist for future Buckett development
- automatic Docker image publishing for GitHub and Dockge deployments

### Changed
- README now clearly states that Buckett currently uses simple authentication and is not intended for sensitive documents

### Fixed
- preview and copied file URLs now continue to work after a server migration or domain change
- older stored upload records are normalized automatically when the app starts

## 0.1.0 - 2026-04-16

### Added
- project-based file manager with uploads, folders, and file organization
- admin login and user management
- direct upload and upload to existing folder
- rename support for projects, folders, and files
- image and file preview popup
- copy public URL action
- CSV export
- activity logging
- light, dark, and system theme support
- Docker deployment support

### Notes
- this is the current baseline version documented for future releases
