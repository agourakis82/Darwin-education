# Vercel Env Cleanup (XAI_API_KEY)

When deploy shows:

- `A variable with the name XAI_API_KEY already exists for the target development,preview,production on branch undefined`

it usually means the key is already registered in those environments and the CLI did not get a branch context.

## Recommended cleanup

1) Authenticate and link the project:

```bash
vercel login
vercel link
```

2) Remove duplicates for all targets:

```bash
vercel env ls
vercel env rm XAI_API_KEY development
vercel env rm XAI_API_KEY preview
vercel env rm XAI_API_KEY production
```

3) Re-add with the same value in each target (or only where needed):

```bash
vercel env add XAI_API_KEY development
vercel env add XAI_API_KEY preview
vercel env add XAI_API_KEY production
```

4) Verify:

```bash
vercel env ls
```

## Branch-aware deploy sanity

- Prefer deploy settings by target (`development`, `preview`, `production`) in Vercel dashboard/CLI.
- Avoid setting branch-scoped variables unless explicitly required.

### One-pass cleanup (recommended)

Run this when you have `VERCEL_TOKEN` + `VERCEL_ORG_ID` + `VERCEL_PROJECT_ID` set:

```bash
export KEY="XAI_API_KEY"

for TARGET in development preview production; do
  vercel env rm "$KEY" "$TARGET" --yes \
    --scope "$VERCEL_ORG_ID" \
    --project-id "$VERCEL_PROJECT_ID" \
    --token "$VERCEL_TOKEN"
done
```

After removing, re-add exactly once per target with the desired value:

```bash
vercel env add XAI_API_KEY development --scope "$VERCEL_ORG_ID" --project-id "$VERCEL_PROJECT_ID" --token "$VERCEL_TOKEN"
vercel env add XAI_API_KEY preview --scope "$VERCEL_ORG_ID" --project-id "$VERCEL_PROJECT_ID" --token "$VERCEL_TOKEN"
vercel env add XAI_API_KEY production --scope "$VERCEL_ORG_ID" --project-id "$VERCEL_PROJECT_ID" --token "$VERCEL_TOKEN"
```

## Fast post-deploy checks

Use:

```bash
pnpm deploy:smoke -- --base=https://<seu-site>.vercel.app
```

If the endpoint is local:

```bash
pnpm deploy:smoke -- --base=http://localhost:3000
```
