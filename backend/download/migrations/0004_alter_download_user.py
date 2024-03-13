# Generated by Django 4.2.10 on 2024-03-06 16:56

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('download', '0003_es_query_to_api_query'),
    ]

    operations = [
        migrations.AlterField(
            model_name='download',
            name='user',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='downloads', to=settings.AUTH_USER_MODEL),
        ),
    ]