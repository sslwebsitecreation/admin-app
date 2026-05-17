import Mirage from 'ember-cli-mirage';

let products = [
  {
    id: 1,
    name: 'Red Silk Saree',
    description: 'Elegant red silk saree with golden border',
    category: 'Silk',
    original_price: 4999,
    stock_count: 15,
    image_link: 'images/sarees/abc123.webp',
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    name: 'Blue Cotton Saree',
    description: 'Light and comfortable cotton saree for daily wear',
    category: 'Cotton',
    original_price: 1999,
    stock_count: 25,
    image_link: 'images/sarees/def456.webp',
    created_at: '2024-01-20T14:20:00Z'
  },
  {
    id: 3,
    name: 'Green Designer Saree',
    description: 'Exclusive designer saree with intricate embroidery',
    category: 'Designer',
    original_price: 7999,
    stock_count: 8,
    image_link: 'images/sarees/ghi789.webp',
    created_at: '2024-02-05T09:15:00Z'
  },
  {
    id: 4,
    name: 'Pink Banarasi Saree',
    description: 'Traditional Banarasi silk saree with zari work',
    category: 'Banarasi',
    original_price: 6499,
    stock_count: 12,
    image_link: 'images/sarees/jkl012.webp',
    created_at: '2024-02-10T16:45:00Z'
  },
  {
    id: 5,
    name: 'Orange Georgette Saree',
    description: 'Flowy georgette saree perfect for parties',
    category: 'Georgette',
    original_price: 3499,
    stock_count: 0,
    image_link: 'images/sarees/mno345.webp',
    created_at: '2024-02-15T11:00:00Z'
  }
];

let youtubeVideos = [
  {
    id: 1,
    link: 'dQw4w9WgXcQ',
    title: 'Bridal Saree Collection 2024',
    description: 'Explore our stunning collection of bridal sarees',
    product_ids: '1,4',
    created_at: '2024-01-10T08:00:00Z'
  },
  {
    id: 2,
    link: 'jNQXAC9IVRw',
    title: 'Cotton Saree Styling Tips',
    description: 'Learn how to style cotton sarees for different occasions',
    product_ids: '2',
    created_at: '2024-01-25T12:30:00Z'
  },
  {
    id: 3,
    link: '9bZkp7q19f0',
    title: 'Designer Saree Showcase',
    description: 'Exclusive designer sarees for special events',
    product_ids: '3',
    created_at: '2024-02-08T15:00:00Z'
  }
];

let nextProductId = 6;
let nextVideoId = 4;

export default function () {
  this.namespace = '/api/v1';
  this.timing = 300;

  this.get('/all', () => ({
    products,
    youtube: youtubeVideos
  }));

  this.post('/products', (schema, request) => {
    const attrs = JSON.parse(request.requestBody);
    const newProduct = {
      id: nextProductId++,
      ...attrs,
      created_at: new Date().toISOString()
    };
    products.push(newProduct);
    return { success: true, data: newProduct };
  });

  this.delete('/products', (schema, request) => {
    const { id } = JSON.parse(request.requestBody);
    products = products.filter(p => p.id !== id);
    return { success: true };
  });

  this.post('/upload-image', (schema, request) => {
    const formData = request.requestBody;
    const filename = `${crypto.randomUUID()}.webp`;
    const key = `images/sarees/${filename}`;
    return {
      success: true,
      data: {
        key,
        url: `https://cdn.example.com/${key}`
      }
    };
  });

  this.delete('/delete-image', () => ({
    success: true
  }));

  this.post('/youtube', (schema, request) => {
    const attrs = JSON.parse(request.requestBody);
    const newVideo = {
      id: nextVideoId++,
      ...attrs,
      created_at: new Date().toISOString()
    };
    youtubeVideos.push(newVideo);
    return { success: true, data: newVideo };
  });

  this.delete('/youtube', (schema, request) => {
    const { id } = JSON.parse(request.requestBody);
    youtubeVideos = youtubeVideos.filter(v => v.id !== id);
    return { success: true };
  });
}