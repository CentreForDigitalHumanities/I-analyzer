# Generated by Django 4.1.13 on 2023-11-23 15:14

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('addcorpus', '0005_add_validators'),
    ]

    operations = [
        migrations.AddField(
            model_name='field',
            name='language',
            field=models.CharField(blank=True, help_text='IETF language tag of the content of this field; if language_field is also filled in, this is a fallback', max_length=64),
        ),
        migrations.AddField(
            model_name='field',
            name='language_field',
            field=models.CharField(blank=True, help_text='name of another field which contains the IETF language tag of the content of this field', max_length=126),
        ),
    ]
