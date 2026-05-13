# AGENTS Guidelines for This Repository

This repository contains the SKYGRID / Aura-Core public front door built with Next.js.
It is a public-facing website and proof surface, not a wallet executor, exchange bot,
or hidden compute client.

Agents working in this repo must preserve three priorities:

1. keep the website deployable,
2. keep dependency and lockfile proof clean,
3. keep public claims aligned with verified evidence.

## 1. Use the Development Server During Agent Sessions

- Use `pnpm dev` while iterating on UI and content.
- Do **not** run `pnpm build` inside an interactive agent session unless explicitly asked.
- Production builds are allowed in CI, Vercel, or a dedicated verification pass.
- If HMR behaves oddly, restart the dev server instead of forcing a build.

## 2. Keep Dependencies and Lockfile in Sync

This repo uses pnpm.

When dependencies change:

1. update `package.json`,
2. run `pnpm install`,
3. commit the refreshed `pnpm-lock.yaml`,
4. run `pnpm lint`,
5. verify the deployment workflow or Vercel build.

Do not leave `package.json` and `pnpm-lock.yaml` out of sync.

Current security intent:

- keep Next.js and React on patched versions for React Server Components advisories,
- avoid broad major-version jumps unless needed,
- prefer a minimal security patch plus clean lockfile refresh.

## 3. Heavy-Traffic Website Rules

The website should remain edge-first and cache-forward.

Preserve:

- immutable cache headers for Next.js static assets,
- immutable cache headers for public assets and logos,
- short cache for `/health.json`,
- stale-while-revalidate for normal public pages,
- basic browser security headers.

Do not add dynamic proof workloads directly to the marketing front door unless they have
explicit cache and rate-limit behavior.

## 4. SKYGRID / AWS Environment Wiring

The site may expose public, non-secret environment values only.

Expected Vercel aliases:

```text
aws_region
skygrid_api_base
skygrid_health_url
```

Expected public env mappings:

```text
NEXT_PUBLIC_SKYGRID_MODE
NEXT_PUBLIC_SKYGRID_NETWORK
NEXT_PUBLIC_AWS_REGION
NEXT_PUBLIC_SKYGRID_API_BASE
NEXT_PUBLIC_SKYGRID_HEALTH_URL
```

Never commit AWS keys, Vercel tokens, wallet secrets, API keys, or `.env` files.

## 5. Proof-First Public Language

Use proof-forward language.

Safe wording:

> SKYGRID Option B is a local-first, cloud-reserve validation architecture with an
> edge-cached website front door and public health manifest.

Avoid unsupported claims such as:

- guaranteed uptime without test results,
- fully live national deployment,
- automatic exchange execution,
- wallet movement,
- swaps,
- staking,
- hidden mining,
- production AWS execution before workflow proof exists.

## 6. Safety Boundary

This repo may describe validation, routing, architecture, proof artifacts, pilot access,
and website readiness.

This repo must not implement or advertise:

- wallet movement,
- token swaps,
- bridge transfers,
- hidden mining,
- exchange trades,
- surveillance features,
- secret collection.

## 7. Useful Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the Next.js dev server with HMR. |
| `pnpm install` | Refresh dependencies and `pnpm-lock.yaml`. |
| `pnpm lint` | Run the TypeScript check configured for this repo. |
| `pnpm test` | Run the repository test suite. |
| `pnpm build` | Production build; use in CI/Vercel or explicit verification only. |

## 8. Recommended Next Verification

After dependency/security changes, verify:

1. `pnpm install --frozen-lockfile` passes,
2. `pnpm lint` passes,
3. Vercel build passes,
4. `/health.json` is reachable after deploy,
5. cache headers are present on static assets and public pages.

When in doubt, preserve deployability and create a small reviewable change instead of a
large mixed-purpose commit.
