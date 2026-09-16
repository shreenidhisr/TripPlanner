import { migrate } from './client'

await migrate()
console.log('[db] migrations applied')
process.exit(0)
