from django.db import migrations
from django.apps import AppConfig
from datetime import date


def fill_min_max_years_from_date(apps: AppConfig, schema_editor):
    CorpusConfiguration = apps.get_model('addcorpus', 'CorpusConfiguration')
    for config in CorpusConfiguration.objects.all():
        config.min_year = config.min_date.year
        config.max_year = config.max_date.year
        config.save()


def fill_min_max_date_from_year(apps: AppConfig, schema_editor):
    CorpusConfiguration = apps.get_model('addcorpus', 'CorpusConfiguration')
    for config in CorpusConfiguration.objects.all():
        config.min_date = date(year=config.min_year, month=1, day=1)
        config.max_date = date(year=config.max_year, month=12, day=31)
        config.save()


class Migration(migrations.Migration):

    dependencies = [
        ('addcorpus', '0028_corpusconfiguration_max_year_and_more'),
    ]

    operations = [
        migrations.RunPython(
            code=fill_min_max_years_from_date,
            reverse_code=fill_min_max_date_from_year,
        )
    ]
