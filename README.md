# AGENTS.md

<p align="center">
  <img src="https://agents.md/og.png">
</p>

[AGENTS.md](https://agents.md) is a simple, open format for guiding coding agents.

Think of AGENTS.md as a README for agents: a dedicated, predictable place
to provide context and instructions to help AI coding agents work on your project.

Below is a minimal example of an AGENTS.md file:

```markdown
# Sample AGENTS.md file

## Dev environment tips
- Use `pnpm dlx turbo run where <project_name>` to jump to a package instead of scanning with `ls`.
- Run `pnpm install --filter <project_name>` to add the package to your workspace so Vite, ESLint, and TypeScript can see it.
- Use `pnpm create vite@latest <project_name> -- --template react-ts` to spin up a new React + Vite package with TypeScript checks ready.
- Check the name field inside each package's package.json to confirm the right name—skip the top-level one.

## Testing instructions
- Find the CI plan in the .github/workflows folder.
- Run `pnpm turbo run test --filter <project_name>` to run every check defined for that package.
- From the package root you can just call `pnpm test`. The commit should pass all tests before you merge.
- To focus on one step, add the Vitest pattern: `pnpm vitest run -t "<test name>"`.
- Fix any test or type errors until the whole suite is green.
- After moving files or changing imports, run `pnpm lint --filter <project_name>` to be sure ESLint and TypeScript rules still pass.
- Add or update tests for the code you change, even if nobody asked.

## PR instructions
- Title format: [<project_name>] <Title>
- Always run `pnpm lint` and `pnpm test` before committing.
```

## Website

This repository also includes a basic Next.js website hosted at https://agents.md/
that explains the project’s goals in a simple way, and featuring some examples.

## Weekly status email workflow

A scheduled GitHub Actions workflow at `.github/workflows/weekly-email.yml` sends a
weekly status email every Monday at 09:00 UTC. Configure the following repository
secrets for the workflow to run successfully:

- `EMAIL_SERVER` and `EMAIL_PORT`: SMTP server host and port.
- `EMAIL_USERNAME` and `EMAIL_PASSWORD`: SMTP credentials.
- `EMAIL_FROM` and `EMAIL_TO`: sender and recipient addresses.

The workflow can also be triggered manually via the **Run workflow** button in the
Actions tab.

### Deployment network access

Do not disable outbound internet access for deployments or scheduled workflow runs.
The weekly email workflow needs outbound SMTP/TLS connectivity to safely transfer
status updates through the configured mail server, and the site deployment should
retain normal outbound HTTPS access for runtime integrations and observability.
Prefer provider-level allowlists, TLS, and scoped secrets over blanket offline
network policies.

### Running the app locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open your browser and go to http://localhost:3000
