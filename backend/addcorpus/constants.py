LANGUAGES = [
    ('af', 'Afrikaans'),
    ('ar', 'Arabic'),           # stopword + stemming support
    ('azb', 'Azerbaijani'),     # stopword support
    ('eu', 'Basque'),           # stopword + stemming support
    ('bn', 'Bengali'),          # stopword + stemming support
    ('ca', 'Catalan'),          # stopword + stemming support
    ('zh', 'Chinese'),          # stopword support
    ('da', 'Danish'),           # stopword + stemming support
    ('nl', 'Dutch'),            # stopword + stemming support
    ('dum', 'Middle Dutch'),
    ('odt', 'Old Dutch'),
    ('en', 'English'),          # stopword + stemming support
    ('fi', 'Finnish'),          # stopword + stemming support
    ('fr', 'French'),           # stopword + stemming support
    ('gd', 'Gaelic'),
    ('de', 'German'),           # stopword + stemming support
    ('grc', 'Ancient Greek'),
    ('el', 'Greek'),            # stopword + stemming support
    ('he', 'Hebrew'),           # stopword support
    ('hu', 'Hungarian'),        # stopword + stemming support
    ('ind', 'Indonesian'),      # stopword + stemming support
    ('ga', 'Irish'),            # stemming support
    ('it', 'Italian'),          # stopword + stemming support
    ('kaz', 'Kazakh'),          # stopword support
    ('la', 'Latin'),
    ('ne', 'Nepali'),           # stopword support
    ('no', 'Norwegian'),        # stopword + stemming supported for bokmål; the key for both is 'norwegian'
    ('nob', 'Norwegian (Bokmål)'),
    ('nno', 'Norwegian (Nynorsk)'),
    ('pt', 'Portuguese'),       # stopword + stemming support
    ('ro', 'Romanian'),         # stopword + stemming support
    ('ru', 'Russian'),          # stopword + stemming support
    ('sl', 'Slovene'),          # stopword support
    ('es', 'Spanish'),          # stopword + stemming support
    ('sv', 'Swedish'),          # stopword + stemming support
    ('tg', 'Tajik'),            # stopword support
    ('tr', 'Turkish'),          # stopword + stemming support
    ('cy', 'Welsh'),
    ('', 'Unknown'),
]
'''
Language options for corpora.

Based on https://en.wikipedia.org/wiki/ISO_639-3
'''

CATEGORIES = [
    ('newspaper', 'Newspapers'),
    ('parliament', 'Parliamentary debates'),
    ('periodical', 'Periodicals'),
    ('finance', 'Financial reports'),
    ('ruling', 'Court rulings'),
    ('review', 'Online reviews'),
    ('inscription', 'Funerary inscriptions'),
    ('oration', 'Orations'),
    ('book', 'Books'),
]
'''
Types of data
'''
