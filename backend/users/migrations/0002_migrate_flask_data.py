from django.db import migrations
from django.conf import settings
from ianalyzer.flask_data_transfer import import_and_save_all_data

def get_models(apps):
    Group = apps.get_model('auth', 'group')
    CustomUser = apps.get_model('users', 'CustomUser')
    Corpus = apps.get_model('addcorpus', 'Corpus')
    Query = apps.get_model('api', 'Query')
    Download = apps.get_model('api', 'Download')

    return Group, CustomUser, Corpus, Query, Download


def migrate_flask_data(apps, schema_editor):
    Group, CustomUser, Corpus, Query, Download = get_models(apps)

    import_and_save_all_data(
        settings.FLASK_SQL_DATA_DIR,
        Group=Group, CustomUser=CustomUser, Corpus=Corpus, Query=Query, Download=Download
    )

def clear_database(apps, schema_editor):
    models = get_models(apps)

    for model in reversed(models):
        model.objects.all().delete()



class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
        ('addcorpus', '0001_add_corpus'),
        ('api', '0001_add_query_add_download')
    ]

    operations = [
        migrations.RunPython(migrate_flask_data,
            reverse_code=clear_database),
    ]
