import Component from '@glimmer/component';

export default class StockBadgeComponent extends Component {
  get isInStock() {
    return this.args.count > 0;
  }
}