const pgp = require('pg-promise')({ capSQL: true });

const cs = new pgp.helpers.ColumnSet(
  [
    '?id',
    {
      name: 'val',
      skip: (col, data) => {
        console.log('SKIP ROW', data);
        return data[col.name] === undefined;
      },
    },
    'msg',
  ],
  { table: 'users' }
);

const data = [
  {
    id: 1,
    val: 123,
    msg: 'one',
  },
  {
    id: 2,
    msg: 'two',
  },
];

const update = pgp.helpers.update(data, cs, { table: 'users' });
console.log('UPDATE:', update);