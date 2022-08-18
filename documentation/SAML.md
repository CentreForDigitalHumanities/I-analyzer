In order to login with Solis ID, I-analyzer has SAML integration with ITS. For this, it uses our custom class `dhlab_flask_saml.py` from the [dhlab-saml](https://github.com/UUDigitalHumanitieslab/dhlab-saml) repo. More information on working with SAML, setting up a local environment to test the SAML integration, etc. can be found there.

Note that the SAML integration relies on three variables in the config (see te default config), one of which you will need to adjust to get a working situation.

Set up with the current deployment script, the metadata will be generated automatically. No action required if the server is updated: the saml metadata, available at [](https://ianalyzer.hum.uu.nl/saml/metadata/) will update itself, as python3-saml will look for the cert in the folder specified in `SAML_FOLDER` (which simlinks to the server certificate files), and generate the metadata based on this.
