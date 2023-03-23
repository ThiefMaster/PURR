

from flask import make_response, session

from indico.modules.events.management.controllers.base import RHManageEventBase
from indico.modules.events.management.views import WPEventManagement

from indico_purr.controllers.utils import get_settings_util
from indico_purr.models.settings import PurrSettingsModel


class RHPurrHomePage(RHManageEventBase):
    """ """

    def _process(self):

        if self.event.can_manage(session.user):

            connected = PurrSettingsModel.query.filter_by(
                event_id=self.event.id).has_rows()

            settings = PurrSettingsModel.query.filter_by(
                event_id=self.event.id).first()

            return WPEventManagement.render_template('purr:home.html',
                                                     self.event,
                                                     connected=connected,
                                                     settings=get_settings_util(settings))

        return make_response('', 403)
