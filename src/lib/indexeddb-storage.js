import { openDB } from 'idb';
let dbPromise;
function getDB() {
    if (!dbPromise) {
        dbPromise = openDB('windoor-zustand-db', 1, {
            upgrade(db) {
                db.createObjectStore('key-val');
            },
        });
    }
    return dbPromise;
}
export const indexedDBStorage = {
    getItem: async (name) => {
        if (typeof window === 'undefined') {
            return null;
        }
        const db = await getDB();
        const value = await db.get('key-val', name);
        return value ?? null;
    },
    setItem: async (name, value) => {
        if (typeof window === 'undefined') {
            return;
        }
        const db = await getDB();
        await db.put('key-val', value, name);
    },
    removeItem: async (name) => {
        if (typeof window === 'undefined') {
            return;
        }
        const db = await getDB();
        await db.delete('key-val', name);
    },
};
