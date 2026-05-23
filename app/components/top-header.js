import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class TopHeaderComponent extends Component {
  @service router;

  @tracked query = '';

  @action
  goHome() {
    this.router.transitionTo('index');
  }

  @action
  handleSearchKeydown(event) {
    if (event.key === 'Enter') {
      const q = event.target.value.trim();
      if (q) {
        this.router.transitionTo('products', { queryParams: { search: q } });
      }
    }
  }
}
