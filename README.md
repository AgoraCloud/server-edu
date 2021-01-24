# AgoraCloud

AgoraCloud is an open source and self hosted cloud coding platform that runs in Kubernetes.

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

### Running the app

```bash
# Development
$ npm run start

# Watch mode
$ npm run start:dev

# Production mode
$ npm run start:prod
```

## Test

```bash
# Unit tests
$ npm run test

# E2E tests
$ npm run test:e2e

# Test coverage
$ npm run test:cov
```
