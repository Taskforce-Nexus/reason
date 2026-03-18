import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  console.log('=== Marketplace Cleanup ===\n')

  // ── 1. Count before ─────────────────────────────────────────────────────────
  const { count: cfBefore } = await supabase.from('cofounders').select('*', { count: 'exact', head: true })
  const { count: spBefore } = await supabase.from('specialists').select('*', { count: 'exact', head: true })
  console.log(`Before — cofounders: ${cfBefore}, specialists: ${spBefore}`)

  // ── 2. Trim cofounders: keep 20 constructivo + 20 crítico + those in councils ─
  // Find in-use cofounder IDs
  const { data: inUse } = await supabase.from('council_cofounders').select('cofounder_id')
  const inUseIds = new Set((inUse ?? []).map((r: { cofounder_id: string }) => r.cofounder_id))
  console.log(`\nCofounders in use by councils: ${inUseIds.size}`)

  for (const role of ['constructivo', 'critico'] as const) {
    const { data: all } = await supabase
      .from('cofounders')
      .select('id')
      .eq('role', role)
      .order('created_at', { ascending: true })

    if (!all) continue
    const toKeep = all.filter(r => inUseIds.has(r.id))
    const remaining = all.filter(r => !inUseIds.has(r.id))
    const keepCount = Math.max(0, 20 - toKeep.length)
    const keepFree = remaining.slice(0, keepCount)
    const deleteList = remaining.slice(keepCount)

    console.log(`${role}: total=${all.length}, in-use=${toKeep.length}, free-kept=${keepFree.length}, to-delete=${deleteList.length}`)

    if (deleteList.length > 0) {
      const { error } = await supabase
        .from('cofounders')
        .delete()
        .in('id', deleteList.map(r => r.id))
      if (error) console.error(`  Error deleting ${role}:`, error.message)
      else console.log(`  Deleted ${deleteList.length} ${role} cofounders ✓`)
    }
  }

  // ── 3. Trim specialists: keep those with project_id or is_confirmed, + 200 templates ──
  const { data: allSpecs } = await supabase
    .from('specialists')
    .select('id, project_id, is_confirmed')
    .order('created_at', { ascending: true })

  if (allSpecs) {
    const safe = allSpecs.filter(s => s.project_id !== null || s.is_confirmed === true)
    const templates = allSpecs.filter(s => s.project_id === null && s.is_confirmed !== true)
    const keepTemplates = templates.slice(0, 200)
    const deleteTemplates = templates.slice(200)

    console.log(`\nSpecialists: total=${allSpecs.length}, safe=${safe.length}, templates=${templates.length}`)
    console.log(`  Keep templates: ${keepTemplates.length}, Delete: ${deleteTemplates.length}`)

    if (deleteTemplates.length > 0) {
      const { error } = await supabase
        .from('specialists')
        .delete()
        .in('id', deleteTemplates.map(s => s.id))
      if (error) console.error('  Error deleting specialists:', error.message)
      else console.log(`  Deleted ${deleteTemplates.length} template specialists ✓`)
    }
  }

  // ── 4. Count after ───────────────────────────────────────────────────────────
  const { count: cfAfter } = await supabase.from('cofounders').select('*', { count: 'exact', head: true })
  const { count: spAfter } = await supabase.from('specialists').select('*', { count: 'exact', head: true })
  console.log(`\nAfter — cofounders: ${cfAfter}, specialists: ${spAfter}`)
  console.log('\nDone ✓')
}

main().catch(e => { console.error(e); process.exit(1) })
