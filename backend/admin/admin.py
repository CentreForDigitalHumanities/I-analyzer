import flask_admin as admin
from flask_admin.base import MenuLink

from ianalyzer import models
from . import views

admin_instance = admin.Admin( 
    name='IAnalyzer', index_view=views.AdminIndexView(), endpoint='admin')

admin_instance.add_link(MenuLink(name='Frontend', category='', url="/home"))

admin_instance.add_view(views.UserView(
    models.User, models.db.session, name='Users', endpoint='users'))

admin_instance.add_view(views.RoleView(
    models.Role, models.db.session, name='Roles', endpoint='roles'))

admin_instance.add_view(views.CorpusViewAdmin(
    models.Corpus, models.db.session, name='Corpora', endpoint='corpus'))

admin_instance.add_view(views.QueryView(
    models.Query, models.db.session, name='Queries', endpoint='queries'))