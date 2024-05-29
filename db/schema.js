
/**
 * Represents the schema configuration for a database table.
 * @typedef {Object} TableSchema
 * @property {string} tableName - The name of the table.
 * @property {string} [dbSchema='public'] - The schema of the table (default is 'public').
 * @property {boolean} [timeStamps=true] - Whether to add timestamp columns to the table (default is true).
 * @property {Object.<string, ColumnConfig>} columns - The columns of the table. See {@link ColumnConfig}.
 * @property {Object.<string, ConstraintConfig>} [constraints] - The constraints of the table. See {@link ConstraintConfig}.
 * @property {Object.<string, ForeignKeyConfig>} [foreignKeys] - The foreign keys of the table. See {@link ForeignKeyConfig}. Use {@link ConstraintConfig} instead.
 * @property {Object.<string, UniqueConstraint>} [uniqueConstraints] - The unique constraints of the table. See {@link UniqueConstraint}. Use {@link ConstraintConfig} instead.
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
 * Represents the configuration for a column in a database table.
 * @typedef {Object} ColumnConfig
 * @property {string} type - The data type of the column.
 * @property {boolean} [primaryKey=false] - Indicates whether the column is a primary key.
 * @property {boolean} [nullable=true] - Indicates whether the column allows null values.
 * @property {*} [default] - The default value of the column.
 */

/**
 * Represents the configuration for a foreign key in a database table. Use {@link ConstraintConfig} instead.
 * @typedef {Object} ForeignKeyConfig
 * @property {string} referenceTable - The name of the referenced table.
 * @property {string[]} referenceColumns - The name(s) of the referenced column(s) in the referenced table.
 * @property {("CASCADE"|"SET NULL"|"RESTRICT")} [onDelete="CASCADE"] - The action to take on deletion of the referenced row.
 * @property {("CASCADE"|"SET NULL"|"RESTRICT")} [onUpdate="CASCADE"] - The action to take on update of the referenced row.
 */

/**
 * Represents the configuration for a unique constraint in a database table. Use {@link ConstraintConfig} instead.
 * @typedef {Object} UniqueConstraint
 * @property {string[]} columns - The column(s) that make up the unique constraint.
 */

/**
 * Represents the configuration for a constraint in a database table.
 * @typedef {Object} ConstraintConfig
 * @property {string} constraint_name - The identifier of the constraint.
 * @property {string} constraint_sql - The SQL statement that defines the constraint.
 */

 
// Example usage:
// const tableSchema = {
//   tableName: 'example_table',
//   timeStamps: true, // Add time stamps to table - default is true
//   columns: {
//     id: { type: 'serial', primaryKey: true },
//     name: { type: 'varchar(255)', nullable: false },
//     age: { type: 'int', nullable: true, default: 18 },
//     // Add more columns as needed
//     department_id: { type: 'int', nullable: false }, // Example foreign key column
//     // Add more foreign key columns as needed
//     manager_id: { type: 'int', nullable: false }, // Example additional foreign key column
//   },
//   foreignKeys: {
//     department_id: {
//       // Example foreign key definition for department_id
//       referenceTable: 'departments', // Referenced table name
//       referenceColumns: ['id'], // Referenced column(s) name in the departments table
//       onDelete: 'CASCADE', // Cascade deletion
//       onUpdate: 'CASCADE', // Cascade update
//     },
//     manager_id: {
//       // Example foreign key definition for manager_id
//       referenceTable: 'employees', // Referenced table name
//       referenceColumns: ['id'], // Referenced column(s) name in the employees table
//       onDelete: 'SET NULL', // Set manager_id to NULL on deletion of referenced employee
//       onUpdate: 'CASCADE', // Cascade update
//     },
//     // Add more foreign keys as needed
//   },
//   constraints: { 
//     chk_owner_type: "owner_type IN ('employee', 'vendor')",
//     fk_employee_id: "FOREIGN KEY (owner_id) REFERENCES employees(id) ON DELETE CASCADE",
//     fk_vendor_id: "FOREIGN KEY (owner_id) REFERENCES vendors(id) ON DELETE CASCADE",
//   },
//   uniqueConstraints: {
//     unique_name: { columns: ['name', 'age'] }, // Example unique constraint for name column
//     // Add more unique constraints as needed
//   },
// };
