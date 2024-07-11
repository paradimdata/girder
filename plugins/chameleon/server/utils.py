from girder.plugins.jobs.models.job import Job


def scheduleChameleonJob(file, user, output_name, output_type, input_extension, target_endpoint):
    """
    Schedule a local chameleon creation job and return it.
    """
    job = Job().createLocalJob(
        title='Generate chameleon conversion for %s' % file['name'], user=user, type='chameleon.create',
        public=False, module='girder.plugins.chameleon.worker', kwargs={
            'fileId': str(file['_id']),
            'output_name': output_name,
            'output_type': output_type,
            'input_extension': input_extension,
            'target_endpoint': target_endpoint,
        })
    Job().scheduleJob(job)
    return job
