import Component from '@glimmer/component';
import { inject as service } from '@ember/service';

export default class BottomNavigationComponent extends Component {
  @service router;

  get isIndex() {
    return this.router.currentRouteName === 'index';
  }

  get isProducts() {
    return this.router.currentRouteName.startsWith('products');
  }

  get isYoutube() {
    return this.router.currentRouteName.startsWith('youtube');
  }

  get isHandpicked() {
    return this.router.currentRouteName === 'handpicked';
  }
}
