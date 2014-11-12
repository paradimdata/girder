#!/usr/bin/env python
# -*- coding: utf-8 -*-

###############################################################################
#  Copyright Kitware Inc.
#
#  Licensed under the Apache License, Version 2.0 ( the "License" );
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
###############################################################################

import datetime

from girder import events
from girder.constants import AccessType
from girder.models.model_base import AccessControlledModel
from girder.plugins.jobs.constants import JobStatus


class Job(AccessControlledModel):
    def initialize(self):
        self.name = 'job'
        self.ensureIndices([([('userId', 1), ('created', 1)], {})])

    def validate(self, job):
        return job

    def cancelJob(self, job):
        """
        Revoke/cancel a job. This simply triggers the jobs.cancel event and
        sets the job status  to CANCELED. If one of the event handlers
        calls preventDefault() on the event, this job will *not* be put into
        the CANCELED state.

        :param job: The job to cancel.
        """
        event = events.trigger('jobs.cancel', info=job)

        if not event.defaultPrevented:
            job['status'] = JobStatus.CANCELED
            self.save(job)

        return job

    def createExternalJobToken(self, job, days=7):
        """
        Create a token that will be used by the job executor to write info
        about the job back to Girder.

        :param job: The job to grant write access on.
        :param days: Number of days token will be valid.
        :type days: int or float
        """
        scope = 'jobs.write_' + job['_id']
        return self.model('token').createToken(days=days, scope=scope)

    def createJob(self, title, type, payload, user=None, when=None, interval=0,
                  public=False):
        """
        Create a new job record. This method triggers a jobs.create event that
        job schedulers should listen to in order to schedule the job.

        :param title: The title of the job.
        :type title: str
        :param type: The type of the job.
        :type type: str
        :param payload: The object that will be passed to the job executor.
        :param user: The user creating the job.
        :type user: dict or None
        :param when: Minimum start time for the job (UTC).
        :type when: datetime
        :param interval: If this job should be recurring, set this to a value
        in seconds representing how often it should occur. Set to <= 0 for
        jobs that should only be run once.
        :type interval: int
        :param public: Public read access flag.
        :type public: bool
        """
        if when is None:
            when = datetime.datetime.utcnow()

        job = {
            'title': title,
            'type': type,
            'payload': payload,
            'created': datetime.datetime.utcnow(),
            'when': when,
            'interval': interval,
            'status': JobStatus.INACTIVE,
            'progress': None,
            'log': None,
            'extra': {}
        }

        self.setPublic(job, public=public)

        if user:
            job['userId'] = user['_id']
            self.setUserAccess(job, user=user, level=AccessType.ADMIN)

        job = self.save(job)
        events.trigger('jobs.create', info=job)

        return job

    def filter(self, job, user):
        # TODO refine?
        keys = ('title', 'type', 'payload', 'created', 'when', 'interval',
                'status', 'progress', 'log', 'extra')
        return self.filterDocument(job, allow=keys)
