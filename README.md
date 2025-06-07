Forms is a simple form builder for Cloudflare Workers, built with React and TypeScript.

```bash
pnpm install
pnpm run dev
```

```bash
pnpm run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```bash
pnpm run cf-typegen
```

To generate Prisma client types, run:
```bash
pnpm run prisma:generate
```

To regenerate Prisma migrations, run:
```
pnpm dlx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel ./prisma/schema.prisma \
  --script \
  --output ./prisma/migrations/0001_init.sql
```

To apply the generated migrations to your D1 database locally, use the following command:
```bash
wrangler d1 migrations apply forms --local
```

To apply the generated migrations to your D1 database in production, use the following command:
```bash
wrangler d1 migrations apply forms --remote
```
