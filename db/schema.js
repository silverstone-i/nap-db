// ./db/schema.js
'use strict';

/**
 * Represents the schema configuration for a database table.
 * @typedef {Object} TableSchema
 * @property {string} tableName - The name of the table.
 * @property {boolean} [timeStamps=true] - Whether to add timestamp columns to the table (default is true).
 * @property {Object.<string, ColumnConfig>} columns - The columns of the table.
 * @property {Object.<string, ForeignKeyConfig>} [foreignKeys] - The foreign keys of the table.
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
 * Represents the configuration for a foreign key in a database table.
 * @typedef {Object} ForeignKeyConfig
 * @property {string} referenceTable - The name of the referenced table.
 * @property {string[]} referenceColumns - The name(s) of the referenced column(s) in the referenced table.
 * @property {("CASCADE"|"SET NULL"|"RESTRICT")} [onDelete="CASCADE"] - The action to take on deletion of the referenced row.
 * @property {("CASCADE"|"SET NULL"|"RESTRICT")} [onUpdate="CASCADE"] - The action to take on update of the referenced row.
 */

// Example usage:
const tableSchema = {
    tableName: 'example_table',
    timeStamps: true, // Add time stamps to table - default is true
    columns: {
        id: { type: 'serial', primaryKey: true },
        name: { type: 'varchar(255)', nullable: false },
        age: { type: 'int', nullable: true, default: 18 },
        // Add more columns as needed
        department_id: { type: 'int', nullable: false }, // Example foreign key column
        // Add more foreign key columns as needed
        manager_id: { type: 'int', nullable: false } // Example additional foreign key column
    },
    foreignKeys: {
        department_id: { // Example foreign key definition for department_id
            referenceTable: 'departments', // Referenced table name
            referenceColumns: ['id'], // Referenced column(s) name in the departments table
            onDelete: 'CASCADE', // Cascade deletion
            onUpdate: 'CASCADE' // Cascade update
        },
        manager_id: { // Example foreign key definition for manager_id
            referenceTable: 'employees', // Referenced table name
            referenceColumns: ['id'], // Referenced column(s) name in the employees table
            onDelete: 'SET NULL', // Set manager_id to NULL on deletion of referenced employee
            onUpdate: 'CASCADE' // Cascade update
        }
        // Add more foreign keys as needed
    }
};

/**
 * Generates SQL code to create a table based on the provided schema.
 * @param {TableSchema} tableSchema - The schema configuration for the table.
 * @returns {string} - The SQL code to create the table.
 */
function generateCreateTableSQL(tableSchema) {
    let sql = `CREATE TABLE ${tableSchema.tableName} (\n`;

    // Add columns
    Object.entries(tableSchema.columns).forEach(([columnName, columnConfig]) => {
        sql += `  ${columnName} ${columnConfig.type}`;

        // Add primary key constraint if primaryKey is true
        if (columnConfig.primaryKey) {
            sql += ' PRIMARY KEY';
        }

        // Add nullable constraint if nullable is false
        if (!columnConfig.nullable) {
            sql += ' NOT NULL';
        }

        // Add default value if specified
        if (columnConfig.default !== undefined) {
            sql += ` DEFAULT ${columnConfig.default}`;
        }

        sql += ',\n';
    });

    // Add timestamps columns if timeStamps is true
    if (tableSchema.timeStamps) {
        sql += `  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,\n`;
        sql += `  created_by VARCHAR(50) NOT NULL,\n`;
        sql += `  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,\n`;
        sql += `  updated_by VARCHAR(50) DEFAULT NULL,\n`;
    }

    // Add foreign key constraints
    if (tableSchema.foreignKeys) {
        Object.entries(tableSchema.foreignKeys).forEach(([columnName, foreignKeyConfig]) => {
            sql += `  FOREIGN KEY (${columnName}) REFERENCES ${foreignKeyConfig.referenceTable} (${foreignKeyConfig.referenceColumns.join(', ')})`;
            if (foreignKeyConfig.onDelete) {
                sql += ` ON DELETE ${foreignKeyConfig.onDelete}`;
            }
            if (foreignKeyConfig.onUpdate) {
                sql += ` ON UPDATE ${foreignKeyConfig.onUpdate}`;
            }
            sql += ',\n';
        });
    }

    // Remove the trailing comma and add closing parenthesis
    sql = sql.slice(0, -2) + '\n);';

    return sql;
}

// Example usage:
const tableSQL = generateCreateTableSQL(tableSchema);
console.log(tableSQL);