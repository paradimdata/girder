import SearchFieldWidget from 'girder/views/widgets/SearchFieldWidget';
import View from 'girder/views/View';

import 'girder/utilities/jquery/girderEnable';
import 'girder/utilities/jquery/girderModal';

import ThumbnailModel from '../models/ThumbnailModel';
import ChameleonModel from '../models/ChameleonModel';

import CreateThumbnailViewDialogTemplate from '../templates/createThumbnailViewDialog.pug';
import CreateThumbnailViewTargetDescriptionTemplate from '../templates/createThumbnailViewTargetDescription.pug';

import '../stylesheets/createThumbnailView.styl';

import FileModel from 'girder/models/FileModel'

/**
 * A dialog for creating thumbnails from a specific file.
 */
var CreateThumbnailView = View.extend({
    events: {
        'change .g-thumbnail-attach-container input[type="radio"]': function () {
            this.$('.g-target-result-container').empty();

            if (this.$('.g-thumbnail-attach-this-item').is(':checked')) {
                this.attachToType = 'item';
                this.attachToId = this.item.id;
                this.$('.g-thumbnail-custom-target-container').addClass('hide');
                this.$('.g-submit-create-chameleon').girderEnable(true);
            } else {
                this.attachToType = null;
                this.attachToId = null;
                this.$('.g-thumbnail-custom-target-container').removeClass('hide');
                this.$('.g-submit-create-chameleon').girderEnable(false);
            }
        },

        'submit #g-create-thumbnail-form': function (e) {
            const view = this;
            e.preventDefault();

            this.$('.g-validation-failed-message').empty();
            this.$('.g-submit-create-chameleon').girderEnable(false);

            const chameleonModel = new ChameleonModel({
                output_name: String(this.$('#g-output-name').val()) || '',                
                target_endpoint: String(this.$('#g-endpoint-options').val()) || '',
                output_type: String(this.$('#g-output-types').val()) || '',
                output_type: String(this.$('#g-input-extension-options').val()) || '',
                ppms_file_type: String(this.$('#g-ppms-file-options').val()) || '',
                fileId: this.file.id,
                attachToId: this.attachToId,
                attachToType: this.attachToType
            });

            const outputFileName = chameleonModel.get('output_name') || 'file.png';
            const endpoint = chameleonModel.get('target_endpoint') || "option1";
            const ppms_file_type = chameleonModel.get('ppms_file_type') || "option1";
            const fileId = chameleonModel.get('fileId')  // Assuming fileId is available as this.file.id
            const attachToId = chameleonModel.get('attachToId')
            const downloadUrl = `http://localhost:8080/api/v1/item/${attachToId}/download`;
            let finalEndpoint;

            if (endpoint === 'option1'){
                finalEndpoint = "http://localhost:5020/rheedconverter";
            }else if (endpoint === 'option2'){
                finalEndpoint = "http://localhost:5020/ppmsmpms";
            }else if (endpoint === 'option3'){
                finalEndpoint = "http://localhost:5020/brukerrawconverter";
            }else if (endpoint === 'option4'){
                finalEndpoint = "http://localhost:5020/brukerrawbackground";
            }else if (endpoint === 'option5'){
                finalEndpoint = "http://localhost:5020/non4dstem";
            }else if (endpoint === 'option6'){
                finalEndpoint = "http://localhost:5020/stemarray4d";
            }else if (endpoint === 'option7'){
                finalEndpoint = "http://localhost:5020/mbeparser";
            }

            $.ajax({
                url: finalEndpoint,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "access-token": "nschakJJdEsIQUfADFerH6aGjyz706f114C3c8leXhM"
                },
                data: JSON.stringify({
                    "file_url": downloadUrl,
                    "output_file": outputFileName,
                    "output_type": "raw",
                }),
                dataType: "json"
            }).done(function(resp) {
                console.log("Server Response:", resp); 
                const byteCharacters = atob(resp);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                if (endpoint === 'option1'){
                    const blob = new Blob([byteArray], {type: 'image/png'});
                    var file = new FileModel();
                    file.uploadToItem(view.item, blob, outputFileName, "image/png");
                    $('.modal').girderModal('close');
                }else if (endpoint === 'option2'){
                    const blob = new Blob([byteArray], {type: 'text/plain'});
                    var file = new FileModel();
                    file.uploadToItem(view.item, blob, outputFileName, "text/plain");
                    $('.modal').girderModal('close');
                }
                //location.reload();
            }).fail(function(xhr, status, error) {
                console.error("Error:", error);
                // Display error message in the dialog box
                view.$('.g-validation-failed-message').html(`<div class="alert alert-danger">Error: ${error}</div>`);
                view.$('.g-submit-create-chameleon').girderEnable(true); // Re-enable the submit button
            });
            
            
        }
    },

    initialize: function (settings) {
        this.item = settings.item;
        this.file = settings.file;
        this.attachToType = 'item';
        this.attachToId = this.item.id;

        this.searchWidget = new SearchFieldWidget({
            placeholder: 'Start typing a name...',
            types: ['collection', 'folder', 'item', 'user'],
            parentView: this
        }).on('g:resultClicked', this.pickTarget, this);
    },

    render: function () {
        this.$el.html(CreateThumbnailViewDialogTemplate({
            file: this.file,
            item: this.item
        })).girderModal(this).on('shown.bs.modal', () => {
            this.$('#g-endpoint-options').focus();
        });

        this.$('#g-endpoint-options').focus();

        this.searchWidget.setElement(this.$('.g-search-field-container')).render();

        return this;
    },

    pickTarget: function (target) {
        this.searchWidget.resetState();
        this.attachToType = target.type;
        this.attachToId = target.id;
        this.$('.g-submit-create-chameleon').girderEnable(true);

        this.$('.g-target-result-container').html(CreateThumbnailViewTargetDescriptionTemplate({
            text: target.text,
            icon: target.icon
        }));
    }
});

export default CreateThumbnailView;
