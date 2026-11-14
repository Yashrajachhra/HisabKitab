/**
 * localStorage-backed SQLite stand-in for web when SharedArrayBuffer is
 * unavailable (e.g. http://192.168.x.x — not a secure context).
 * Native / cross-origin-isolated localhost still use real expo-sqlite.
 */

type SqlValue = string | number | null | boolean;
type Row = Record<string, SqlValue>;

const STORAGE_KEY = 'hk_web_db_v1';
const TABLE_NAMES = [
  'meta',
  'categories',
  'expenses',
  'budgets',
  'groups',
  'group_expenses',
  'settlements',
] as const;

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim();
}

function emptyTables(): Record<string, Row[]> {
  const tables: Record<string, Row[]> = {};
  for (const name of TABLE_NAMES) tables[name] = [];
  return tables;
}

function loadTables(): Record<string, Row[]> {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return emptyTables();
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return emptyTables();
    const tables = emptyTables();
    for (const name of TABLE_NAMES) {
      const rows = (parsed as Record<string, unknown>)[name];
      if (Array.isArray(rows)) tables[name] = rows as Row[];
    }
    return tables;
  } catch {
    return emptyTables();
  }
}

function readLiteral(token: string, params: SqlValue[]): SqlValue {
  const trimmed = token.trim();
  if (trimmed === '?') {
    return params.shift() ?? null;
  }
  if (trimmed === 'NULL' || trimmed === 'null') return null;
  if (/^'.*'$/s.test(trimmed)) return trimmed.slice(1, -1).replace(/''/g, "'");
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed;
}

function matchWhere(row: Row, where: string, params: SqlValue[]): boolean {
  if (!where) return true;
  const clause = where.trim();

  const substr = /^substr\((\w+),\s*1,\s*7\)\s*=\s*(\?|'[^']*')$/i.exec(clause);
  if (substr) {
    const value = String(row[substr[1]] ?? '');
    return value.slice(0, 7) === String(readLiteral(substr[2], params) ?? '');
  }

  const eq = /^(\w+)\s*=\s*(\?|'[^']*'|-?\d+)$/i.exec(clause);
  if (eq) {
    return row[eq[1]] === readLiteral(eq[2], params);
  }

  return true;
}

function compareOrder(a: Row, b: Row, orderBy: string): number {
  const parts = orderBy.split(',').map((part) => part.trim());
  for (const part of parts) {
    const m = /^(?:e\.)?(\w+)(?:\s+(ASC|DESC))?$/i.exec(part);
    if (!m) continue;
    const cmp = String(a[m[1]] ?? '').localeCompare(String(b[m[1]] ?? ''), undefined, {
      numeric: true,
    });
    if (cmp !== 0) return m[2]?.toUpperCase() === 'DESC' ? -cmp : cmp;
  }
  return 0;
}

export type WebMemoryDatabase = {
  execAsync: (sql: string) => Promise<void>;
  runAsync: (
    sql: string,
    ...params: SqlValue[]
  ) => Promise<{ changes: number; lastInsertRowId: number }>;
  getFirstAsync: <T>(sql: string, ...params: SqlValue[]) => Promise<T | null>;
  getAllAsync: <T>(sql: string, ...params: SqlValue[]) => Promise<T[]>;
  closeAsync: () => Promise<void>;
};

export function canUseNativeWebSqlite(): boolean {
  return (
    typeof SharedArrayBuffer !== 'undefined' &&
    typeof crossOriginIsolated !== 'undefined' &&
    crossOriginIsolated === true
  );
}

export function createWebMemoryDb(): WebMemoryDatabase {
  let tables = loadTables();

  const persist = () => {
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(tables));
    } catch {
      // ignore quota / private mode
    }
  };

  const ensureTable = (name: string) => {
    if (!tables[name]) tables[name] = [];
  };

  const select = <T>(sql: string, paramsIn: SqlValue[]): T[] => {
    const s = normalizeSql(sql);
    const params = [...paramsIn];

    const countMatch = /^SELECT COUNT\(\*\) AS count FROM (\w+)(?: WHERE (.+))?$/i.exec(s);
    if (countMatch) {
      ensureTable(countMatch[1]);
      const n = tables[countMatch[1]].filter((row) =>
        matchWhere(row, countMatch[2] ?? '', [...params]),
      ).length;
      return [{ count: n } as T];
    }

    const sumMatch =
      /^SELECT SUM\((\w+)\) AS total FROM (\w+) WHERE substr\((\w+),\s*1,\s*7\)\s*=\s*\?$/i.exec(s);
    if (sumMatch) {
      const [, sumCol, table, dateCol] = sumMatch;
      ensureTable(table);
      const month = String(params.shift() ?? '');
      let total = 0;
      for (const row of tables[table]) {
        if (String(row[dateCol] ?? '').slice(0, 7) === month) {
          total += Number(row[sumCol] ?? 0);
        }
      }
      return [{ total } as T];
    }

    if (/FROM expenses e/i.test(s) && /INNER JOIN categories c/i.test(s)) {
      ensureTable('expenses');
      ensureTable('categories');
      const monthFilter = /WHERE substr\(e\.date,\s*1,\s*7\)\s*=\s*\?/i.test(s);
      const idFilter = /WHERE e\.id\s*=\s*\?/i.test(s);
      const grouped = /GROUP BY/i.test(s);
      const hasLimit = /LIMIT\s*\?/i.test(s);
      const month = monthFilter ? String(params.shift() ?? '') : null;
      const expenseId = idFilter ? params.shift() : null;
      const limit = hasLimit ? Number(params.shift() ?? 50) : null;
      const cats = new Map(tables.categories.map((c) => [String(c.id), c]));

      let joined: Row[] = tables.expenses
        .filter((e) => {
          if (month && String(e.date ?? '').slice(0, 7) !== month) return false;
          if (expenseId != null && e.id !== expenseId) return false;
          return cats.has(String(e.category_id));
        })
        .map((e) => {
          const c = cats.get(String(e.category_id))!;
          return {
            ...e,
            category_name: c.name,
            category_icon: c.icon,
            category_color: c.color,
          } as Row;
        });

      if (grouped) {
        const map = new Map<
          string,
          { category_id: string; category_name: string; category_color: string; total: number }
        >();
        for (const row of joined) {
          const key = String(row.category_id);
          const amount = Number(row.amount_minor ?? 0);
          const prev = map.get(key);
          if (prev) prev.total += amount;
          else {
            map.set(key, {
              category_id: key,
              category_name: String(row.category_name),
              category_color: String(row.category_color),
              total: amount,
            });
          }
        }
        return [...map.values()].sort((a, b) => b.total - a.total) as T[];
      }

      joined.sort((a, b) => compareOrder(a, b, 'date DESC, created_at DESC'));
      if (limit != null) joined = joined.slice(0, limit);
      return joined as T[];
    }

    const generic =
      /^SELECT (.+?) FROM (\w+)(?: WHERE (.+?))?(?: ORDER BY (.+?))?(?: LIMIT (.+))?$/i.exec(s);
    if (!generic) return [];

    const [, columnsRaw, table, where, orderBy, limitRaw] = generic;
    ensureTable(table);
    let rows = tables[table].filter((row) => matchWhere(row, where ?? '', params));

    if (orderBy) {
      rows = [...rows].sort((a, b) => compareOrder(a, b, orderBy));
    }

    if (limitRaw) {
      const lim = limitRaw.trim() === '?' ? Number(params.shift() ?? 50) : Number(limitRaw.trim());
      rows = rows.slice(0, lim);
    }

    if (columnsRaw.trim() === '*') return rows as T[];

    return rows.map((row) => {
      const out: Row = {};
      for (const col of columnsRaw.split(',').map((c) => c.trim())) {
        const asMatch = /^(\w+)\s+AS\s+(\w+)$/i.exec(col);
        if (asMatch) out[asMatch[2]] = row[asMatch[1]];
        else out[col] = row[col];
      }
      return out as T;
    });
  };

  const db: WebMemoryDatabase = {
    async execAsync(sql: string) {
      const statements = sql
        .split(';')
        .map((part) => normalizeSql(part))
        .filter(Boolean);

      for (const statement of statements) {
        if (/^PRAGMA\b/i.test(statement)) continue;
        if (/^CREATE\s+INDEX\b/i.test(statement)) continue;
        if (/^CREATE\s+TABLE\b/i.test(statement)) {
          const m = /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+(\w+)/i.exec(statement);
          if (m) ensureTable(m[1]);
          continue;
        }
        if (/^DELETE\s+FROM\s+(\w+)\s*$/i.test(statement)) {
          const table = /^DELETE\s+FROM\s+(\w+)\s*$/i.exec(statement)![1];
          ensureTable(table);
          tables[table] = [];
          continue;
        }
        await db.runAsync(statement);
      }
      persist();
    },

    async runAsync(sql: string, ...paramsIn: SqlValue[]) {
      const s = normalizeSql(sql);
      const params = [...paramsIn];

      if (
        /^INSERT INTO meta \(key, value\) VALUES \(\?, \?\) ON CONFLICT\(key\) DO UPDATE SET value = excluded\.value$/i.test(
          s,
        )
      ) {
        ensureTable('meta');
        const key = String(params.shift() ?? '');
        const value = String(params.shift() ?? '');
        const idx = tables.meta.findIndex((r) => r.key === key);
        if (idx >= 0) tables.meta[idx] = { key, value };
        else tables.meta.push({ key, value });
        persist();
        return { changes: 1, lastInsertRowId: 0 };
      }

      const insert = /^INSERT INTO (\w+) \(([^)]+)\) VALUES \(([^)]+)\)$/i.exec(s);
      if (insert) {
        const [, table, colsRaw, valsRaw] = insert;
        ensureTable(table);
        const cols = colsRaw.split(',').map((c) => c.trim());
        const vals = valsRaw.split(',').map((v) => v.trim());
        const row: Row = {};
        cols.forEach((col, i) => {
          row[col] = readLiteral(vals[i] ?? 'NULL', params);
        });
        tables[table].push(row);
        persist();
        return { changes: 1, lastInsertRowId: tables[table].length };
      }

      const update = /^UPDATE (\w+) SET (.+?) WHERE (.+)$/i.exec(s);
      if (update) {
        const [, table, setRaw, where] = update;
        ensureTable(table);
        const assignments = setRaw.split(',').map((a) => a.trim());
        const setPairs: { col: string; token: string }[] = [];
        for (const assignment of assignments) {
          const m = /^(\w+)\s*=\s*(\?|NULL|'[^']*'|-?\d+|excluded\.value)$/i.exec(assignment);
          if (m) setPairs.push({ col: m[1], token: m[2] });
        }

        // Bind SET params first (shared values), then WHERE uses remaining.
        const setValues = setPairs.map(({ col, token }) => ({
          col,
          value: readLiteral(token, params),
        }));
        const whereParams = [...params];
        let changes = 0;
        tables[table] = tables[table].map((row) => {
          if (!matchWhere(row, where, [...whereParams])) return row;
          const next = { ...row };
          for (const { col, value } of setValues) next[col] = value;
          changes += 1;
          return next;
        });
        persist();
        return { changes, lastInsertRowId: 0 };
      }

      const del = /^DELETE FROM (\w+)(?: WHERE (.+))?$/i.exec(s);
      if (del) {
        const [, table, where] = del;
        ensureTable(table);
        const before = tables[table].length;
        if (!where) tables[table] = [];
        else {
          const whereParams = [...params];
          tables[table] = tables[table].filter((row) => !matchWhere(row, where, [...whereParams]));
        }
        persist();
        return { changes: before - tables[table].length, lastInsertRowId: 0 };
      }

      return { changes: 0, lastInsertRowId: 0 };
    },

    async getFirstAsync<T>(sql: string, ...params: SqlValue[]) {
      const rows = select<T>(sql, params);
      return rows[0] ?? null;
    },

    async getAllAsync<T>(sql: string, ...params: SqlValue[]) {
      return select<T>(sql, params);
    },

    async closeAsync() {
      persist();
    },
  };

  return db;
}
