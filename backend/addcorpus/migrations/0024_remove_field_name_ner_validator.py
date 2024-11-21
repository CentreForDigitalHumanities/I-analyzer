# Generated by Django 4.2.15 on 2024-11-06 08:33

import addcorpus.validation.creation
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('addcorpus', '0023_alter_corpusdocumentationpage_type_alter_field_name'),
    ]

    operations = [
        migrations.AlterField(
            model_name='field',
            name='name',
            field=models.SlugField(help_text='internal name for the field', max_length=126, validators=[addcorpus.validation.creation.validate_name_is_not_a_route_parameter]),
        ),
    ]
