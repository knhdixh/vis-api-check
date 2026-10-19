# Deployment

Target: `api.knhdixh.com` (live). Repository: https://github.com/knhdixh/vis-api-check, auto-deployed from `main` by Workers Builds. Worker/repository name: `vis-api-check`. The existing IC3 project is separate.

Run from this checkout in a terminal with network access:

```sh
npm install
npm test
npm run check
npx wrangler login
npm run deploy
curl --fail https://api.knhdixh.com/api/health
curl --fail -I https://api.knhdixh.com/
curl --fail -I https://api.knhdixh.com/guide.html
```

The domain must belong to the same Cloudflare account. Before deploying, check the name is free with `cf workers scripts search --name vis-api-check` and `gh repo view knhdixh/vis-api-check`. Inspect any existing exact match before proceeding.

## Public GitHub repository

After deployment, replace the pending status in README with the verified live URL. Inspect the files before publishing:

```sh
gh auth login -h github.com
git init -b main
git config user.name knhdixh
```

Use the no-reply email from your GitHub user id and login (`gh api user`) for repo-local `user.email`. Then:

```sh
git add .
bash ~/.claude/skills/ship-cf-app/scripts/secret_scan.sh "$PWD"
git commit -m "Build browser API checker"
gh repo create knhdixh/vis-api-check --public --source . --remote origin --push --description "Live browser API signals and event logs"
gh repo edit knhdixh/vis-api-check --homepage https://api.knhdixh.com --add-topic cloudflare-workers
```

## Workers Builds

Use the same Claude helper as the IC3 project:

```sh
cf auth login
bash ~/.claude/skills/ship-cf-app/scripts/connect_builds.sh vis-api-check knhdixh/vis-api-check
```

If Cloudflare's GitHub app cannot see the repo, grant access through GitHub Settings → Applications → Cloudflare Workers and Pages. Keep saved build-token config outside the repo.

Make a real documentation change, commit and push it. Verify the pipeline:

```sh
bash ~/.claude/skills/ship-cf-app/scripts/wait_build.sh vis-api-check "$(git rev-parse HEAD)"
```

A successful direct deployment alone does not establish auto-deploy.
