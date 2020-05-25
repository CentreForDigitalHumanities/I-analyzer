# PEACE Portal

The PEACE portal is in essence an instance of I-analyzer that serves only one corpus, and only the search page for that one corpus. For detailed instructions on how to get a working installation of the application, please refer to the README of I-analyzer. This README describes the implementation details of PEACE Portal (a.k.a. differences) from the normal I-analyzer application.

## iframe support

The PEACE Portal is a Wordpress environment, created by Simon Welling for us (at https://peace.sites.uu.nl/). This gives the user(s) the ability to maintain the content of the site themselves, i.e. it allows for easy updating. On the `Epigraphy/Search` page, I-analyzer is displayed as an `<iframe>`. For this purpose, there is no menu on the page, nor a footer. Also, to facilitate scrolling and correct positioning of the search detail dialog pop up, there is communication between the application in the ifram and its parent. See `search-component.ts` and `search-results-component.ts` for the implementation details. Note that there is javascript on the Wordpress page that relies / functions in tandem with these messages.

## Corpus definition

The PEACE Portal corpus is a combination of three corpora (Ortal Paz' jewish inscriptions, Epidat and IIS). These exist in ES as separate indices, with a shared mapping and an alias that facilitates searching them simultaneously. To ensure the shared mapping and a consistent search interface, there is a base class in `peaceportal.py` in which all shared properties are defined. This is the corpus definition that should be passed to the frontend when the application is run.

Before that, however, index creation is needed. This should be done by using the corpus specific corpus definition, e.g. `epidat.py`. If you browse that class briefly, you will notice that it only defines extractors, i.e. it tells the application only where to find the information needed in the source documents. The rest of the corpus definition is left to the base class.

## Login and user/corpus administration

Upon application start, a user ('peaceportal') logs in automatically (the password is topsecret). All of the complex user management that is in I-analyzer is bypassed by this. If a user by the name 'peaceportal' does not exist yes, you can navigate to `whatever.nl/login` and login with your/our superuser account. You will automatically be redirected to the admin module. If this doesn't work, try navigating to `whatever.nl/admin/` (slash at the end!)

## Frontend routes

In the frontend, all routes that are not required have been deleted. This boils down to there only being two routes: `search/:corpus` and `login`. As explained above, the latter of these automatically redirects to the admin module, and is meant only to add the user that logs in automatically if it doesn't exist yet.
