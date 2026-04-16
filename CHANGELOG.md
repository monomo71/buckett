# Changelog

All notable changes to Buckett are tracked in this file.

This project follows a simple versioning flow based on Semantic Versioning.

## Unreleased

## 1.0.0 - 2026-04-16

### Highlights
- first stable public release of Buckett
- project-based file management with multi-user admin controls
- dark mode, theme customization, activity archives, and Docker/Dockge deployment support

## 0.1.7 - 2026-04-16

### Added
- compact activity log with a fixed-height scroll area
- daily archive selector so you can switch between log days
- export of the currently selected activity view to CSV

## 0.1.6 - 2026-04-16

### Changed
- Dockge deployments now use a pinned release tag by default for more predictable updates
- Docker setups now include a health check so restart state is easier to trust and diagnose

### Fixed
- reduced the chance that Dockge keeps serving an older cached image after a normal update or redeploy

## 0.1.5 - 2026-04-16

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
- dark mode contrast: all UI elements (navigation, settings, forms, panels) now fully respect the active theme
- hover states on sidebar navigation items adapt correctly in dark mode
- drag-and-drop upload zone renders properly in dark mode

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
