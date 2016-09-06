from os.path import expanduser, realpath, join, dirname

DATA_IN = realpath("data")
DATA_OUT = realpath("save")

class Default(object):
    DEBUG = True
    TESTING = False
