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
  "original_price": 2999,
  "stock_count": 10,
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
  "products": [],
  "youtube_videos": []
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
  "original_price": 2499,
  "stock_count": 5,
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

### Response

```json
{
  "products": [],
  "youtube_videos": []
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

### Response

```json
{
  "products": [],
  "youtube_videos": []
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

### Response

```json
{
  "products": [],
  "youtube_videos": []
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
  "products": [],
  "youtube_videos": []
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

### Restrictions

| Rule       | Value      |
| ---------- | ---------- |
| Type       | image/webp |
| Max Size   | 400KB      |
| Dimensions | 1200x1600  |

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
  "key": "images/sarees/uuid.webp",
  "url": "https://cdn.yourdomain.com/images/sarees/uuid.webp"
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
  "success": true
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
      "original_price": 2999,
      "stock_count": 10,
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
