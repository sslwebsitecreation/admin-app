import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

export default Controller.extend({
  data: service(),

  name: '',
  category: '',
  price: 0,
  output: '',

  updateName(e) {
    this.set('name', e.target.value);
  },

  updateCategory(e) {
    this.set('category', e.target.value);
  },

  updatePrice(e) {
    this.set('price', Number(e.target.value));
  },

  async loadProducts() {
    try {
      const res = await fetch('/api/v1/all');
      const data = await res.json();
      this.set('output', JSON.stringify(data, null, 2));
    } catch (err) {
      this.set('output', err.message);
    }
  },

  async createProduct() {
    try {
      const res = await fetch('/api/v1/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: this.get('name'),
          category: this.get('category'),
          original_price: this.get('price')
        })
      });

      const data = await res.json();
      this.set('output', JSON.stringify(data, null, 2));

      this.loadProducts();
    } catch (err) {
      this.set('output', err.message);
    }
  }
});