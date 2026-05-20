import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class TopHeaderComponent extends Component {
  @tracked query = '';

  @action
  handleSearch(event) {
    this.query = event.target.value;
  }
}
