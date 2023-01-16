# Migrating Flask data

This documentation concerns environments that were already running I-analyzer with a Flask backend (version 3.x or lower), where you want to migrate the SQL data to the new django backend. (You do not need to do anything for elasticsearch data.)

The SQL database contains the user data, so migration is essential for production environments. In a development environment, you may prefer to skip this step and just create a new superuser.

This update constitutes a switch from Flask to Django, as well as a switch from mySQL to postgreSQL. Migration consists of three steps:
- Create .txt files of the old database from mySQL.
- Move your database backup to the expected location
- Run Django migrations to import data in postgreSQL.

## Exporting data from mysql

To make database exports, your mySQL database user needs to have file privileges, which may not already be the case. You can grant these privileges to your user by getting into mySQL as the root user and running

```sql
grant all privileges on {database}.* to {user}@'localhost' with grant option;
```

or just execute the following as the root user.

Next, check where you are allowed to export files. (It seems to be the standard that mySQL will only allow you to export files to a specific directory.)

Run the following:

```sql
show variables like "secure_file_priv";
```

The output will specify the directory. I will assume that this is `/var/lib/mysql-files/`. If you get a different directory, substitute it in the steps below.

Run the following to export the data.

```sql
use ianalyzer;
select * from corpus into outfile '/var/lib/mysql-files/corpus.txt';
select * from corpora_roles into outfile '/var/lib/mysql-files/corpora_roles.txt';
select * from download into outfile '/var/lib/mysql-files/download.txt';
select * from query into outfile '/var/lib/mysql-files/query.txt';
select * from role into outfile '/var/lib/mysql-files/role.txt';
select * from user into outfile '/var/lib/mysql-files/user.txt';
```

## Move exported data

You exported data are in `/var/lib/mysql-files/`, which is inconvenient and requires sudo privileges to access. By default, the settings specifies the expected location of these files as `{repository}/backend/flask_sql_data`. Move the contents of `/var/lib/mysql-files/` into that folder.

## Run migrations

Data will be imported during migrations. Some notes:

- If the folder in `settings.FLASK_SQL_DATA_DIR` does not exist or does not contain relevant files, the migration will not import anything. (This happens for unit tests.)
- The data migration also copies object IDs from the mySQL database. This is fine if you run the migrations immediately after setting up your environment, but will cause errors if you have already added objects to your postgreSQL database.
- If your mySQL database had a role named 'admin', its users will be made superusers with access to the admin interface.
