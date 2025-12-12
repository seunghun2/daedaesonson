#!/bin/bash

# Add Environment Variables
echo "Adding DATABASE_URL..."
echo -n "postgresql://postgres:Tmdgns6221%21@db.jbydmhfuqnpukfutvrgs.supabase.co:6543/postgres?pgbouncer=true" | npx vercel env add DATABASE_URL production || true

echo "Adding DIRECT_URL..."
echo -n "postgresql://postgres:Tmdgns6221%21@db.jbydmhfuqnpukfutvrgs.supabase.co:5432/postgres" | npx vercel env add DIRECT_URL production || true

echo "Adding NEXT_PUBLIC_SUPABASE_URL..."
echo -n "https://jbydmhfuqnpukfutvrgs.supabase.co" | npx vercel env add NEXT_PUBLIC_SUPABASE_URL production || true

echo "Adding GEMINI_API_KEY..."
echo -n "AIzaSyCVo0fCTRxNuxe2N0XmqW5ZGPWao8wEEfQ" | npx vercel env add GEMINI_API_KEY production || true

echo "Adding NEXT_PUBLIC_NAVER_MAP_CLIENT_ID..."
echo -n "9ynkl22koz" | npx vercel env add NEXT_PUBLIC_NAVER_MAP_CLIENT_ID production || true

echo "Adding NAVER_MAP_CLIENT_SECRET..."
echo -n "ayNvCHQL45KqV0JbMjyd1vfpudqe8mB5mr6PUkVG" | npx vercel env add NAVER_MAP_CLIENT_SECRET production || true

# Trigger Deployment
echo "Triggering Vercel Deployment..."
npx vercel --prod --yes
