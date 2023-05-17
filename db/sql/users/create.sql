CREATE TABLE users (
email varchar(255) PRIMARY KEY,
password varchar(50) NOT NULL,
employee_id int4 UNIQUE,
full_name varchar(50) NOT NULL,
role varchar(25) NOT NULL,
created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
created_by varchar(25) NOT NULL,
last_modified_at timestamptz,
last_modified_by varchar(25)
);