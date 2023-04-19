# Migrating from Flask

This documentation concerns environments that were already running I-analyzer with a Flask backend (version 3.x or lower).

## Install django backend

Run `yarn install-back` to install the new python requirements.

If you do not have postreSQL installed, install it now.

Set up a new database and run migrations by running these commands from the backend:

```bash
psql -f create_db.sql
yarn django migrate
```

## Migrating SQL data

You may want to to migrate the SQL data to the new django backend. (You do not need to do anything for elasticsearch data.)

The SQL database contains the user data, so migration is essential for production environments. In a development environment, you may prefer to skip this step and just create a new superuser with `yarn django createsuperuser`.

This update constitutes a switch from Flask to Django, as well as a switch from mySQL to postgreSQL. Migration consists of three steps:
- Create .txt files of the old database from mySQL.
- Move your database backup to the desired location
- Import data into the postgreSQL database using the django shell.

### Exporting data from mysql

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

### Move exported data

You exported data are in `/var/lib/mysql-files/`, which is inconvenient and requires sudo privileges to access, so you should move the files to a more convenient folder.

### Import data in django

Activate your python environment and run `yarn django shell`. Then run:

```python
from ianalyzer.flask_data_transfer import import_and_save_all_data
directory = 'path/to/your/data'
import_and_save_all_data(directory)
```

Some notes:

- If `directory` does not exist or does not contain relevant files, the script will not import anything.
- The script expects to run on an **empty** database, as it will also copy object IDs.
- If your mySQL database had a role named 'admin', its users will be made superusers with access to the admin interface.

Now you need to make sure that your new database is aware of the newest object IDs, or it will attempt to create new rows with duplicate IDs. Run the following commands from the backend:

```bash
python manage.py sqlsequencereset users | python manage.py dbshell
python manage.py sqlsequencereset addcorpus | python manage.py dbshell
python manage.py sqlsequencereset api | python manage.py dbshell
python manage.py sqlsequencereset download | python manage.py dbshell
```

## Add local settings

In `backend/ianalyzer`, make a file `settings_local.py`. Transfer relevant local settings you had configured in your `config.py` file for Flask.