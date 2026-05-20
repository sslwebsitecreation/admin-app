import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class HandpickedController extends Controller {
  @service handpicked;
  @service api;

  @tracked isEditing = false;
  @tracked dragIndex = null;

  @action
  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  @action
  async removeFromHandpicked(productId) {
    await this.handpicked.remove(productId);
    this.model.handpicked = this.handpicked.getHandpickedProducts(this.model.products);
  }

  @action
  async addToHandpicked(productId) {
    const added = await this.handpicked.add(productId);
    if (added) {
      this.model.handpicked = this.handpicked.getHandpickedProducts(this.model.products);
    }
  }

  @action
  dragStart(index) {
    this.dragIndex = index;
  }

  @action
  dragOver(event) {
    event.preventDefault();
  }

  @action
  drop(index) {
    if (this.dragIndex === null || this.dragIndex === index) {
      this.dragIndex = null;
      return;
    }
    const items = [...this.handpicked.orderedIds];
    const [removed] = items.splice(this.dragIndex, 1);
    items.splice(index, 0, removed);
    this.handpicked.reorder(items);
    this.model.handpicked = this.handpicked.getHandpickedProducts(this.model.products);
    this.dragIndex = null;
  }

  @action
  dragEnd() {
    this.dragIndex = null;
  }

  get availableProducts() {
    if (!this.model || !this.model.products) return [];
    return this.model.products.filter(
      p => !this.handpicked.isHandpicked(p.id)
    );
  }

  get hasAvailable() {
    return this.availableProducts.length > 0;
  }

  get canAddMore() {
    return !this.handpicked.maxed && this.hasAvailable;
  }
}
