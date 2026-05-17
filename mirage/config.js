import { createServer } from 'ember-cli-mirage';

let products = [
  {
    id: 1,
    name: 'Red Silk Saree',
    description: 'Elegant red silk saree with golden border',
    category: 'Silk',
    original_price: 4999,
    stock_count: 15,
    images: [
      { id: 1, color: 'Red', key: 'images/sarees/abc123.webp' },
      { id: 2, color: 'Maroon', key: 'images/sarees/abc124.webp' }
    ],
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    name: 'Blue Cotton Saree',
    description: 'Light and comfortable cotton saree for daily wear',
    category: 'Cotton',
    original_price: 1999,
    stock_count: 25,
    images: [
      { id: 3, color: 'Blue', key: 'images/sarees/def456.webp' }
    ],
    created_at: '2024-01-20T14:20:00Z'
  },
  {
    id: 3,
    name: 'Green Designer Saree',
    description: 'Exclusive designer saree with intricate embroidery',
    category: 'Designer',
    original_price: 7999,
    stock_count: 8,
    images: [
      { id: 4, color: 'Green', key: 'images/sarees/ghi789.webp' },
      { id: 5, color: 'Dark Green', key: 'images/sarees/ghi790.webp' }
    ],
    created_at: '2024-02-05T09:15:00Z'
  },
  {
    id: 4,
    name: 'Pink Banarasi Saree',
    description: 'Traditional Banarasi silk saree with zari work',
    category: 'Banarasi',
    original_price: 6499,
    stock_count: 12,
    images: [
      { id: 6, color: 'Pink', key: 'images/sarees/jkl012.webp' }
    ],
    created_at: '2024-02-10T16:45:00Z'
  },
  {
    id: 5,
    name: 'Orange Georgette Saree',
    description: 'Flowy georgette saree perfect for parties',
    category: 'Georgette',
    original_price: 3499,
    stock_count: 0,
    images: [
      { id: 7, color: 'Orange', key: 'images/sarees/mno345.webp' }
    ],
    created_at: '2024-02-15T11:00:00Z'
  }
];

let youtubeVideos = [
  {
    id: 1,
    link: 'dQw4w9WgXcQ',
    title: 'Bridal Saree Collection 2024',
    description: 'Explore our stunning collection of bridal sarees',
    product_ids: '[1,4]',
    created_at: '2024-01-10T08:00:00Z'
  },
  {
    id: 2,
    link: 'jNQXAC9IVRw',
    title: 'Cotton Saree Styling Tips',
    description: 'Learn how to style cotton sarees for different occasions',
    product_ids: '[2]',
    created_at: '2024-01-25T12:30:00Z'
  },
  {
    id: 3,
    link: '9bZkp7q19f0',
    title: 'Designer Saree Showcase',
    description: 'Exclusive designer sarees for special events',
    product_ids: '[3]',
    created_at: '2024-02-08T15:00:00Z'
  }
];

let nextProductId = 6;
let nextVideoId = 4;
let nextImageId = 8;

export default function() {
  let server = createServer();

  server.namespace = '/api/v1';
  server.timing = 300;

  server.get('/all', () => ({
    products,
    youtube_videos: youtubeVideos
  }));

  server.post('/products', (schema, request) => {
    const attrs = JSON.parse(request.requestBody);
    const newProduct = {
      id: nextProductId++,
      ...attrs,
      images: attrs.images.map((img, idx) => ({
        id: nextImageId++,
        color: img.color,
        key: img.image_link
      })),
      created_at: new Date().toISOString()
    };
    products.push(newProduct);
    return { products, youtube_videos: youtubeVideos };
  });

  server.put('/products', (schema, request) => {
    const attrs = JSON.parse(request.requestBody);
    const index = products.findIndex(p => p.id === attrs.id);
    if (index !== -1) {
      products[index] = {
        ...products[index],
        ...attrs,
        images: attrs.images.map((img, idx) => ({
          id: products[index].images[idx]?.id || nextImageId++,
          color: img.color,
          key: img.image_link
        }))
      };
    }
    return { products, youtube_videos: youtubeVideos };
  });

  server.delete('/products', (schema, request) => {
    const { id } = JSON.parse(request.requestBody);
    products = products.filter(p => p.id !== id);
    return { products, youtube_videos: youtubeVideos };
  });

  server.post('/upload-image', (schema, request) => {
    const filename = `${crypto.randomUUID()}.webp`;
    const key = `images/sarees/${filename}`;
    return {
      key,
      url: `https://cdn.example.com/${key}`
    };
  });

  server.delete('/delete-image', () => ({
    success: true
  }));

  server.post('/rebuild-cache', () => ({
    success: true,
    message: 'Cache rebuilt successfully'
  }));

  server.post('/youtube', (schema, request) => {
    const attrs = JSON.parse(request.requestBody);
    const newVideo = {
      id: nextVideoId++,
      ...attrs,
      created_at: new Date().toISOString()
    };
    youtubeVideos.push(newVideo);
    return { products, youtube_videos: youtubeVideos };
  });

  server.delete('/youtube', (schema, request) => {
    const { id } = JSON.parse(request.requestBody);
    youtubeVideos = youtubeVideos.filter(v => v.id !== id);
    return { products, youtube_videos: youtubeVideos };
  });
}