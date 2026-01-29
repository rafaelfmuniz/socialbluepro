ALTER USER postgres WITH PASSWORD 'socialbluepro_pass';
CREATE USER socialbluepro WITH PASSWORD 'socialbluepro_pass';
CREATE DATABASE socialbluepro OWNER socialbluepro;
GRANT ALL PRIVILEGES ON DATABASE socialbluepro TO socialbluepro;