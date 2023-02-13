from __future__ import unicode_literals


from indico.core import signals

from indico.util.i18n import _

from indico.web.flask.util import url_for
from indico.web.menu import SideMenuItem

from indico_purr.blueprint import PurrPluginBlueprint
from indico_purr.plugin import PurrPlugin

from flask import session


blueprint = PurrPluginBlueprint
plugin = PurrPlugin


@signals.menu.items.connect_via('event-management-sidemenu')
def purr_sidemenu_items(sender, event, **kwargs):
    if event.can_manage(session.user):
        yield SideMenuItem('purr', _('PURR'),
                           url_for('plugin_purr.purr-home', event),
                           0, section='workflows', icon='pdf')