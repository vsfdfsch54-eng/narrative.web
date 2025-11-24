#!/bin/bash
# Check if all Supabase migrations are applied
# Usage: ./scripts/check-migrations.sh

set -e

echo "🔍 Checking Supabase migration status..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo "❌ Supabase CLI not found. Install with: npm install -g supabase"
  exit 1
fi

# Check if linked to project
if [ ! -f ".supabase/config.toml" ]; then
  echo "⚠️  Not linked to Supabase project. Run: supabase link --project-ref <project-id>"
  exit 1
fi

# Check migration status
supabase migration status

echo ""
echo "✅ Migration check complete"

