import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ZustandDB extends DBSchema {
  'key-val': {
    key: string;
    value: any;
  };
}

let dbPromise: Promise<IDBPDatabase<ZustandDB>>;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ZustandDB>('windoor-zustand-db', 1, {
      upgrade(db) {
        db.createObjectStore('key-val');
      },
    });
  }
  return dbPromise;
}

export const indexedDBStorage = {
  getItem: async (name: string): Promise<any | null> => {
    if (typeof window === 'undefined') {
        return null;
    }
    const db = await getDB();
    const value = await db.get('key-val', name);
    return value ?? null;
  },
  setItem: async (name: string, value: any): Promise<void> => {
    if (typeof window === 'undefined') {
        return;
    }
    const db = await getDB();
    await db.put('key-val', value, name);
  },
  removeItem: async (name: string): Promise<void> => {
    if (typeof window === 'undefined') {
        return;
    }
    const db = await getDB();
    await db.delete('key-val', name);
  },
};
