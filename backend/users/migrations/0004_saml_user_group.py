from django.db import migrations
from users.saml import saml_user_group

def add_saml_users_to_group(apps, schema_editor):
    CustomUser = apps.get_model('users', 'CustomUser')

    saml_users = CustomUser.objects.filter(saml = True)
    saml_group = saml_user_group()

    if saml_group:
        for user in saml_users:
            user.groups.add(saml_group)
            user.save()

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_sitedomain'),
    ]

    operations = [
        migrations.RunPython(
            add_saml_users_to_group,
            reverse_code=migrations.RunPython.noop
        )
    ]
