/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

// Initial DB Structure
const INITIAL_DB = {
  leads: [],
  settings: {
    main: {
      smtp_host: "",
      smtp_port: "",
      smtp_user: "",
      smtp_pass: "",
      smtp_secure: false,
    }
  },
  admin_users: [
    {
      id: "default-admin",
      name: "Admin User",
      email: "admin@socialbluepro.com",
      password_hash: "$2a$10$X7.X7.X7.X7.X7.X7.X7.X7.X7.X7.X7.X7.X7.X7.X7.X7", // Placeholder, will be reset or handled by auth
      role: "admin",
      created_at: new Date().toISOString(),
      failed_attempts: 0,
      locked_until: null
    }
  ]
};

function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_DB, null, 2));
    return INITIAL_DB;
  }
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading DB:", error);
    return INITIAL_DB;
  }
}

function writeDb(data: unknown) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("Error writing DB:", error);
    return false;
  }
}

export const localDb = {
  from: (table: string) => {
    const db = readDb();
    
    return {
      select: (columns: string = "*") => { // eslint-disable-line @typescript-eslint/no-unused-vars
        return {
          eq: (column: string, value: unknown) => {
            const data = (db[table] || []).filter((row: Record<string, unknown>) => row[column] === value);
            return {
              single: async () => ({ data: data[0] || null, error: null }),
              order: (col: string, { ascending }: { ascending: boolean }) => {
                const sorted = [...data].sort((a, b) => {
                  return ascending ? (a[col] > b[col] ? 1 : -1) : (a[col] < b[col] ? 1 : -1);
                });
                return { data: sorted, error: null };
              },
              data,
              error: null
            };
          },
          order: async (col: string, { ascending }: { ascending: boolean }) => {
            const data = [...(db[table] || [])].sort((a, b) => {
              return ascending ? (a[col] > b[col] ? 1 : -1) : (a[col] < b[col] ? 1 : -1);
            });
            return { data, error: null };
          },
          single: async () => { // Finds first if no filter
             return { data: (db[table] || [])[0] || null, error: null };
          }
        };
      },
      insert: async (rows: Record<string, unknown>[]) => {
        const newRows = rows.map(r => ({ ...r, id: crypto.randomUUID(), created_at: new Date().toISOString() }));
        if (!db[table]) db[table] = [];
        db[table].push(...newRows);
        writeDb(db);
        return { data: newRows, error: null };
      },
      update: (updates: Record<string, unknown>) => {
        return {
          eq: async (column: string, value: any) => {
            if (!db[table]) db[table] = [];
            let updatedCount = 0;
            db[table] = db[table].map((row: any) => {
              if (row[column] === value) {
                updatedCount++;
                return { ...row, ...updates, updated_at: new Date().toISOString() };
              }
              return row;
            });
            writeDb(db);
            return { data: null, error: null, count: updatedCount };
          }
        };
      },
      delete: () => {
        return {
          eq: async (column: string, value: any) => {
            if (!db[table]) return { error: null };
            const initialLen = db[table].length;
            db[table] = db[table].filter((row: any) => row[column] !== value);
            writeDb(db);
            return { error: null, count: initialLen - db[table].length };
          },
        };
      },
      upsert: async (data: any) => {
        if (!db[table]) db[table] = [];
        const existingIndex = db[table].findIndex((row: any) => row.id === data.id);
        if (existingIndex >= 0) {
          db[table][existingIndex] = { ...db[table][existingIndex], ...data, updated_at: new Date().toISOString() };
        } else {
          db[table].push({ ...data, created_at: new Date().toISOString() });
        }
        writeDb(db);
        return { error: null };
      }
    };
  }
};
