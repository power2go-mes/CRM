const projectRef = process.env.SUPABASE_PROJECT_REF
const managementToken = process.env.SUPABASE_MANAGEMENT_TOKEN

async function testSql() {
  if (!projectRef || !managementToken) {
    throw new Error(
      'Set SUPABASE_PROJECT_REF and SUPABASE_MANAGEMENT_TOKEN before running this script.',
    )
  }
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${managementToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: 'SELECT count(*) FROM public.sales;' })
  })

  console.warn('Status:', res.status)
  const data = await res.json()
  console.warn('Result:', data)
}

testSql().catch(console.error)
