# Misconception Lab

Misconception Lab is a full-stack learning app where students practice identifying and correcting deliberately incorrect reasoning. It includes a React/Vite client, an Express API, MongoDB persistence, teacher tools, and SAGE study guidance powered by Sarvam when configured.

## Requirements

- Node.js 20 or later
- MongoDB Atlas connection string
- Sarvam API key (optional; SAGE uses built-in guidance when it is unavailable)

## Local setup

```sh
npm install
npm install --prefix client
npm install --prefix server
cp .env.example .env
```

Set `MONGODB_URI` and a `SESSION_SECRET` of at least 32 characters in the root `.env`. Set `SARVAM_API_KEY` to enable live SAGE responses. Keep `.env` private; it is excluded from Git.

Seed the assessment and start both applications from the project root:

```sh
npm run seed
npm run dev
```

Open <http://localhost:5173>. The API health endpoint is <http://localhost:5173/api/health>. The backend reports database connection state there.

To provision the initial teacher account, set `TEACHER_EMAIL` and `TEACHER_PASSWORD` in `.env`, then run:

```sh
npm run bootstrap:teacher
```

The teacher provisioning command is one-time and refuses to create additional teacher accounts.

## Useful commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite client and Express server together |
| `npm test` | Run backend tests |
| `npm run build --prefix client` | Build the client for production |
| `npm run seed` | Seed the versioned assessment questions |

## Security

- Never commit `.env` or put server secrets in `VITE_` variables.
- MongoDB and Sarvam credentials are used only by the backend.
- Student answers are graded on the server; correct answers are not sent during an active assessment.
- Sessions use HTTP-only cookies and are stored in MongoDB.
