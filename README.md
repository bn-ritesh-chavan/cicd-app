# cicd-app

A Node.js Express application with a full CI/CD pipeline using GitHub Actions, Docker, and Azure deployment.

## Table of Contents

- [Getting Started](#getting-started)
- [Running Locally](#running-locally)
- [Docker](#docker)
- [API Endpoints](#api-endpoints)
- [CI/CD Pipeline](#cicd-pipeline)
- [Security Gates](#security-gates)
- [Project Structure](#project-structure)

---

## Getting Started

### Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [Docker](https://www.docker.com/) (for containerized builds)
- npm (comes with Node.js)

### Install Dependencies

```sh
npm install
```

### Run Tests

```sh
npm test
```

### Run Linting

```sh
npm run lint
```

---

## Running Locally

### Without Docker

```sh
node server.js
```

The server starts on port `3000` by default 

### With Docker

#### 1. Build the Docker Image

```sh
docker build -t cicd-app:latest .
```

The [Dockerfile](Dockerfile) uses a **multi-stage build**:

- **Stage 1 (`builder`):** Installs all dependencies (including dev) and copies the source code.
- **Stage 2:** Copies the built app, prunes dev dependencies with `npm prune --production`, and runs as a non-root user (`appuser`) for security.

#### 2. Run the Docker Container

```sh
docker run -p 3000:3000 cicd-app:latest
```

To run on a different host port (e.g., `8080`):

```sh
docker run -p 8080:3000 cicd-app:latest
```

#### 3. Verify

```sh
curl http://localhost:3000/health
# Expected: {"status":"OK"}
```

#### 4. Stop the Container

```sh
docker ps            # find the CONTAINER ID
docker stop <id>
```

---

## API Endpoints

| Method | Path      | Description                     |
| ------ | --------- | ------------------------------- |
| GET    | `/health` | Health check — returns `{ status: "OK" }` |
| GET    | `/hello`  | Returns a welcome message       |
| GET    | `/error`  | Error test endpoint             |
| GET    | `/test`   | Test endpoint                   |

All routes are defined in [src/routes.js](src/routes.js).

---

## CI/CD Pipeline

The project uses two GitHub Actions workflows:

### CI — Quality and Security Gate ([`.github/workflows/ci.yml`](.github/workflows/ci.yml))

Triggered on **pull requests** to `main` and **pushes** to `main`.

| Job              | Purpose                                      |
| ---------------- | -------------------------------------------- |
| **lint**         | Runs ESLint via `npm run lint`               |
| **test**         | Runs Jest unit tests via `npm test`          |
| **security-scan**| Runs `npm audit --audit-level=high`          |
| **sonar**        | Runs tests with coverage and performs a SonarQube scan (depends on lint, test, and security-scan passing) |

All four jobs must pass before code is considered ready for merge.

### CD — Build and Publish ([`.github/workflows/cd.yml`](.github/workflows/cd.yml))

Triggered on **pushes** to `main` (i.e., after a PR is merged).

| Step                     | Purpose                                                        |
| ------------------------ | -------------------------------------------------------------- |
| **Checkout code**        | Pulls the repository source                                    |
| **Set up Docker Buildx** | Enables advanced Docker build features                         |
| **Log in to Docker Hub** | Authenticates using `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets |
| **Build Docker Image**   | Builds the image tagged with the Git commit SHA                |
| **Run Trivy Scan**       | Scans the image for **CRITICAL** vulnerabilities (fails the pipeline if any are found) |
| **Push Docker Image**    | Pushes the image to Docker Hub                                 |
| **Login to Azure**       | Authenticates with Azure using `AZURE_CREDENTIALS` secret      |
| **Deploy to Azure**      | Deploys the Docker image to the Azure Web App `cicd-app-practice` |

---

## Security Gates

The pipeline enforces multiple layers of security before code reaches production:

1. **`npm audit`** (CI) — Scans Node.js dependencies for known vulnerabilities at the `high` severity level or above. Fails the pipeline if any are found.

2. **SonarQube Analysis** (CI) — Performs static code analysis for code smells, bugs, and security hotspots via [SonarCloud](https://sonarcloud.io/). Configuration is in [sonar-project.properties](sonar-project.properties).

3. **Trivy Container Scan** (CD) — Scans the built Docker image for **CRITICAL** OS-level and library vulnerabilities. The pipeline fails (`exit-code: '1'`) if any critical issue is detected, preventing the image from being pushed or deployed.

4. **Non-root Docker User** — The [Dockerfile](Dockerfile) creates and switches to a non-root user (`appuser`), reducing the attack surface of the running container.

5. **Production-only Dependencies** — The Docker image runs `npm prune --production` to strip dev dependencies, minimizing the final image size and exposure.

---

## Project Structure

```
├── .github/workflows/
│   ├── ci.yml              # CI pipeline (lint, test, audit, sonar)
│   ├── cd.yml              # CD pipeline (build, scan, push, deploy)
│   └── CODEOWNERS          # Code ownership rules
├── src/
│   ├── app.js              # Express app setup
│   └── routes.js           # API route definitions
├── tests/
│   └── app.test.js         # Jest unit tests
├── Dockerfile              # Multi-stage Docker build
├── .dockerignore           # Files excluded from Docker context
├── eslint.config.mjs       # ESLint configuration
├── sonar-project.properties# SonarQube configuration
├── server.js               # Application entry point
└── package.json            # Dependencies and scripts
```

---

## Required GitHub Secrets

| Secret                | Purpose                              |
| --------------------- | ------------------------------------ |
| `DOCKERHUB_USERNAME`  | Docker Hub username                  |
| `DOCKERHUB_TOKEN`     | Docker Hub access token              |
| `AZURE_CREDENTIALS`   | Azure service principal credentials  |
| `SONAR_TOKEN`         | SonarCloud authentication token      |