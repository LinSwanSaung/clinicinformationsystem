import { Pool } from 'pg';

const identifierPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

const fkTargets = {
  patient_id: 'patients',
  doctor_id: 'users',
  created_by: 'users',
  completed_by: 'users',
  cancelled_by: 'users',
  received_by: 'users',
  processed_by: 'users',
  recorded_by: 'users',
  diagnosed_by: 'users',
  verified_by: 'users',
  discontinued_by: 'users',
  uploaded_by: 'users',
  user_id: 'users',
  added_by: 'users',
  appointment_id: 'appointments',
  visit_id: 'visits',
  invoice_id: 'invoices',
  doctor_note_id: 'doctor_notes',
};

const relationSources = {
  appointments: { patients: 'patient_id', users: 'doctor_id' },
  audit_logs: { users: 'user_id' },
  doctor_availability: { users: 'doctor_id' },
  doctor_notes: { patients: 'patient_id', users: 'doctor_id', visits: 'visit_id' },
  invoices: { patients: 'patient_id', visits: 'visit_id' },
  payment_transactions: { invoices: 'invoice_id', users: 'received_by' },
  prescriptions: {
    patients: 'patient_id',
    users: 'doctor_id',
    visits: 'visit_id',
    doctor_notes: 'doctor_note_id',
  },
  queue_tokens: {
    patients: 'patient_id',
    users: 'doctor_id',
    appointments: 'appointment_id',
    visits: 'visit_id',
  },
  users: { patients: 'patient_id' },
  visits: { patients: 'patient_id', users: 'doctor_id', appointments: 'appointment_id' },
  vitals: { patients: 'patient_id', users: 'recorded_by', visits: 'visit_id' },
};

const singular = (table) => {
  if (table.endsWith('ies')) {
    return `${table.slice(0, -3)}y`;
  }
  if (table.endsWith('s')) {
    return table.slice(0, -1);
  }
  return table;
};

const quoteIdent = (value) => {
  if (!identifierPattern.test(value)) {
    throw new Error(`Invalid SQL identifier: ${value}`);
  }
  return `"${value}"`;
};

const splitTopLevel = (value = '') => {
  const parts = [];
  let depth = 0;
  let current = '';

  for (const char of value) {
    if (char === '(') {
      depth += 1;
    }
    if (char === ')') {
      depth -= 1;
    }

    if (char === ',' && depth === 0) {
      if (current.trim()) {
        parts.push(current.trim());
      }
      current = '';
      continue;
    }
    current += char;
  }

  if (current.trim()) {
    parts.push(current.trim());
  }
  return parts;
};

const normalizeSelect = (select = '*') =>
  String(select || '*')
    .replace(/\s+/g, ' ')
    .trim();

const parseRelation = (part) => {
  const openIndex = part.indexOf('(');
  if (openIndex < 0) {
    return null;
  }

  const relationSpec = part.slice(0, openIndex).trim();
  const inner = part.slice(openIndex + 1, part.lastIndexOf(')')).trim();
  let outputKey;
  let tableSpec;

  if (relationSpec.includes(':')) {
    const [alias, spec] = relationSpec.split(':');
    outputKey = alias.trim();
    tableSpec = spec.trim();
  } else {
    tableSpec = relationSpec;
  }

  let [target, hint] = tableSpec.split('!');
  target = target.trim();
  hint = hint?.trim();

  if (!outputKey) {
    outputKey = target;
  }

  if (fkTargets[target]) {
    hint = target;
    target = fkTargets[target];
  }

  return {
    outputKey,
    target,
    hint,
    parsedSelect: parseSelect(inner || '*'),
  };
};

const parseSelect = (select = '*') => {
  const parts = splitTopLevel(normalizeSelect(select));
  const columns = [];
  const relations = [];

  for (const part of parts) {
    const relation = parseRelation(part);
    if (relation) {
      relations.push(relation);
    } else if (part && part !== '*') {
      columns.push(part);
    } else {
      columns.push('*');
    }
  }

  return { columns, relations };
};

const parseConstraintHint = (hint) => {
  if (!hint || hint === 'inner' || hint === 'left') {
    return null;
  }
  const match = hint.match(/^[a-z_]+_(.+)_fkey$/i);
  return match?.[1] || hint;
};

const makeDbError = (error) => ({
  message: error.message,
  code: error.code,
  details: error.detail,
  hint: error.hint,
});

const normalizeValue = (value) => {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value;
};

class PostgresQueryBuilder {
  constructor(client, table) {
    this.client = client;
    this.table = table;
    this.operation = 'select';
    this.selectArg = '*';
    this.selectOptions = {};
    this.filters = [];
    this.orders = [];
    this.limitValue = null;
    this.rangeValue = null;
    this.singleMode = null;
    this.mutationPayload = null;
    this.shouldReturnRows = false;
  }

  select(select = '*', options = {}) {
    this.selectArg = select || '*';
    this.selectOptions = options || {};
    if (this.operation !== 'select') {
      this.shouldReturnRows = true;
    }
    return this;
  }

  insert(payload) {
    this.operation = 'insert';
    this.mutationPayload = Array.isArray(payload) ? payload : [payload];
    return this;
  }

  update(payload) {
    this.operation = 'update';
    this.mutationPayload = payload;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  eq(column, value) {
    this.filters.push({ column, operator: '=', value });
    return this;
  }

  neq(column, value) {
    this.filters.push({ column, operator: '<>', value });
    return this;
  }

  gt(column, value) {
    this.filters.push({ column, operator: '>', value });
    return this;
  }

  gte(column, value) {
    this.filters.push({ column, operator: '>=', value });
    return this;
  }

  lt(column, value) {
    this.filters.push({ column, operator: '<', value });
    return this;
  }

  lte(column, value) {
    this.filters.push({ column, operator: '<=', value });
    return this;
  }

  like(column, value) {
    this.filters.push({ column, operator: 'LIKE', value });
    return this;
  }

  ilike(column, value) {
    this.filters.push({ column, operator: 'ILIKE', value });
    return this;
  }

  in(column, value) {
    this.filters.push({ column, operator: 'IN', value });
    return this;
  }

  is(column, value) {
    this.filters.push({ column, operator: 'IS', value });
    return this;
  }

  not(column, operator, value) {
    this.filters.push({ column, operator: `NOT ${operator.toUpperCase()}`, value });
    return this;
  }

  or(expression) {
    this.filters.push({ operator: 'OR', expression });
    return this;
  }

  order(column, options = {}) {
    this.orders.push({ column, ascending: options.ascending !== false });
    return this;
  }

  limit(value) {
    this.limitValue = value;
    return this;
  }

  range(from, to) {
    this.rangeValue = { from, to };
    return this;
  }

  single() {
    this.singleMode = 'single';
    return this.execute();
  }

  maybeSingle() {
    this.singleMode = 'maybeSingle';
    return this.execute();
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }

  catch(reject) {
    return this.execute().catch(reject);
  }

  async execute() {
    try {
      if (this.operation === 'insert') {
        return await this.executeInsert();
      }
      if (this.operation === 'update') {
        return await this.executeUpdate();
      }
      if (this.operation === 'delete') {
        return await this.executeDelete();
      }
      return await this.executeSelect();
    } catch (error) {
      return { data: null, error: makeDbError(error), count: null };
    }
  }

  buildWhere(params, baseAlias = 't') {
    const clauses = [];

    for (const filter of this.filters) {
      if (filter.operator === 'OR') {
        clauses.push(this.buildOrClause(filter.expression, params, baseAlias));
        continue;
      }

      const clause = this.buildFilterClause(filter, params, baseAlias);
      if (clause) {
        clauses.push(clause);
      }
    }

    return clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  }

  buildFilterClause(filter, params, baseAlias) {
    const columnPath = filter.column.split('.');
    if (columnPath.length > 1) {
      return this.buildRelationFilter(columnPath[0], columnPath.slice(1).join('.'), filter, params);
    }

    const column = `${baseAlias}.${quoteIdent(filter.column)}`;
    return this.operatorClause(column, filter.operator, filter.value, params);
  }

  buildRelationFilter(relationName, relationColumn, filter, params) {
    const relation = {
      outputKey: relationName,
      target: `${relationName}s`,
      hint: null,
    };
    const join = this.inferJoin({}, this.table, relation);
    if (!join) {
      return 'TRUE';
    }

    const column = `r.${quoteIdent(relationColumn)}`;
    const clause = this.operatorClause(column, filter.operator, filter.value, params);
    if (!clause) {
      return 'TRUE';
    }

    if (join.type === 'direct') {
      return `EXISTS (SELECT 1 FROM ${quoteIdent(join.target)} r WHERE r.id = t.${quoteIdent(join.sourceColumn)} AND ${clause})`;
    }
    return `EXISTS (SELECT 1 FROM ${quoteIdent(join.target)} r WHERE r.${quoteIdent(join.targetColumn)} = t.id AND ${clause})`;
  }

  operatorClause(columnSql, operator, value, params) {
    const normalizedOperator = operator.toUpperCase();

    if (normalizedOperator === 'IS') {
      if (value === null) {
        return `${columnSql} IS NULL`;
      }
      return `${columnSql} IS ${value}`;
    }

    if (normalizedOperator === 'NOT IS') {
      if (value === null) {
        return `${columnSql} IS NOT NULL`;
      }
      return `${columnSql} IS NOT ${value}`;
    }

    if (normalizedOperator === 'IN' || normalizedOperator === 'NOT IN') {
      const values = Array.isArray(value)
        ? value
        : String(value || '')
            .replace(/^\(|\)$/g, '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
      if (!values.length) {
        return normalizedOperator === 'IN' ? 'FALSE' : 'TRUE';
      }
      const placeholders = values.map((item) => {
        params.push(normalizeValue(item));
        return `$${params.length}`;
      });
      return `${columnSql} ${normalizedOperator} (${placeholders.join(', ')})`;
    }

    params.push(normalizeValue(value));
    return `${columnSql} ${operator} $${params.length}`;
  }

  buildOrClause(expression, params, baseAlias) {
    const clauses = splitTopLevel(expression).map((part) => {
      const [column, operator, ...rest] = part.split('.');
      const value = rest.join('.');
      const opMap = {
        eq: '=',
        neq: '<>',
        gt: '>',
        gte: '>=',
        lt: '<',
        lte: '<=',
        like: 'LIKE',
        ilike: 'ILIKE',
      };
      return this.operatorClause(
        `${baseAlias}.${quoteIdent(column)}`,
        opMap[operator] || '=',
        value,
        params
      );
    });
    return `(${clauses.join(' OR ')})`;
  }

  selectedColumns() {
    const parsed = parseSelect(this.selectArg);
    if (parsed.columns.includes('*') || parsed.columns.length === 0) {
      return { sql: 't.*', parsed };
    }

    const neededColumns = [...parsed.columns];
    for (const relation of parsed.relations) {
      const sourceColumn = this.resolveDirectSourceColumn(this.table, relation);
      if (sourceColumn && !neededColumns.includes(sourceColumn)) {
        neededColumns.push(sourceColumn);
      }
    }

    const columns = neededColumns.map((column) => {
      const cleanColumn = column.trim();
      if (cleanColumn.includes(':')) {
        const [alias, source] = cleanColumn.split(':').map((part) => part.trim());
        return `t.${quoteIdent(source)} AS ${quoteIdent(alias)}`;
      }
      return `t.${quoteIdent(cleanColumn)}`;
    });

    return { sql: columns.join(', '), parsed };
  }

  async executeSelect() {
    const params = [];
    const { sql: columnSql, parsed } = this.selectedColumns();
    const where = this.buildWhere(params);
    const order = this.orders.length
      ? `ORDER BY ${this.orders
          .flatMap((item) =>
            String(item.column)
              .split(',')
              .map((column) => column.trim())
              .filter(Boolean)
              .map((column) => `t.${quoteIdent(column)} ${item.ascending ? 'ASC' : 'DESC'}`)
          )
          .join(', ')}`
      : '';

    let limit = '';
    if (this.rangeValue) {
      const rowCount = this.rangeValue.to - this.rangeValue.from + 1;
      limit = `LIMIT ${Number(rowCount)} OFFSET ${Number(this.rangeValue.from)}`;
    } else if (this.limitValue !== null) {
      limit = `LIMIT ${Number(this.limitValue)}`;
    }

    if (this.selectOptions.head) {
      const countResult = await this.client.query(
        `SELECT COUNT(*)::int AS count FROM ${quoteIdent(this.table)} t ${where}`,
        params
      );
      return { data: null, error: null, count: countResult.rows[0]?.count ?? 0 };
    }

    const result = await this.client.query(
      `SELECT ${columnSql} FROM ${quoteIdent(this.table)} t ${where} ${order} ${limit}`,
      params
    );

    let data = result.rows;
    if (parsed.relations.length) {
      data = await this.hydrateRows(data, this.table, parsed.relations);
    }

    if (this.singleMode) {
      if (data.length === 0 && this.singleMode === 'maybeSingle') {
        return { data: null, error: null, count: null };
      }
      if (data.length === 0 && this.singleMode === 'single') {
        return {
          data: null,
          error: {
            message: 'JSON object requested, multiple (or no) rows returned',
            code: 'PGRST116',
          },
          count: null,
        };
      }
      if (data.length > 1 && this.singleMode === 'single') {
        return {
          data: null,
          error: {
            message: 'JSON object requested, multiple (or no) rows returned',
            code: 'PGRST116',
          },
          count: null,
        };
      }
      return { data: data[0] || null, error: null, count: null };
    }

    let count = null;
    if (this.selectOptions.count) {
      const countResult = await this.client.query(
        `SELECT COUNT(*)::int AS count FROM ${quoteIdent(this.table)} t ${where}`,
        params
      );
      count = countResult.rows[0]?.count ?? 0;
    }

    return { data, error: null, count };
  }

  async executeInsert() {
    if (!this.mutationPayload.length) {
      return { data: [], error: null, count: 0 };
    }

    const params = [];
    const columns = Object.keys(this.mutationPayload[0]);
    const values = this.mutationPayload.map((row) => {
      const placeholders = columns.map((column) => {
        params.push(normalizeValue(row[column]));
        return `$${params.length}`;
      });
      return `(${placeholders.join(', ')})`;
    });

    const returning = this.shouldReturnRows ? 'RETURNING *' : '';
    const result = await this.client.query(
      `INSERT INTO ${quoteIdent(this.table)} (${columns.map(quoteIdent).join(', ')}) VALUES ${values.join(', ')} ${returning}`,
      params
    );
    return this.formatMutationResult(result.rows);
  }

  async executeUpdate() {
    const params = [];
    const columns = Object.keys(this.mutationPayload || {});
    const assignments = columns.map((column) => {
      params.push(normalizeValue(this.mutationPayload[column]));
      return `${quoteIdent(column)} = $${params.length}`;
    });
    const where = this.buildWhere(params);
    const returning = this.shouldReturnRows ? 'RETURNING *' : '';
    const result = await this.client.query(
      `UPDATE ${quoteIdent(this.table)} AS t SET ${assignments.join(', ')} ${where} ${returning}`,
      params
    );
    return this.formatMutationResult(result.rows);
  }

  async executeDelete() {
    const params = [];
    const where = this.buildWhere(params);
    const result = await this.client.query(
      `DELETE FROM ${quoteIdent(this.table)} t ${where}`,
      params
    );
    return { data: null, error: null, count: result.rowCount };
  }

  async formatMutationResult(rows) {
    let data = rows;
    const parsed = parseSelect(this.selectArg);
    if (data.length && parsed.relations.length) {
      data = await this.hydrateRows(data, this.table, parsed.relations);
    }
    if (this.singleMode) {
      return { data: data[0] || null, error: null, count: null };
    }
    return { data, error: null, count: null };
  }

  inferJoin(row, baseTable, relation) {
    let hint = parseConstraintHint(relation.hint);
    if (hint === 'inner' || hint === 'left') {
      hint = null;
    }

    if (hint && fkTargets[hint]) {
      return { type: 'direct', sourceColumn: hint, target: fkTargets[hint] };
    }

    const mappedSource = this.resolveDirectSourceColumn(baseTable, relation);
    if (mappedSource) {
      return { type: 'direct', sourceColumn: mappedSource, target: relation.target };
    }

    const directCandidates = [
      hint,
      `${singular(relation.target)}_id`,
      `${singular(relation.outputKey)}_id`,
      relation.outputKey,
    ].filter(Boolean);

    for (const candidate of directCandidates) {
      if (fkTargets[candidate] || Object.prototype.hasOwnProperty.call(row, candidate)) {
        return { type: 'direct', sourceColumn: candidate, target: relation.target };
      }
    }

    return {
      type: 'reverse',
      target: relation.target,
      targetColumn: `${singular(baseTable)}_id`,
    };
  }

  resolveDirectSourceColumn(baseTable, relation) {
    const hint = parseConstraintHint(relation.hint);
    if (hint && fkTargets[hint]) {
      return hint;
    }
    return relationSources[baseTable]?.[relation.target] || null;
  }

  async hydrateRows(rows, baseTable, relations) {
    if (!rows.length) {
      return rows;
    }

    for (const relation of relations) {
      const join = this.inferJoin(rows[0], baseTable, relation);
      if (!join) {
        continue;
      }

      if (join.type === 'direct') {
        await this.hydrateDirect(rows, relation, join);
      } else {
        await this.hydrateReverse(rows, relation, join, baseTable);
      }
    }

    return rows;
  }

  async hydrateDirect(rows, relation, join) {
    const ids = [...new Set(rows.map((row) => row[join.sourceColumn]).filter(Boolean))];
    if (!ids.length) {
      rows.forEach((row) => {
        row[relation.outputKey] = null;
      });
      return;
    }

    const query = new PostgresQueryBuilder(this.client, join.target)
      .select(this.selectFromParsed(relation.parsedSelect, ['id']))
      .in('id', ids);
    const { data, error } = await query.execute();
    if (error) {
      throw new Error(error.message);
    }
    const map = new Map((data || []).map((record) => [record.id, record]));
    rows.forEach((row) => {
      row[relation.outputKey] = map.get(row[join.sourceColumn]) || null;
    });
  }

  async hydrateReverse(rows, relation, join) {
    const ids = [...new Set(rows.map((row) => row.id).filter(Boolean))];
    if (!ids.length) {
      rows.forEach((row) => {
        row[relation.outputKey] = [];
      });
      return;
    }

    const query = new PostgresQueryBuilder(this.client, join.target)
      .select(this.selectFromParsed(relation.parsedSelect, [join.targetColumn]))
      .in(join.targetColumn, ids);
    const { data, error } = await query.execute();
    if (error) {
      throw new Error(error.message);
    }
    const grouped = new Map();
    for (const record of data || []) {
      const key = record[join.targetColumn];
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(record);
    }
    rows.forEach((row) => {
      row[relation.outputKey] = grouped.get(row.id) || [];
    });
  }

  selectFromParsed(parsed, requiredColumns = []) {
    const columns = [...parsed.columns];
    if (!columns.includes('*')) {
      for (const requiredColumn of requiredColumns) {
        if (!columns.includes(requiredColumn)) {
          columns.unshift(requiredColumn);
        }
      }
    }
    const columnSelect = columns.length ? columns.join(', ') : '*';
    const relations = parsed.relations
      .map(
        (relation) =>
          `${relation.outputKey}:${relation.target}${relation.hint ? `!${relation.hint}` : ''}(${this.selectFromParsed(relation.parsedSelect)})`
      )
      .join(', ');
    return [columnSelect, relations].filter(Boolean).join(', ');
  }
}

export class PostgresSupabaseCompatClient {
  constructor(pool) {
    this.pool = pool;
  }

  from(table) {
    return new PostgresQueryBuilder(this.pool, table);
  }

  async rpc(functionName, params = {}) {
    try {
      if (
        functionName === 'get_doctor_availability_12hr' &&
        Object.keys(params || {}).length === 0
      ) {
        const result = await this.pool.query(`
          SELECT
            da.id,
            da.doctor_id,
            da.day_of_week,
            to_char(da.start_time, 'HH12:MI AM') AS start_time_12hr,
            to_char(da.end_time, 'HH12:MI AM') AS end_time_12hr,
            da.start_time AS start_time_24hr,
            da.end_time AS end_time_24hr,
            da.is_active
          FROM doctor_availability da
          ORDER BY
            CASE da.day_of_week
              WHEN 'Monday' THEN 1
              WHEN 'Tuesday' THEN 2
              WHEN 'Wednesday' THEN 3
              WHEN 'Thursday' THEN 4
              WHEN 'Friday' THEN 5
              WHEN 'Saturday' THEN 6
              WHEN 'Sunday' THEN 7
              ELSE 8
            END,
            da.start_time
        `);
        return { data: result.rows, error: null };
      }

      const keys = Object.keys(params || {});
      const values = keys.map((key) => normalizeValue(params[key]));
      const placeholders = keys
        .map((key, index) => `${quoteIdent(key)} => $${index + 1}`)
        .join(', ');
      const result = await this.pool.query(
        `SELECT * FROM ${quoteIdent(functionName)}(${placeholders})`,
        values
      );
      if (
        result.fields.length === 1 &&
        result.rows.length === 1 &&
        Object.prototype.hasOwnProperty.call(result.rows[0], functionName)
      ) {
        return { data: result.rows[0][functionName], error: null };
      }
      return { data: result.rows, error: null };
    } catch (error) {
      return { data: null, error: makeDbError(error) };
    }
  }
}

export const createPostgresClient = (databaseUrl) => {
  const pool = new Pool({
    connectionString: databaseUrl,
    max: Number(process.env.DB_POOL_MAX || 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  return {
    pool,
    client: new PostgresSupabaseCompatClient(pool),
  };
};
