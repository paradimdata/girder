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

from girder.api import access
from girder.api.describe import Description, autoDescribeRoute
from girder.api.rest import filtermodel, Resource
from girder.constants import AccessType
from girder.exceptions import RestException
from girder.models.file import File
from girder.plugins.jobs.models.job import Job
from . import utils


class Chameleon(Resource):
    def __init__(self):
        super(Chameleon, self).__init__()
        self.resourceName = 'Chameleon'
        self.route('POST', (), self.createChameleon)

    @access.user
    @filtermodel(model=Job)
    @autoDescribeRoute(
        Description('Create a chameleon conversion of an existing file.')
        .notes('Make sure output_name is the name you want displayed on your files')
        .modelParam('fileId', 'The ID of the source file.', model=File, paramType='formData',
                    level=AccessType.READ)
        .param('output_name', 'The desired name of the output file.', required=True, dataType='string')
        .param('output_type', 'The desired output type.', required=False, dataType='string', default="")
        .param('input_extension', 'The extension of your input(if necessary).',dataType='string', required=False, default="")
        .param('target_endpoint', 'The desired Chameleon endpoint to hit', dataType='string', required=True)
        .param('attachToId', 'The lifecycle of this thumbnail is bound to the '
               'resource specified by this ID.')
        .param('attachToType', 'The type of resource to which this thumbnail is attached.',
               enum=['folder', 'user', 'collection', 'item'])
        .errorResponse()
        .errorResponse(('Write access was denied on the attach destination.',
                        'Read access was denied on the file.'), 403)
    )
    def createChameleon(self, file, output_name, output_type, input_extension, target_endpoint, attachToId, attachToType):
        user = self.getCurrentUser()

        self.model(attachToType).load(attachToId, user=user, level=AccessType.WRITE, exc=True)

        return utils.scheduleChameleonJob(file, user, output_name, output_type, input_extension, target_endpoint)
