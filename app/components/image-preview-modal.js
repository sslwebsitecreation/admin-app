import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class ImagePreviewModalComponent extends Component {
  @tracked show = false;
  @tracked imageUrl = null;

  @action
  open(url) {
    this.imageUrl = url;
    this.show = true;
  }

  @action
  close() {
    this.show = false;
    this.imageUrl = null;
  }

  @action
  handleKeydown(event) {
    if (event.key === 'Escape') {
      this.close();
    }
  }
}