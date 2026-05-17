import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default class SidebarComponent extends Component {
  @service router;

  get isDashboard() {
    return this.router.currentRouteName === 'index';
  }

  get isProducts() {
    return this.router.currentRouteName.startsWith('products');
  }

  get isYoutube() {
    return this.router.currentRouteName.startsWith('youtube');
  }
}