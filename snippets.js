'use strict';

function findDifferenceIndexes(str1, str2) {
  const maxLength = Math.max(str1.length, str2.length);
  const diffIndexes = [];

  for (let i = 0; i < maxLength; i++) {
    if (str1[i] !== str2[i]) {
      diffIndexes.push(i);
    }
  }

  return diffIndexes;
}

const string1 = 'CREATE TABLE IF NOT EXISTS test_table (\n    id serial PRIMARY KEY NOT NULL,\n    name varchar(255) NOT NULL,\n    email varchar(255) NOT NULL,\n    age integer DEFAULT 18,\n    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    created_by varchar(50) NOT NULL,\n    updated_at timestamptz NULL DEFAULT NULL,\n    updated_by varchar(50) NULL DEFAULT NULL\n    );';

const string2 = `CREATE TABLE IF NOT EXISTS test_table (';

const diffIndexes = findDifferenceIndexes(string1, string2);
console.log('Indexes where the strings differ:', diffIndexes);
