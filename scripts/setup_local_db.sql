-- Create databases
CREATE DATABASE candidatev_auth;
CREATE DATABASE candidatev_user;
CREATE DATABASE candidatev_cv;
CREATE DATABASE candidatev_export;
CREATE DATABASE candidatev_ai;
CREATE DATABASE candidatev_payment;

-- Create extension for UUID support in each database
\c candidatev_auth;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c candidatev_user;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c candidatev_cv;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c candidatev_export;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c candidatev_ai;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c candidatev_payment;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Return to default database
\c postgres; 