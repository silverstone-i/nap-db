CREATE TABLE users (
email varchar(255) PRIMARY KEY,
password varchar(50) NOT NULL,
employee_id int4 NOT NULL,
full_name varchar(50) NOT NULL,
role varchar(25) NOT NULL,
active bool NOT NULL DEFAULT true,
created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
created_by varchar(50) NOT NULL,
updated_at timestamptz,
updated_by varchar(50),
FOREIGN KEY (employee_id) REFERENCES employees(id)
);