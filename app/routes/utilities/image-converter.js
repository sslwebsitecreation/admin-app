import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class UtilitiesImageConverterRoute extends Route {
  @service imageProcessor;
  @service router;

  setupController(controller) {
    super.setupController(controller);
    controller.selectedFile = null;
    controller.originalPreview = null;
    controller.convertedPreview = null;
    controller.convertedBlob = null;
    controller.isProcessing = false;
    controller.error = null;
    controller.quality = 90;
    controller.width = 1200;
    controller.height = 1600;
    controller.fileInfo = null;
  }
}