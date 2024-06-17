'./db/schema.js';

/*
 *
 * Copyright © 2024-present, Ian Silverstone
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

/**
 * @typedef {Object} ColumnConfig
 * @property {string} type - Data type of the column (e.g., 'VARCHAR(100)', 'INT', 'TIMESTAMP').
 * @property {boolean} [primaryKey=false] - Indicates if the column is a primary key.
 * @property {boolean} [nullable=true] - Indicates if the column allows NULL values.
 * @property {*} [default] - Default value for the column.
 * @property {string} [generated] - Expression for a generated column (e.g., 'GENERATED ALWAYS AS (expression) STORED').
 * @property {boolean} [unique=false] - Indicates if the column has a unique constraint.
 * @property {string} [references] - References table and column for a foreign key (e.g., 'other_table(other_column)').
 * @property {string} [onDelete] - Action to take on delete (e.g., 'CASCADE', 'SET NULL').
 * @property {string} [onUpdate] - Action to take on update (e.g., 'CASCADE', 'RESTRICT').
 * @property {string} [check] - CHECK constraint condition.
 * @property {string} [collate] - Collation to use for the column.
 * @property {string} [comment] - Comment for the column.
 * @property {string} [constraint] - Additional constraints for the column.
 * @property {string} [index] - Defines an index on the column.
 */

/**
 * @typedef {Object} IndexConfig
 * @property {boolean} [unique=false] - Indicates if the index is unique.
 * @property {string} config - Configuration for the index (e.g., 'table(column)').
 */

/**
 * @typedef {Object.<string, string>} ConstraintsConfig
 * An object representing additional constraints on the table. Each key is the constraint name, and the value is the constraint definition.
 *
 * @example
 * const schema = {
 *   tableName: 'vendor_addresses',
 *   columns: {
 *     vendor_id: { type: 'uuid' },
 *     address_id: { type: 'uuid' },
 *   },
 *   constraints: {
 *     pk_vendor_address: 'PRIMARY KEY (vendor_id, address_id)',
 *     fk_vendor_id: 'FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE',
 *     fk_address_id: 'FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE CASCADE',
 *   },
 * };
 */

/**
 * @typedef {Object} Schema
 * @property {string} tableName - The name of the table.
 * @property {string} [dbSchema='public'] - The schema of the table.
 * @property {boolean} [timeStamps=true] - Indicates if the table should include timestamp columns (created_at, created_by, updated_at, updated_by).
 * @property {Object.<string, ColumnConfig>} columns - Definitions for the columns in the table.
 * @property {ConstraintsConfig} [constraints] - Additional constraints on the table.
 * @property {Object.<string, IndexConfig>} [indexes] - Definitions for the indexes on the table.
 */
 
