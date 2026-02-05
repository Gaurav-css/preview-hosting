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

## 🚀 Important: Deploying to Vercel

If you deploy this project to Vercel, **local storage will not work** because Vercel is serverless/ephemeral.
You MUST configure **Supabase Storage** for files to persist.

### 1. Credentials Required

Go to your **Vercel Project Settings > Environment Variables** and add:

| Key                             | Value                                                     |
| :------------------------------ | :-------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase URL (e.g. `https://xyz.supabase.co`)        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase `anon` / `public` Key (starts with `ey...`) |
| `MONGODB_URI`                   | Your MongoDB Connection String                            |
| `NEXT_PUBLIC_FIREBASE_...`      | (All your Firebase Config Keys)                           |
| `FIREBASE_CLIENT_EMAIL`         | Your Firebase Admin Service Account Email                 |
| `FIREBASE_PRIVATE_KEY`          | Your Firebase Admin Private Key                           |

### 2. Verify Storage

Ensure you have a **public bucket** named `projects` in your Supabase Storage dashboard.
