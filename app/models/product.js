export default class ProductImage {
  id = null;
  color = '';
  key = '';

  static fromJson(json) {
    const img = new ProductImage();
    Object.assign(img, json);
    return img;
  }
}

export default class Product {
  id = null;
  name = '';
  description = '';
  category = '';
  original_price = 0;
  stock_count = 0;
  images = [];
  created_at = null;
  handpicked = false;
  handpicked_order = 0;

  static fromJson(json) {
    const product = new Product();
    Object.assign(product, json);
    if (json.images) {
      product.images = json.images.map(img => ProductImage.fromJson(img));
    }
    return product;
  }
}