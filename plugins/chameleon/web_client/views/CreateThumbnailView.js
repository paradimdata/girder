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

            new ChameleonModel({
                output_name: String(this.$('#g-output-name').val()) || '',                
                target_endpoint: String(this.$('#g-endpoint-options').val()) || '',
                output_type: String(this.$('#g-output-types').val()) || '',
                output_type: String(this.$('#g-input-extension-options').val()) || '',
                fileId: this.file.id,
                attachToId: this.attachToId,
                attachToType: this.attachToType
            })
/*
            $.ajax({
                url: "https://data.paradim.org/api/v1/chameleon/rheedconverter",
                method: "POST",
                headers: {"Content-Type": "application/json","access-token": "nschakJJdEsIQUfADFerH6aGjyz706f114C3c8leXhM"},
                data: {"file_url":"http://localhost:8080/#item/6682ebf958acf55e85b4d718/download","output_file": "test.png"}
              }).done(function (resp) {
                var file = new FileModel();
                file.uploadToItem(view.item, resp, "filename", "mimeType");
            });
            */
        
            $.ajax({
                url: "http://localhost:5020/rheedconverter",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "access-token": "nschakJJdEsIQUfADFerH6aGjyz706f114C3c8leXhM"
                },
                data: JSON.stringify({
                    "file_url": "http://portal.data.paradim.org/item/6682ebf958acf55e85b4d718/download",
                    "output_file": "test.png"
                }),
                dataType: "json"
            }).done(function(resp) {
                // Assuming FileModel and uploadToItem are correctly defined and handle the upload process
                var file = new FileModel();
                file.uploadToItem(view.item, resp, "filename", "mimeType");
            }).fail(function(xhr, status, error) {
                console.error("Error:", error);
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
