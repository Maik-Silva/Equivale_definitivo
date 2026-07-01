#!/usr/bin/env node
// Remove occurrences of the role/value 'self' from common user fields/arrays
// Usage:
//   MONGO_URL="<your mongo uri>" node scripts/remove-self-role.js

const { MongoClient } = require('mongodb')

const uri = process.env.MONGO_URL || process.env.MONGODB_URI || process.env.DATABASE_URL
if (!uri) {
  console.error('Missing MongoDB URI. Set MONGO_URL or MONGODB_URI or DATABASE_URL.')
  process.exit(1)
}

const dbName = process.env.DB_NAME || process.env.MONGO_DB_NAME || 'test'
const candidateCollections = ['users', 'usuarios', 'accounts', 'user', 'users_collection']

async function run() {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  try {
    await client.connect()
    const db = client.db(dbName)

    for (const name of candidateCollections) {
      const col = db.collection(name)
      // skip if collection doesn't exist / empty
      const exists = await col.countDocuments({}, { limit: 1 })
      if (!exists) continue

      console.log(`Checking collection: ${name}`)

      const results = {
        role_unset: 0,
        tipo_unset: 0,
        roleName_unset: 0,
        roles_pulled: 0
      }

      const r1 = await col.updateMany({ role: 'self' }, { $unset: { role: '' } })
      results.role_unset = r1.modifiedCount || 0

      const r2 = await col.updateMany({ tipo: 'self' }, { $unset: { tipo: '' } })
      results.tipo_unset = r2.modifiedCount || 0

      const r3 = await col.updateMany({ roleName: 'self' }, { $unset: { roleName: '' } })
      results.roleName_unset = r3.modifiedCount || 0

      const r4 = await col.updateMany({ roles: 'self' }, { $pull: { roles: 'self' } })
      results.roles_pulled = r4.modifiedCount || 0

      console.log(`Results for ${name}:`, results)
    }

    console.log('Done.')
  } catch (err) {
    console.error('Error:', err)
    process.exit(2)
  } finally {
    await client.close()
  }
}

run()
