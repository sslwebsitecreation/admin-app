import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

const ALL_TABS = [
  {
    key: 'youtube',
    route: 'youtube',
    label: 'Videos',
    isYoutube: true,
    isMatch(router) { return router.currentRouteName && router.currentRouteName.startsWith('youtube'); },
  },
  {
    key: 'handpicked',
    route: 'handpicked',
    label: 'Handpicked',
    isStar: true,
    isMatch(router) { return router.currentRouteName === 'handpicked'; },
  },
  {
    key: 'converter',
    route: 'utilities.image-converter',
    label: 'Converter',
    isGrid: true,
    isMatch(router) { return router.currentRouteName === 'utilities.image-converter'; },
  },
];

export default class BottomNavigationComponent extends Component {
  @service router;

  @tracked showSheet = false;
  @tracked swappedKey = 'youtube';

  get swappedTab() {
    const tab = ALL_TABS.find(t => t.key === this.swappedKey);
    const active = tab && tab.isMatch(this.router);
    return { ...tab, active };
  }

  get moreTabs() {
    return ALL_TABS
      .filter(t => t.key !== this.swappedKey)
      .map(t => ({ ...t, active: t.isMatch(this.router) }));
  }

  get isIndex() {
    return this.router.currentRouteName === 'index';
  }

  get isProducts() {
    return this.router.currentRouteName && this.router.currentRouteName.startsWith('products');
  }

  get isMoreActive() {
    return this.moreTabs.some(t => t.active);
  }

  @action
  toggleSheet() {
    this.showSheet = !this.showSheet;
  }

  @action
  closeSheet() {
    this.showSheet = false;
  }

  @action
  goToSwapped() {
    if (this.swappedTab && this.swappedTab.route) {
      this.router.transitionTo(this.swappedTab.route);
    }
  }

  @action
  selectTab(tab) {
    this.swappedKey = tab.key;
    this.showSheet = false;
    this.router.transitionTo(tab.route);
  }

  @action
  goHome() {
    this.router.transitionTo('index');
  }

  @action
  goProducts() {
    this.router.transitionTo('products');
  }

  @action
  stopPropagation(event) {
    event.stopPropagation();
  }
}
