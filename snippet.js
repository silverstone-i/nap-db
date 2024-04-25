const schema = {
  tableName: 'users',
  timeStamps: true, // Add time stamps to table - default is true
  columns: {
    id: { type: 'serial', nullable: false }, // Serial type column
    email: { type: 'varchar(255)', primaryKey: true },
    password: { type: 'varchar(255)', nullable: false },
    role: { type: 'varchar(255)', nullable: true, default: "'admin'" },
    name: { type: 'varchar(255)', nullable: true },
    ss: { type: 'varchar(255)', nullable: true },
  },
  uniqueConstraints: {
    users_id_unique: { columns: ['id'] },
  },
};

const columns = [];

for (const column in schema.columns) {
  if (schema.columns.hasOwnProperty(column)) {
    const columnType = schema.columns[column].type;
    const isNullable = schema.columns[column].nullable || false;
    const defaultValue = schema.columns[column].default || null;

   columns.push({
     name: column,
     prop: column,
     mod: ':raw',
     init: (col) => {
       return `${col.name} ${columnType}${isNullable ? '' : ' NOT NULL'}${
         defaultValue ? ` DEFAULT ${defaultValue}` : ''
       }`;
     },
   });
  }
}

console.log(columns);
