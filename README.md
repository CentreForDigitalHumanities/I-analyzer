# PEACE Portal

The PEACE portal is in essence an instance of I-analyzer that serves only one corpus, and only the search page for that one corpus. For detailed instructions on how to get a working installation of the application, please refer to the README of I-analyzer. This README describes the implementation details of PEACE Portal (a.k.a. differences) from the normal I-analyzer application.

## iframe support

The PEACE Portal is a Wordpress environment, created by Simon Welling for us (at https://peace.sites.uu.nl/). This gives the user(s) the ability to maintain the content of the site themselves, i.e. it allows for easy updating. On the `Epigraphy/Search` page, I-analyzer is displayed as an `<iframe>`. For this purpose, there is no menu on the page, nor a footer. Also, to facilitate scrolling and correct positioning of the search detail dialog pop up, there is communication between the application in the ifram and its parent. See `search-component.ts` and `search-results-component.ts` for the implementation details. Note that there is javascript on the Wordpress page that relies / functions in tandem with these messages.

## Corpus definition

The PEACE Portal corpus is a combination of three corpora (Ortal Paz' jewish inscriptions, Epidat and IIS). These exist in ES as separate indices, with a shared mapping and an alias that facilitates searching them simultaneously. To ensure the shared mapping and a consistent search interface, there is a base class in `peaceportal.py` in which all shared properties are defined. This is the corpus definition that should be passed to the frontend when the application is run.

Before that, however, index creation is needed. This should be done by using the corpus specific corpus definition, e.g. `epidat.py`. If you browse that class briefly, you will notice that it only defines extractors, i.e. it tells the application only where to find the information needed in the source documents. The rest of the corpus definition is left to the base class.

### FIJI corpus conversion

The FIJI corpus is supplied to us via Excel, provided by Ortal-Paz Saar. A conversion script exists for this sheet, `fiji_converter.py`. It extracts the data for each record from a CSV version of and creates XML for it using a (Jinja2) template. The script can be called with custom parameters, but it is easiest to run it from the folder where it resides, after moving the source file (typically `InscriptionDB_full.csv`) right next to it. Make sure the delimiter in the CSV is ';' and call `python fiji_converter.py`. This will produce a folder 'jewish-inscriptions' with the xml files in it. If, for some reason, you need to change the input or output path, or the delimiter, run `python fiji_converter.py --help` to see your options.

### IIS corpus preprocessing

The IIS corpus proved a bit tricky to add to the index. This is due to the fact that the `transcription` field is fully encoded in Epidoc as well (as opposed to the FIJI and Epidat corpora, which only utilize `<lb>`). Here is an example:

```xml
<div subtype="transcription" type="edition" xml:lang="grc">
    <p>
        <gap quantity="1" reason="lost" unit="line" />
        <lb />
        υἱὸς Ἰωσῆ
        <lb />
        <foreign xml:lang="heb">
            רבי
        </foreign>
        ὅσ
        <supplied reason="lost">
            ι
        </supplied>
        ος ὧδε κῖτε
        <lb />
        θά
        <supplied reason="lost">
            ρσει
        </supplied>
    </p>
</div>
```

This has to somehow be converted to this:

```txt
[ - - - - - - - - - - ]
υἱὸς Ἰωσῆ
רבי ὅσ[ι]ος ὧδε κῖτε
θά[ρσει]
```

The process for this is a manual process, and a bit tedious.
The core of it is using the official Epidoc stylesheets to convert the XML to plain text. Here are the steps:

1. Ensure you have a copy of the corpus. If you need to download / scrape it, please use the scraper in the `dhlab-scrapers` repo.

2. Download the [Epidoc stylesheets](https://github.com/EpiDoc/Stylesheets) to your local system. Note that these are XSLT 2 scripts, that cannot be run by any Python library (as far as I could tell, and believe me, I really tried to find something that could spare you all this trouble)

3. Make sure you have docker installed, you will need it to actually use the stylesheets you just downloaded, because they are XSLT 2 scripts.

4. Preprocess the corpus for transcription extraction by running the `iis_corpus_preprocessor.py` script. It needs two parameters: `-xml` - the folder where the corpus resides, and `-out` - the folder where you want to store the result. Note that this script will make a copy of the element containing the transcription (i.e.like the example above), remove all content from `<text>` and then reinsert the transcription `<div>`. This ensures that there will be no clutter after the XSLT conversion.

5. Adjust and run the following command (note that the `atomgraph/saxon` image will be downloaded automatically if you don't have it yet):

```bash
docker run -v "/path/to/wherever/you/want/the/result":"/txt/" -v "/path/to/wherever/the/preprocessed/files/are":"/xml/" -v "/path/to/wherever/the/epidoc_stylesheets/are":"/xsl/" atomgraph/saxon -s:/xml/ -xsl:/xsl/start-txt.xsl -o:/txt/
```

6. Set `PEACEPORTAL_IIS_TXT_DATA` in `config.py` to `"/path/to/wherever/you/want/the/result"` from the command above, i.e. the files that were produced by the docker run. (If you open one of these files you'll notice a lot of whitespace, don't worry about that - it will be handled by the corpus definition)

7. If you made all required / typical settings in `config.py`, you are now ready to actually create an index, i.e. `flask es -c iis`.

## Login and user/corpus administration

Upon application start, a user ('peaceportal') logs in automatically (the password is topsecret). All of the complex user management that is in I-analyzer is bypassed by this. If a user by the name 'peaceportal' does not exist yes, you can navigate to `whatever.nl/login` and login with your/our superuser account. You will automatically be redirected to the admin module. If this doesn't work, try navigating to `whatever.nl/admin/` (slash at the end!)

## Frontend routes

In the frontend, all routes that are not required have been deleted. This boils down to there only being two routes: `search/:corpus` and `login`. As explained above, the latter of these automatically redirects to the admin module, and is meant only to add the user that logs in automatically if it doesn't exist yet.
