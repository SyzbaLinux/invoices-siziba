import { openDB } from 'idb'

const DB_NAME = 'InvoiceManagerDB'
const DB_VERSION = 1

let dbInstance = null

export async function initDB() {
  if (dbInstance) return dbInstance

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Create clients store
      if (!db.objectStoreNames.contains('clients')) {
        const clientStore = db.createObjectStore('clients', {
          keyPath: 'id',
          autoIncrement: true,
        })
        clientStore.createIndex('name', 'name', { unique: false })
        clientStore.createIndex('email', 'email', { unique: false })
      }

      // Create invoices store
      if (!db.objectStoreNames.contains('invoices')) {
        const invoiceStore = db.createObjectStore('invoices', {
          keyPath: 'id',
          autoIncrement: true,
        })
        invoiceStore.createIndex('client_id', 'client_id', { unique: false })
        invoiceStore.createIndex('invoice_number', 'invoice_number', { unique: true })
        invoiceStore.createIndex('status', 'status', { unique: false })
        invoiceStore.createIndex('date', 'date', { unique: false })
      }

      // Create payments store
      if (!db.objectStoreNames.contains('payments')) {
        const paymentStore = db.createObjectStore('payments', {
          keyPath: 'id',
          autoIncrement: true,
        })
        paymentStore.createIndex('invoice_id', 'invoice_id', { unique: false })
        paymentStore.createIndex('date', 'date', { unique: false })
      }

      // Create settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', {
          keyPath: 'id',
        })
      }
    },
  })

  return dbInstance
}

export async function getDB() {
  if (!dbInstance) {
    await initDB()
  }
  return dbInstance
}

// Generic CRUD operations
export async function addRecord(storeName, data) {
  const db = await getDB()
  return await db.add(storeName, data)
}

export async function getRecord(storeName, id) {
  const db = await getDB()
  return await db.get(storeName, id)
}

export async function getAllRecords(storeName) {
  const db = await getDB()
  return await db.getAll(storeName)
}

export async function updateRecord(storeName, data) {
  const db = await getDB()
  return await db.put(storeName, data)
}

export async function deleteRecord(storeName, id) {
  const db = await getDB()
  return await db.delete(storeName, id)
}

// Index queries
export async function getByIndex(storeName, indexName, value) {
  const db = await getDB()
  return await db.getAllFromIndex(storeName, indexName, value)
}

export async function getOneByIndex(storeName, indexName, value) {
  const db = await getDB()
  return await db.getFromIndex(storeName, indexName, value)
}

// Count records
export async function countRecords(storeName) {
  const db = await getDB()
  return await db.count(storeName)
}

// Clear store
export async function clearStore(storeName) {
  const db = await getDB()
  return await db.clear(storeName)
}
