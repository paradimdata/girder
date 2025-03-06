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
/*import FolderModel from 'girder/models/FolderModel'

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
                input_type: String(this.$('#g-input-extension-options').val()) || '',
                ppms_file_type: String(this.$('#g-ppms-file-options').val()) || '',
                secondFile: this.resultId,
                fileId: this.file.id,
                attachToId: this.attachToId,
                attachToType: this.attachToType,
                folderId: this.folderId,
                collectionId: this.collectionId
            });

            const outputFileName = chameleonModel.get('output_name') || 'file.png';
            const endpoint = chameleonModel.get('target_endpoint') || "option1";
            const ppms_file_type = chameleonModel.get('ppms_file_type') || "option1";
            const fileId = chameleonModel.get('fileId')  
            const attachToId = chameleonModel.get('attachToId')
            const secondFileId = chameleonModel.get('secondFile')
            const input_type = chameleonModel.get('input_type')
            const downloadUrl = `http://localhost:8080/api/v1/item/${attachToId}/download`;
            const secondFileUrl = `http://localhost:8080/api/v1/item/${secondFileId}/download`;
            const folder = chameleonModel.get('folderId');
            const collection = chameleonModel.get('collectionId');
            const folderUrl = `http://localhost:8080/api/v1/folder/${folder}/download`

            let finalEndpoint;
            console.log(folder)
            console.log(collection)

            switch (endpoint) {
                case 'option1': 
                    finalEndpoint = "http://localhost:5020/rheedconverter";
                    break; 
                case 'option2': 
                    finalEndpoint = "http://localhost:5020/ppmsmpms";
                    break; 
                case 'option3': 
                    finalEndpoint = "http://localhost:5020/brukerrawconverter";
                    break;
                case 'option4': 
                    finalEndpoint = "http://localhost:5020/brukerrawbackground";
                    break;
                case 'option5': 
                    finalEndpoint = "http://localhost:5020/mbeparser";
                    break;
                case 'option6': 
                    finalEndpoint = "http://localhost:5020/stemarray4d";
                    break;
                case 'option7': 
                    finalEndpoint = "http://localhost:5020/non4dstem_folder";
                    break;
                case 'option8': 
                    finalEndpoint = "http://localhost:5020/non4dstem_file";
                    break;
                case 'option9': 
                    finalEndpoint = "http://localhost:5020/hs2converter";
                    break;
                case 'option10': 
                    finalEndpoint = "http://localhost:5020/jeol_sem_converter";
                    break;
                case 'option11': 
                    finalEndpoint = "http://localhost:5020/brukerbrmlconverter";
                    break;
                case 'option12': 
                    finalEndpoint = "http://localhost:5020/rheed_video_converter";
                    break;
                default:
                    finalEndpoint = "http://localhost:5020/default"; // Fallback in case none match
            }
            
            let extraData = {};
            if (endpoint === 'option4'){
                extraData = {"background_file_url": secondFileUrl}

            }else if (endpoint === 'option7'){
                extraData = {"folder_url": folderUrl,
                    "output_folder": outputFileName
                }

            }else if (endpoint === 'option8'){
                if (input_type === 'option1')
                    extraData = {}
                else if (input_type === 'option5')
                    extraData = {"file_input_type": ".dm4"}
                else if (input_type === 'option6')
                    extraData = {"file_input_type": ".ser"}
                else if (input_type === 'option7')
                    extraData = {"file_input_type": ".emd"}
            }
            $.ajax({
                url: finalEndpoint,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "access-token": "nschakJJdEsIQUfADFerH6aGjyz706f114C3c8leXhM"
                },
                data: JSON.stringify({
                    "input_url": downloadUrl,
                    "output": outputFileName,
                    "output_type": "raw",  // Change to "base64" if expecting a base64 JSON response
                    "output_dest": "caller"  // Ensures response is sent back, not just a success message
                }),
                xhrFields: {
                    responseType: "blob"  // Ensures raw file responses are handled correctly
                },
                processData: false
            }).done(function(response, textStatus, jqXHR) {
                const contentType = jqXHR.getResponseHeader("Content-Type");
                
                if (contentType.includes("application/json")) {
                    // JSON response (could be base64 encoded)
                    const reader = new FileReader();
                    reader.onload = function() {
                        try {
                            const jsonResponse = JSON.parse(reader.result);
                            if (jsonResponse.file_data) {
                                // Handle base64-encoded file
                                const byteCharacters = atob(jsonResponse.file_data);
                                const byteNumbers = new Array(byteCharacters.length);
                                for (let i = 0; i < byteCharacters.length; i++) {
                                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                                }
                                const byteArray = new Uint8Array(byteNumbers);
                                const blob = new Blob([byteArray], { type: contentType });
            
                                // Save file (adjust accordingly)
                                const link = document.createElement("a");
                                link.href = URL.createObjectURL(blob);
                                link.download = jsonResponse.file_name;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            } else {
                                console.log("JSON Response:", jsonResponse);
                            }
                        } catch (error) {
                            console.error("Error parsing JSON response:", error);
                        }
                    };
                    response.text().then(text => reader.readAsText(new Blob([text])));
                } else {
                    // Raw file response
                    const blob = new Blob([response], { type: contentType });
                    let mimeType;

                    if (input_type === 'option12')
                        mimeType = "video/x-msvideo"
            
                    // Save file (adjust accordingly)
                    var file = new FileModel();
                    file.uploadToItem(view.item, blob, outputFileName, mimeType);
                    $('.modal').girderModal('close');
                    location.reload();
                }
            }).fail(function(xhr, status, error) {
                console.error("AJAX Request Failed!");
                console.error("Status:", status);
                console.error("Error:", error);
                console.error("Response Text:", xhr.responseText);
                console.error("HTTP Status Code:", xhr.status);
                
                let errorMessage = `
                    <div class="alert alert-danger">
                        <strong>Error:</strong> ${error} <br>
                        <strong>Status:</strong> ${status} <br>
                        <strong>HTTP Code:</strong> ${xhr.status} <br>
                        <strong>Response:</strong> ${xhr.responseText || "No response from server"} <br>
                        <strong>Possible Causes:</strong> Check if the API endpoint is correct, server is running, and request data is valid.
                    </div>`;
            
                $(".g-validation-failed-message").html(errorMessage);
                $(".g-submit-create-chameleon").girderEnable(true);
            });
            
            
        }
    },

    initialize: function (settings) {
        this.item = settings.item;
        this.file = settings.file;
        this.attachToType = 'item';
        this.attachToId = this.item.id;
        this.folderId = this.item.get('folderId');
        this.collectionId = this.item.get('baseParentId');
        this.resultId = null;

        this.searchWidget = new SearchFieldWidget({
            placeholder: 'Start typing a name...',
            types: ['collection', 'folder', 'item', 'user'],
            parentView: this
        }).on('g:resultClicked', function (result) {
            this.resultId = result.id;
        }, this);
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
