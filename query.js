const {QueryFile} = require('pg-promise');

// const qf = new QueryFile('./db/sql/users/create.sql')

// const query = qf.toString();

// console.log(query);

function sqlQueryFile(file) {
    const options = {
        // minifying the SQL is always advised;
        // see also option 'compress' in the API;
        minify: true,

        // See also property 'params' for two-step template formatting
    };

    const qf = new QueryFile(file, options);

    if (qf.error) {
        // Something is wrong with our query file :(
        // Testing all files through queries can be cumbersome,
        // so we also report it here, while loading the module:
        console.error(qf.error);
    }
    return qf;
}

const qfFunc = sqlQueryFile('./db/sql/users/create.sql');
const queryFunc = qfFunc.toString();

console.log(queryFunc);