<p align="center">
  <img src="https://user-images.githubusercontent.com/35788699/116828155-ed3ccd00-ab6a-11eb-9327-4d99bd169bdc.png" alt="Logo Cropped">
</p>
<p align="center">
    <a href="https://github.com/AgoraCloud/server/issues"><img src="https://img.shields.io/github/issues/AgoraCloud/server" alt="GitHub issues"></a> <a href="https://github.com/AgoraCloud/server/blob/main/LICENSE"><img src="https://img.shields.io/github/license/AgoraCloud/server" alt="GitHub license"></a> <img alt="GitHub release (latest by date)" src="https://img.shields.io/github/v/release/AgoraCloud/server"> <img src="https://img.shields.io/github/release-date/AgoraCloud/server" alt="GitHub Release Date"> <img alt="Docker Pulls" src="https://img.shields.io/docker/pulls/agoracloud/server"> <img src="https://img.shields.io/github/workflow/status/AgoraCloud/server/main_versioned_push" alt="GitHub Workflow Status"> <img src="https://img.shields.io/github/contributors/AgoraCloud/server" alt="GitHub contributors"> <img src="https://img.shields.io/github/commit-activity/m/AgoraCloud/server" alt="GitHub commit activity">
</p>

AgoraCloud is an open source and self hosted cloud development platform that runs in Kubernetes.

## Installation

AgoraCloud is installed on a Kubernetes cluster using a Helm chart. For more details, refer to the instructions in the [helm-chart directory](https://github.com/AgoraCloud/server/tree/main/helm-chart).

## Development

### Set Up

1. Clone this repository

```bash
git clone https://github.com/AgoraCloud/server.git
```

2. Change directory

```bash
cd server
```

3. Install required packages

```bash
npm i
```

4. Create a `.env` file in the root of the project with the following environment variables

> Make sure that all the environment variables below are populated. For a detailed description of all environment variables, check out the [documentation](https://github.com/AgoraCloud/server/wiki/Environment-Variables).

```bash
# Node Environment
NODE_ENV=development
# Log Level
LOG_LEVEL=log,warn,error
# Domain
DOMAIN=
# Database
DATABASE_URI=
# Admin
ADMIN_EMAIL=admin@admin.com
ADMIN_PASSWORD=AdminPassword
# JWT
JWT_ACCESS_SECRET=secret
JWT_REFRESH_SECRET=refresh_secret
# SMTP
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_USERNAME=
SMTP_PASSWORD=
# Kubernetes
KUBERNETES_NAMESPACE=agoracloud
KUBERNETES_STORAGE_CLASS=default
KUBERNETES_SERVICE_ACCOUNT=agoracloud
```

### Running the app

```bash
# Development
npm run start

# Watch mode
npm run start:dev

# Production mode
npm run start:prod
```

### Swagger UI (API Documentation)

To view a list of all APIs and their documentation, make sure that the `NODE_ENV` environment variable is set to `development` and that the server is running.

Then, navigate to `localhost:3000/api/docs` in any browser. You should see Swagger UI.

### Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```
