#!/bin/env python3

import os
import os.path
from setuptools import setup

def read(fname):
    return open(os.path.join(os.path.dirname(__file__), fname)).read()

setup(
    name = "timestextmining",
    version = "0.0.1",
    author = "Niels Steenbergen",
    author_email = "n.steenbergen@uu.nl",
    description = ("ElasticSearch indexing of newspapers and Flask web application to retrieve them."),
    license = "MIT",
    keywords = "newspaper times elasticsearch database index download csv",
    url = "",
    packages=['timestextminer', 'tests'],
    long_description=read('README.md'),
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Topic :: Text Processing :: Indexing",
	"Intended Audience :: Science/Research",
        "License :: OSI Approved :: MIT License",
	"Topic :: Internet :: WWW/HTTP :: WSGI :: Application",
    ],
)
