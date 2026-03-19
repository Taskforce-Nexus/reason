#!/bin/bash
echo "🚀 Starting prompt generation — 2 tandas paralelas..."
echo ""

echo "====== TANDA 1: Advisors + Cofounders ======"
npx tsx scripts/generate-advisor-prompts.ts &
PID1=$!
npx tsx scripts/generate-cofounder-prompts.ts &
PID2=$!

echo "PIDs: Advisors=$PID1 Cofounders=$PID2"
wait $PID1 $PID2
echo "✅ Tanda 1 completa"
echo ""

echo "====== TANDA 2: Specialists + Personas ======"
npx tsx scripts/generate-specialist-prompts.ts &
PID3=$!
npx tsx scripts/generate-persona-prompts.ts &
PID4=$!

echo "PIDs: Specialists=$PID3 Personas=$PID4"
wait $PID3 $PID4
echo "✅ Tanda 2 completa"
echo ""

echo "====== CONTEOS FINALES ======"
node -e "
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const tables = ['advisors', 'cofounders', 'specialists', 'buyer_personas'];
  let grandTotal = 0, grandWithPrompt = 0;
  for (const t of tables) {
    const { count: total } = await s.from(t).select('id', { count: 'exact', head: true });
    const { count: withPrompt } = await s.from(t).select('id', { count: 'exact', head: true }).not('system_prompt', 'is', null);
    console.log(t + ': ' + withPrompt + '/' + total + ' with prompts');
    grandTotal += total || 0;
    grandWithPrompt += withPrompt || 0;
  }
  console.log('TOTAL: ' + grandWithPrompt + '/' + grandTotal);
})();
"
