# Generated by Django 4.2.14 on 2024-11-12 14:10

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('addcorpus', '0023_alter_corpusdocumentationpage_type_alter_field_name'),
        ('es', '0002_alter_index_available'),
    ]

    operations = [
        migrations.CreateModel(
            name='IndexJob',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('corpus', models.ForeignKey(help_text='corpus for which the job is created; task may use the corpus to determine metadata or extract documents', on_delete=django.db.models.deletion.CASCADE, to='addcorpus.corpus')),
            ],
        ),
        migrations.CreateModel(
            name='UpdateIndexTask',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('document_min_date', models.DateField(blank=True, help_text='minimum date on which to filter documents', null=True)),
                ('document_max_date', models.DateField(blank=True, help_text='maximum date on which to filter documents', null=True)),
                ('index', models.ForeignKey(help_text='index on which this task is applied', on_delete=django.db.models.deletion.CASCADE, related_name='%(class)ss', to='es.index')),
                ('job', models.ForeignKey(help_text='job in which this task is run', on_delete=django.db.models.deletion.CASCADE, related_name='%(class)ss', to='indexing.indexjob')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='RemoveAliasTask',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('alias', models.CharField(help_text='alias to remove', max_length=128)),
                ('index', models.ForeignKey(help_text='index on which this task is applied', on_delete=django.db.models.deletion.CASCADE, related_name='%(class)ss', to='es.index')),
                ('job', models.ForeignKey(help_text='job in which this task is run', on_delete=django.db.models.deletion.CASCADE, related_name='%(class)ss', to='indexing.indexjob')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='PopulateIndexTask',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('document_min_date', models.DateField(blank=True, help_text='minimum date on which to filter documents', null=True)),
                ('document_max_date', models.DateField(blank=True, help_text='maximum date on which to filter documents', null=True)),
                ('index', models.ForeignKey(help_text='index on which this task is applied', on_delete=django.db.models.deletion.CASCADE, related_name='%(class)ss', to='es.index')),
                ('job', models.ForeignKey(help_text='job in which this task is run', on_delete=django.db.models.deletion.CASCADE, related_name='%(class)ss', to='indexing.indexjob')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='DeleteIndexTask',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('index', models.ForeignKey(help_text='index on which this task is applied', on_delete=django.db.models.deletion.CASCADE, related_name='%(class)ss', to='es.index')),
                ('job', models.ForeignKey(help_text='job in which this task is run', on_delete=django.db.models.deletion.CASCADE, related_name='%(class)ss', to='indexing.indexjob')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='CreateIndexTask',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('delete_existing', models.BooleanField(default=False, help_text='if an index by this name already exists, delete it, instead of raising an exception')),
                ('index', models.ForeignKey(help_text='index on which this task is applied', on_delete=django.db.models.deletion.CASCADE, related_name='%(class)ss', to='es.index')),
                ('job', models.ForeignKey(help_text='job in which this task is run', on_delete=django.db.models.deletion.CASCADE, related_name='%(class)ss', to='indexing.indexjob')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='AddAliasTask',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('alias', models.CharField(help_text='alias to assign', max_length=128)),
                ('index', models.ForeignKey(help_text='index on which this task is applied', on_delete=django.db.models.deletion.CASCADE, related_name='%(class)ss', to='es.index')),
                ('job', models.ForeignKey(help_text='job in which this task is run', on_delete=django.db.models.deletion.CASCADE, related_name='%(class)ss', to='indexing.indexjob')),
            ],
            options={
                'abstract': False,
            },
        ),
    ]
