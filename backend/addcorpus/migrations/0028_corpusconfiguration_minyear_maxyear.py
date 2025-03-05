import addcorpus.models
from django.db import migrations, models
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

    replaces = [('addcorpus', '0028_corpusconfiguration_max_year_and_more'), ('addcorpus', '0029_fill_minyear_maxyear'), ('addcorpus', '0030_remove_corpusconfiguration_max_date_and_more'), ('addcorpus', '0031_alter_corpusconfiguration_max_year_and_more')]

    dependencies = [
        ('addcorpus', '0027_alter_corpusconfiguration_category_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='corpusconfiguration',
            name='max_year',
            field=models.IntegerField(default=addcorpus.models.default_max_year, help_text='latest year for the data in the corpus'),
        ),
        migrations.AddField(
            model_name='corpusconfiguration',
            name='min_year',
            field=models.IntegerField(default=1800, help_text='earliest year for the data in the corpus'),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='corpusconfiguration',
            name='min_date',
            field=models.DateField(null=True, help_text='earliest date for the data in the corpus'),
        ),
        migrations.AlterField(
            model_name='corpusconfiguration',
            name='max_date',
            field=models.DateField(null=True, help_text='latest date for the data in the corpus'),
        ),
        migrations.RunPython(
            code=fill_min_max_years_from_date,
            reverse_code=fill_min_max_date_from_year,
        ),
        migrations.RemoveField(
            model_name='corpusconfiguration',
            name='max_date',
        ),
        migrations.RemoveField(
            model_name='corpusconfiguration',
            name='min_date',
        ),
    ]
