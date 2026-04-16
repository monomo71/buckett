# Versioning and release process

## Current working version

- Current version: 0.1.0
- Release status: pre-release / active development

## Version rules

Buckett uses Semantic Versioning:

- Patch release: 0.1.1
  - for bug fixes and small safe improvements
- Minor release: 0.2.0
  - for new features that do not break existing usage
- Major release: 1.0.0
  - for a first official stable release or breaking changes

## Recommended workflow

1. Keep new work under the Unreleased section in [CHANGELOG.md](CHANGELOG.md)
2. When a release is ready, choose the next version number
3. Move the Unreleased notes into a new dated version section
4. Update the version in [package.json](package.json)
5. Create the GitHub release and publish release notes

## Release checklist

Before a release:

- verify the app builds successfully
- verify Docker deployment works
- verify login, uploads, previews, and downloads work
- update [CHANGELOG.md](CHANGELOG.md)
- update the version number in [package.json](package.json)

## Planned next release guidance

Because the app is already working well and you only expect a few final wishes, the next good milestone will likely be one of these:

- 0.2.0 for a polished feature update
- 1.0.0 if you decide this is the first stable public version

When you say you want to make a release, this document and the changelog are ready to use.
