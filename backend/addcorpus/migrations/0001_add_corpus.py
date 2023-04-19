# Generated by Django 4.1.5 on 2023-01-11 15:31

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='Corpus',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=126, unique=True)),
                ('description', models.CharField(max_length=254, null=True)),
                ('groups', models.ManyToManyField(blank=True, related_name='corpora', to='auth.group')),
            ],
            options={
                'verbose_name_plural': 'Corpora',
            },
        ),
    ]