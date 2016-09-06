from os.path import expanduser, realpath, join, dirname

DATA_IN = realpath("data")
DATA_OUT = realpath("save")
REGENERATE = True # whether to regenerate CSV files upon every access

class Default(object):
    DEBUG = True
    TESTING = False
