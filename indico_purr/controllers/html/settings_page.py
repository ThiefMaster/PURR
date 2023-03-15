
from indico_purr.forms import PurrSettingsForm
from indico_purr.models.settings import PurrSettingsModel
from indico_purr.utils import json_decode, json_encode

from indico.core.db import db
from indico.modules.logs import EventLogRealm, LogKind
from indico.modules.events.management.controllers.base import RHManageEventBase
from indico.web.util import jsonify_data, jsonify_template

from flask import request, session, make_response


class RHPurrSettingsPage(RHManageEventBase):
    """ """

    def _process_GET(self):

        if self.event.can_manage(session.user):

            connected = PurrSettingsModel.query.filter_by(
                event_id=self.event.id).has_rows()

            if connected:
                settings = PurrSettingsModel.query.filter_by(
                    event_id=self.event.id).first()

                custom_fields = json_decode(settings.custom_fields.encode(
                    'utf-8')) if settings.custom_fields else []

                form = PurrSettingsForm(pdf_page_width=settings.pdf_page_width,
                                        pdf_page_height=settings.pdf_page_height,
                                        ab_session_h1=settings.ab_session_h1,
                                        ab_session_h2=settings.ab_session_h2,
                                        ab_contribution_h1=settings.ab_contribution_h1,
                                        ab_contribution_h2=settings.ab_contribution_h2)

                return jsonify_template('purr:settings.html', form=form,
                                        event=self.event, custom_fields=custom_fields)

        return make_response('', 403)

    def _process_POST(self):

        if self.event.can_manage(session.user):

            connected = PurrSettingsModel.query.filter_by(
                event_id=self.event.id).has_rows()

            if connected:

                form = PurrSettingsForm(pdf_page_width=request.form['pdf_page_width'],
                                        pdf_page_height=request.form['pdf_page_height'],
                                        ab_session_h1=request.form['ab_session_h1'],
                                        ab_session_h2=request.form['ab_session_h2'],
                                        ab_contribution_h1=request.form['ab_contribution_h1'],
                                        ab_contribution_h2=request.form['ab_contribution_h2'])

                if form.validate_on_submit():

                    settings = PurrSettingsModel.query.filter_by(
                        event_id=self.event.id).first()

                    settings.populate_from_dict(form.data)
                    settings.custom_fields = str(json_encode([
                        int(request.form[key])
                        for key in request.form
                        if key.startswith('custom_field_')
                    ]), 'utf-8')

                    db.session.add(settings)
                    db.session.commit()
                    db.session.flush()

                    self.event.log(EventLogRealm.management, LogKind.positive,
                                   'PURR', 'Settings saved', session.user)

                    return jsonify_data(flash=True)

                return jsonify_template('purr:settings.html', custom_fields=[],
                                        event=self.event, form=form)

        return make_response('', 403)
