This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Setup (MVP)

Create `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Then install and run:

```
npm install
npm run dev
```

This MVP uses Supabase Realtime + Storage. Create the tables defined in `supabase/schema.sql`.

## Automatic Cleanup Setup

The app automatically cleans up expired room data:

1. **Database cleanup**: Run `supabase/schema.sql` to create the cleanup function
2. **Storage cleanup**: The API route `/api/cleanup` handles storage file deletion
3. **Cron job**: Set up a cron job to call the cleanup endpoint:

```bash
# Every 6 hours
0 */6 * * * curl -X POST https://your-domain.com/api/cleanup

# Or use a service like cron-job.org
```

The cleanup preserves analytics data in `room_analytics` table while deleting:
- Messages, participants, moments
- Media files from storage
- Room records
