import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class VideoCardComponent extends Component {
  @action
  handleImageError(event) {
    event.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="180" fill="%23f3e4d8"%3E%3Crect width="320" height="180"/%3E%3C/svg%3E';
  }
}
