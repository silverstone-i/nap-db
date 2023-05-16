CREATE TABLE users (
id serial PRIMARY KEY,
email varchar(255) UNIQUE NOT NULL,
password varchar(50) NOT NULL,
employee_id int4 NOT NULL,
full_name varchar(50) NOT NULL,
role varchar(25) NOT NULL,
created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
created_by varchar(25) NOT NULL,
last_modified_at timestamptz,
last_modified_by varchar(25) NOT NULL
);