from os.path import expanduser, realpath, join, dirname
from datetime import datetime, timedelta

# Flask
DEBUG = True
TESTING = False

# Elastic search

# Times-data
DATA = realpath("data")
MAX_DATESPAN = timedelta(days=365)
MIN_DATE = datetime(year=1785, month=1, day=1) 
MAX_DATE = datetime(year=2010, month=12, day=31)