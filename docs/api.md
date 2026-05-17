# Products API

## Create Product

```http
POST /api/v1/products
```

### Request

```json
{
  "name": "Soft Silk Saree",
  "description": "Premium silk saree",
  "category": "Silk",
  "tags": "silk,wedding,premium",
  "stock_count": 10,
  "original_price": 2999,
  "discounted_price": 2499,
  "images": [
    {
      "color": "Red",
      "image_link": "images/sarees/red.webp"
    },
    {
      "color": "Blue",
      "image_link": "images/sarees/blue.webp"
    }
  ]
}
```

### Response

```json
{
  "success": true,
  "data": {
    "success": true,
    "product_id": 1
  }
}
```

---

## Update Product

```http
PUT /api/v1/products
```

### Request

```json
{
  "id": 1,
  "name": "Updated Saree",
  "description": "Updated description",
  "category": "Cotton",
  "tags": "cotton,dailywear",
  "stock_count": 5,
  "original_price": 2499,
  "discounted_price": 1999,
  "images": [
    {
      "color": "White",
      "image_link": "images/sarees/white.webp"
    },
    {
      "color": "Black",
      "image_link": "images/sarees/black.webp"
    }
  ]
}
```

### Behavior

* Updates product row
* Deletes old product_images rows
* Deletes old R2 image files
* Inserts new product_images rows

### Response

```json
{
  "success": true,
  "data": {
    "success": true,
    "updated_id": 1
  }
}
```

---

## Delete Product

```http
DELETE /api/v1/products
```

### Request

```json
{
  "id": 1
}
```

### Behavior

* Deletes R2 image files
* Deletes product_images rows
* Deletes product row

### Response

```json
{
  "success": true,
  "data": {
    "success": true,
    "deleted_id": 1
  }
}
```

---

# YouTube API

## Add YouTube Video

```http
POST /api/v1/youtube
```

### Request

```json
{
  "link": "dQw4w9WgXcQ",
  "title": "New Saree Collection",
  "description": "Latest arrivals",
  "product_ids": "[1,2,3]"
}
```

### Notes

Send only the 11-character YouTube video ID.

Example:

```txt
https://youtube.com/watch?v=dQw4w9WgXcQ
```

Send:

```txt
dQw4w9WgXcQ
```

### Response

```json
{
  "success": true,
  "data": {
    "success": true,
    "video_id": 1
  }
}
```

---

## Delete YouTube Video

```http
DELETE /api/v1/youtube
```

### Request

```json
{
  "id": 5
}
```

### Response

```json
{
  "success": true,
  "data": {
    "success": true,
    "deleted_id": 5
  }
}
```

---

# Upload Image API

## Upload Image

```http
POST /api/v1/upload-image
```

### FormData

| Field  | Value     |
| ------ | --------- |
| image  | WEBP file |
| width  | 1200      |
| height | 1600      |

---

### Restrictions

| Rule       | Value      |
| ---------- | ---------- |
| Type       | image/webp |
| Max Size   | 400KB      |
| Dimensions | 1200x1600  |

---

### Example

```js
const formData = new FormData();

formData.append("image", file);
formData.append("width", 1200);
formData.append("height", 1600);

const response = await fetch("/api/v1/upload-image", {
  method: "POST",
  body: formData
});

const data = await response.json();

console.log(data);
```

### Response

```json
{
  "success": true,
  "data": {
    "key": "images/sarees/uuid.webp",
    "url": "https://cdn.yourdomain.com/images/sarees/uuid.webp"
  }
}
```

---

# Delete Image API

## Delete Image

```http
DELETE /api/v1/delete-image
```

### Request

```json
{
  "key": "images/sarees/uuid.webp"
}
```

### Example

```js
await fetch("/api/v1/delete-image", {
  method: "DELETE",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    key: "images/sarees/uuid.webp"
  })
});
```

### Response

```json
{
  "success": true,
  "data": {
    "success": true
  }
}
```

---

# Cache API

## Rebuild Cache

```http
POST /api/v1/rebuild-cache
```

### Response

```json
{
  "success": true,
  "data": {
    "products": [],
    "youtube_videos": []
  }
}
```

---

# Fetch Cached Data

## Get All Products + Videos

```http
GET /api/v1/all
```

### Response

```json
{
  "products": [
    {
      "id": 1,
      "name": "Soft Silk Saree",
      "description": "Premium silk saree",
      "category": "Silk",
      "tags": "silk,wedding,premium",
      "stock_count": 10,
      "original_price": 2999,
      "discounted_price": 2499,
      "created_at": "2026-05-03 12:04:00",
      "updated_at": "2026-05-03 12:04:00",
      "images": [
        {
          "id": 1,
          "color": "Red",
          "key": "images/sarees/red.webp"
        }
      ]
    }
  ],
  "youtube_videos": []
}
```

---

# Cache API

## Rebuild Cache

```http
POST /api/v1/rebuild-cache
```

### Purpose

Reads latest data from database (products, product_images, youtube_videos) and rebuilds KV cache. After this endpoint is called, `/api/v1/all` will return fresh data.

### Example

```js
await fetch("/api/v1/rebuild-cache", {
  method: "POST"
});
```

### Response

```json
{
  "success": true,
  "message": "Cache rebuilt successfully"
}
```

---

# Client-Side Caching Strategy

The frontend implements client-side caching to reduce API calls:

1. **Initial Load**: Data is loaded from IndexedDB if available
2. **Sync Button**: User clicks "Sync Latest" to trigger `/api/v1/rebuild-cache` then fetch fresh data from `/api/v1/all`
3. **Storage**: Fresh data is stored in IndexedDB for offline access
4. **Subsequent Loads**: Data is served from IndexedDB until next sync

### Flow

```
User clicks "Sync Latest"
    → POST /api/v1/rebuild-cache (rebuilds server cache)
    → GET /api/v1/all (fetches latest data)
    → Store in IndexedDB
    → Display data

User navigates between pages
    → Load from IndexedDB (no API call)
```
