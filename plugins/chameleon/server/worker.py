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

from bson.objectid import ObjectId
import functools
import six
import sys
import traceback
import pydicom
import numpy as np
import requests
import json
import logging

from girder import events
from girder.models.file import File
from girder.models.upload import Upload
from girder.plugins.jobs.constants import JobStatus
from girder.plugins.jobs.models.job import Job
from girder.utility.model_importer import ModelImporter
from PIL import Image


def run(job):
    jobModel = Job()
    jobModel.updateJob(job, status=JobStatus.RUNNING)

    try:
        newFile = convertChameleon(**job['kwargs'])
        log = 'Created Chameleon conversion of file %s.' % newFile['_id']
        jobModel.updateJob(job, status=JobStatus.SUCCESS, log=log)
    except Exception:
        t, val, tb = sys.exc_info()
        log = '%s: %s\n%s' % (t.__name__, repr(val), traceback.extract_tb(tb))
        jobModel.updateJob(job, status=JobStatus.ERROR, log=log)
        raise


def convertChameleon(output_name, output_type, input_extension, target_endpoint, fileId):
    """
    Creates Chameleon conversion
    """
    fileModel = File()
    file = fileModel.load(fileId, force=True)
    streamFn = functools.partial(fileModel.download, file, headers=False)

    event = events.trigger('chameleon.create', info={
        'output_name': output_name,
        'output_type': output_type,
        'input_extension': input_extension,
        'target_endpoint': target_endpoint,
        'streamFn': streamFn
    })
    file_url = 'https://portal.data.paradim.org/api/v1/item/' + fileId + '/download'
    logging.getLogger(__name__)
    if target_endpoint == 'RHEED':
        api_url = "https://data.paradim.org/api/v1/chameleon/rheedconverter"
        todo = {"file_url":file_url,"output_file": output_name,"output_type":output_type}
        headers =  {"Content-Type": "application/json","access-token": "nschakJJdEsIQUfADFerH6aGjyz706f114C3c8leXhM"}
        response = requests.post(api_url, data=json.dumps(todo), headers=headers)
    else:
        response = {}
    

    return response











