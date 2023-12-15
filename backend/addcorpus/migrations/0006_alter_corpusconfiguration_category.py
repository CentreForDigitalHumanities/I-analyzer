# Generated by Django 4.1.13 on 2023-12-04 15:41

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('addcorpus', '0005_add_validators'),
    ]

    operations = [
        migrations.AlterField(
            model_name='corpusconfiguration',
            name='category',
            field=models.CharField(choices=[('parliament', 'Parliamentary debates'), ('periodical', 'Newspapers and other periodicals'), ('finance', 'Financial reports'), ('ruling', 'Court rulings'), ('review', 'Online reviews'), ('inscription', 'Funerary inscriptions'), ('oration', 'Orations'), ('book', 'Books'), ('informative', 'Informative')], help_text='category/medium of documents in this dataset', max_length=64),
        ),
    ]
