# Deploy CampusEats on Render

Repository: https://github.com/nayanajithRajapaksha/Campus-eats-lab-11

Create three services in the [Render Dashboard](https://dashboard.render.com): Postgres, a Docker Web Service for the .NET API, and a Static Site for React. Connect your GitHub account and select this repository and branch `main` for both applications.

The service names and URLs below are examples. Use the actual URLs Render assigns to your services.

## 1. Create the database

Choose **New > Postgres**:

| Setting | Value |
| --- | --- |
| Name | `campuseats-db` |
| Database | `campuseats` |
| Region | Choose one available for both the database and API |
| Plan | Free for a short lab/demo, or a paid plan for lasting storage |

Wait for the database to become available. From its Info page or Connect menu, obtain the **internal** hostname, port, database name, username, and password. Keep the credentials in Render environment variables.

This creates a fresh database. Local users and orders are not copied; the API's migrations create the schema and seed the eight menu items.

## 2. Deploy the backend

Choose **New > Web Service**, connect the repository, and enter:

| Setting | Value |
| --- | --- |
| Name | `campuseats-api` |
| Branch | `main` |
| Language / Runtime | Docker |
| Root Directory | `backend/CampusEats.Api` |
| Dockerfile Path | `./Dockerfile` |
| Docker Build Context Directory | `.` |
| Docker Command | Leave blank; the Dockerfile starts the API |
| Region | Same region as the database |
| Health Check Path | `/health` |
| Instance Type | Free for a lab/demo, or a paid plan |

Add these environment variables before deploying. The double underscores are required by .NET configuration:

| Key | Value |
| --- | --- |
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ConnectionStrings__Default` | The connection string shown below, with your database values |
| `Database__MigrateOnStartup` | `true` |
| `Jwt__Key` | A freshly generated secret, at least 32 bytes |
| `Jwt__Issuer` | `CampusEats.Api` |
| `Jwt__Audience` | `CampusEats.Frontend` |

The API expects an Npgsql connection string. Build it from the database's internal connection details:

```text
Host=YOUR_INTERNAL_HOST;Port=5432;Database=YOUR_DATABASE;Username=YOUR_USERNAME;Password=YOUR_PASSWORD;SSL Mode=Require
```

Do not paste the `postgresql://...` URL into `ConnectionStrings__Default`; this application expects the `Host=...;...` format.

To generate `Jwt__Key`, run this in local PowerShell and copy its output into Render:

```powershell
$jwtBytes = New-Object byte[] 48
$jwtGenerator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try { $jwtGenerator.GetBytes($jwtBytes) }
finally { $jwtGenerator.Dispose() }
[Convert]::ToBase64String($jwtBytes)
```

Click **Deploy Web Service**. Startup applies all pending EF Core migrations before serving requests. On later restarts, already-applied migrations are skipped. The API reads Render's `PORT` automatically.

Copy the public API URL, for example `https://campuseats-api.onrender.com`. Open `/health` on that URL; it should return `{"status":"healthy","database":"ready"}`. `/api/menu` should return the seeded menu. Swagger is only enabled for local Development, so `/swagger` is not a production check.

Startup migration is convenient for this lab's single API instance. For a production rollout or multiple replicas, use reviewed migration scripts or a separate migration job and turn this flag off. Render pre-deploy commands require a paid service, and this runtime Docker image does not include the .NET SDK or `dotnet ef`.

## 3. Deploy the frontend

Choose **New > Static Site**, select the same repository, and enter:

| Setting | Value |
| --- | --- |
| Name | `campuseats-web` |
| Branch | `main` |
| Root Directory | `frontend` |
| Build Command | `npm ci && npm run build` |
| Publish Directory | `dist` |
| Environment: `NODE_VERSION` | `24` |
| Environment: `VITE_API_URL` | Your public API URL, such as `https://campuseats-api.onrender.com` |

Use the API's public HTTPS URL without an `/api` suffix; frontend requests already include `/api/...`. `VITE_API_URL` is included in the frontend at build time, so rebuild/redeploy the Static Site whenever you change it. Database credentials and JWT secrets belong only in the backend environment.

Click **Deploy Static Site**. Under its **Redirects/Rewrites** settings, add:

| Source | Destination | Action |
| --- | --- | --- |
| `/*` | `/index.html` | Rewrite |

The existing `vercel.json` is for Vercel; configure this rewrite in Render separately.

## 4. Allow the frontend to call the API

Copy the frontend's actual public URL, for example `https://campuseats-web.onrender.com`. In the **backend Web Service > Environment**, add:

```text
Cors__AllowedOrigins__0=https://campuseats-web.onrender.com
```

Use your actual frontend origin, including `https://` and without a trailing slash or path. Save and redeploy the backend. For additional frontend domains, use `Cors__AllowedOrigins__1`, `Cors__AllowedOrigins__2`, and so on.

Open the frontend, register a new account, log in, and place an order. These actions verify the frontend, API, database, JWT settings, and CORS together.

## Troubleshooting

- **API deploy fails:** Read its Render logs. Confirm the database is available, the internal hostname is correct, both services use the same region, and `ConnectionStrings__Default` uses Npgsql format.
- **Missing database tables:** Confirm `Database__MigrateOnStartup=true` and look for migration messages in the backend logs.
- **Menu does not load:** Open the API's `/api/menu` URL directly, then check `VITE_API_URL` and the backend's `Cors__AllowedOrigins__0`. Redeploy each service whose environment you changed.
- **Registration or login fails:** Confirm all three `Jwt__...` variables are set and the signing key is at least 32 bytes. Check the backend logs.
- **First request is slow:** Free Web Services sleep after 15 minutes without traffic; waking up takes about a minute.

Free Render Postgres databases currently expire after 30 days. Use a paid database if you need to retain the application's data beyond the lab.

## Official references

- [Render Docker deployment](https://render.com/docs/docker)
- [Render monorepo root directories](https://render.com/docs/monorepo-support)
- [Render Static Sites](https://render.com/docs/static-sites)
- [Render Postgres connections](https://render.com/docs/postgresql-creating-connecting)
- [Render environment variables](https://render.com/docs/configure-environment-variables)
- [Render free plan limitations](https://render.com/docs/free)
- [EF Core migration deployment guidance](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/applying)
