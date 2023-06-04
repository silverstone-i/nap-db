/* eslint-disable no-unused-vars */
// ./admin/service/table-schema.ts

/**
 * @typedef {Object} Column
 * @property {!string} name - The name of the column.
 * @property {!string} type - The data type of the column. Must be 'char' for length to be required.
 * @property {number} [length] - The length of the column (required if type is 'char').
 * @property {boolean} [unique] - Indicates whether the column values must be unique.
 * @property {boolean} [notNull] - Indicates whether the column can have null values.
 * @property {string} [default] - The default value for the column.
 * @property {boolean} [useDefault] - Indicates whether to use the default value for the column.
 * @deprecated {boolean} [primary] - [DEPRECATED for versions > v0.3.0] Indicates whether the column is a primary key.
 */

/**
 * @typedef {Object} ForeignKey
 * @property {Object[]} hasRelations - The relations associated with the foreign key.
 * @property {string} hasRelations[].name - The name of a relation associated with the foreign key.
 * @property {Object[]} withColumns - The columns associated with the foreign key.
 * @property {string} withColumns[].name - The name of a column associated with the foreign key.
 * @property {string} withTable - The name of the table referenced by the foreign key.
 * @property {string} onDeleteAction - The action to perform on deletion of a referenced row.
 * @property {string} onUpdateAction - The action to perform on updating a referenced row.
 */

/**
 * @typedef {Object} PrimaryKey
 * @property {string} name - The name of the primary key.
 */

/**
 * @typedef {Array<PrimaryKey>} PrimaryKeys
 */

/** @type {PrimaryKeys} */
const primaryKeys = [
    {
      name: 'company_id',
    },
    {
      name: 'account_id',
    },
  ];
  
/**
 * @typedef {Object} DataSchema
 * @property {string} tableName - The name of the table.
 * @property {string} [dbSchema] - The name of the database schema.
 * @property {boolean} [timeStamps] - Indicates whether to include timestamps in the table.
 * @property {boolean} [useCS] - Indicates whether to use case sensitivity.
 * @property {Column[]} columns - The columns of the table.
 * @property {PrimaryKey[]} primaryKeys - The primary keys of the table.
 * @property {ForeignKey[]} [foreignKeys] - The foreign keys of the table.
 * @example
 * ...
 *  const dataSchema = {
 *      tableName: 'string',
 *      dbSchema: 'string',
 *      timeStamps: true,
 *      useCS: true,
 *      columns: [
 *          {
 *              name: 'string',
 *              type: 'string',
 *              length: 10,
 *              unique: false,
 *              notNull: true,
 *              default: 'default value',
 *              useDefault: true,
 *          },
 *      ],
 *      primaryKeys: [{ name: 'column1' }, { name: 'column2' }],
 *      foreignKeys: [
 *          {
 *              hasRelations: [{ name: 'relation1' }, { name: 'relation2' }],
 *              withColumns: [{ name: 'column1' }, { name: 'column2' }],
 *              withTable: 'relatedTable',
 *              onDeleteAction: 'action1',
 *              onUpdateAction: 'action2',
 *          },
 *      ],
 *  };
 * ...
 */

/**
 * @type {DataSchema}
 */
const dataSchema = {
    tableName: 'string',
    dbSchema: 'string',
    timeStamps: true,
    useCS: true,
    columns: [
        {
            name: 'string',
            type: 'string',
            length: 10,
            unique: false,
            notNull: true,
            default: 'default value',
            useDefault: true,
        },
    ],
    primaryKeys: [{ name: 'column1' }, { name: 'column2' }],
    foreignKeys: [
        {
            hasRelations: [{ name: 'relation1' }, { name: 'relation2' }],
            withColumns: [{ name: 'column1' }, { name: 'column2' }],
            withTable: 'relatedTable',
            onDeleteAction: 'action1',
            onUpdateAction: 'action2',
        },
    ],
};

/** Data Transfer Object used to interact with data models
 * @typedef {Object} DTO
 */

/**
 * @type { DTO }
 * @example
 * const dto = {
 *    column1: 'columnValue1',
 *    column2: 'columnValue2',
 * }
 */
const dto = {
    column1: 'columnValue1',
    column2: 'columnValue2',
};
