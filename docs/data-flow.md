# Data Flow Architecture

## Overview

The app uses a two-tier caching architecture:

```
API Server (HTTP)  ←→  IndexedDB (browser cache)  ←→  Ember tracked state  ←→  Templates
```

All data passes through a `DataService` singleton before reaching routes and templates. A separate `HandpickedService` manages handpicked product IDs independently.

---

## IndexedDB Schema

**Database name:** `admin-app-cache`  
**Version:** `1`  
**Store name:** `cache` (single key-value store, no indexes)

| Key | Value Shape | Managed By |
|---|---|---|
| `'admin-data'` | `{ products: [...], youtubeVideos: [...], lastSynced: "ISO-date" }` | `DataService` |
| `'handpicked-list'` | `{ ids: [1, 4, 7, ...] }` (up to 5 IDs) | `HandpickedService` |

Both keys live in the same store. The IndexedDB service exposes: `get(key)`, `set(key, value)`, `delete(key)`, `getAll()`.

---

## Data Fetching Flow

### Entry point: `DataService.fetchAll()`

```
Route.model()
  └── data.fetchAll()
        ├── Read 'admin-data' from IndexedDB
        │     ├── If cache exists AND not expired (default TTL: 1 hour)
        │     │     └── Hydrate this.products, this.youtubeVideos from cache → return
        │     └── If cache missing or expired
        │           └── syncAndFetch()
        │                 ├── POST /api/v1/rebuild-cache (fire-and-forget)
        │                 ├── GET /api/v1/all
        │                 ├── Parse response → this.products, this.youtubeVideos
        │                 ├── this.lastSynced = now
        │                 ├── saveToIndexedDB() → write 'admin-data'
        │                 └── Return { products, youtube_videos }
```

### Cache expiry check

```js
isCacheExpired(cached) {
  const expiryMs = cacheExpiryHours * 60 * 60 * 1000; // default 1 hour
  const cachedTime = new Date(cached.lastSynced).getTime();
  return Date.now() - cachedTime > expiryMs;
}
```

### Per-route model hooks

| Route | Fetches | Notes |
|---|---|---|
| `index` | products + youtube_videos | via `fetchAll()` |
| `products` / `products.index` | products | via `fetchAll()` |
| `products.edit` | single product | via `fetchAll()`, then filters by ID |
| `youtube` / `youtube.index` | youtube_videos | via `fetchAll()` |
| `youtube.edit` | single video | **Bypasses DataService** — calls `api.getAll()` directly |
| `handpicked` | all products + handpicked-filtered | via `fetchAll()`, then `HandpickedService.getHandpickedProducts()` |
| `products.new` / `youtube.new` | none | form components handle submission directly |

---

## Write Flow (Create/Update/Delete)

Writes go directly to the API server. The IndexedDB cache is **not invalidated** on writes — it relies on the 1-hour TTL or manual sync.

```
ProductForm/YoutubeForm
  └── api.createProduct(payload)   →   POST /api/v1/products
  └── api.updateProduct(payload)   →   PUT /api/v1/products
  └── api.deleteProduct(id)        →   DELETE /api/v1/products
        └── transitionTo() → re-enters route
              └── model() → fetchAll() → reads stale cache OR re-fetches
```

To see fresh data immediately, the user must use **Sync Data** or **Clear Cache**.

---

## Handpicked Data Flow

Handpicked data is maintained **independently** from the API. Product IDs are stored locally in IndexedDB and then applied as flags onto the fetched product list.

### Reading

```
HandpickedRoute.model()
  └── data.fetchAll() → all products (from cache or server)
  └── handpicked.getHandpickedProducts(allProducts)
        └── Reads this.items (loaded from IndexedDB 'handpicked-list' on init)
        └── Builds a Map<id, product> from allProducts
        └── Maps stored IDs to product objects → returns up to 5 products
```

### Writing (via ProductForm)

```
User toggles "Handpicked" checkbox + sets order in ProductForm
  └── product-form.js modifies product.handpicked / product.handpicked_order
  └── product-form.js calls handpicked.updateList(newIds, dataService)
        ├── Saves new IDs to IndexedDB 'handpicked-list'
        ├── Mutates products in dataService with handpicked=true/false + order
        ├── Calls dataService.saveToIndexedDB() (updates 'admin-data' with flags)
        └── Triggers reactivity (dataService.products = [...allProducts])
```

---

## Sync & Clear Cache

### Sync Data (rate-limited: 10/day)

```
Sidebar "Sync Data" button
  └── handleSync()
        ├── Check localStorage 'sync-clicks' counter
        ├── data.forceSync() → syncAndFetch()
        │     ├── POST /api/v1/rebuild-cache (server rebuilds server-side cache)
        │     ├── GET /api/v1/all
        │     ├── Overwrite this.products, this.youtubeVideos, this.lastSynced
        │     └── Save to IndexedDB
        └── window.location.reload()
```

### Clear Cache (rate-limited: 20/day)

```
Sidebar "Clear Cache" button
  └── handleClearCache()
        ├── Check localStorage 'clear-cache-clicks' counter
        ├── Confirm dialog
        ├── indexedDb.delete('admin-data')          ← Deletes cached data
        ├── data.forceSync()                         ← Fetch fresh from server
        └── window.location.reload()
```

### Rate limiting

Both buttons use `localStorage` (not IndexedDB) to store daily click counts:

```json
{
  "date": "Fri May 22 2026",
  "count": 3
}
```

The date resets each day. Limits: **10/day for Sync**, **20/day for Clear Cache**.

---

## API Endpoints

All at prefix `/api/v1`.

| Endpoint | Method | Purpose | Used By |
|---|---|---|---|
| `/all` | GET | Fetch all products + YouTube videos | `DataService`, `api.getAll()` |
| `/rebuild-cache` | POST | Trigger server-side cache rebuild | `DataService.syncAndFetch()` |
| `/products` | POST | Create product | `api.createProduct()` |
| `/products` | PUT | Update product | `api.updateProduct()` |
| `/products` | DELETE | Delete product | `api.deleteProduct()` |
| `/upload-image` | POST | Upload and resize image | `api.uploadImage()` |
| `/delete-image` | DELETE | Delete image | `api.deleteImage()` |
| `/youtube` | POST | Create YouTube record | `api.createYoutube()` |
| `/youtube` | DELETE | Delete YouTube record | `api.deleteYoutube()` |

---

## Data Flow Diagram

```
                       ┌──────────────────────┐
                       │    IndexedDB Store    │
                       │  (admin-app-cache)    │
                       │                      │
                       │  ┌──────────────────┐ │
                       │  │  'admin-data'    │ │
                       │  │  - products[]    │ │
                       │  │  - youtubeVideos │ │
                       │  │  - lastSynced    │ │
                       │  └──────────────────┘ │
                       │  ┌──────────────────┐ │
                       │  │'handpicked-list' │ │
                       │  │  - ids[]         │ │
                       │  └──────────────────┘ │
                       └──────────┬───────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                │                 │                  │
         DataService       HandpickedService    IndexedDBService
        (read/write both)   (read/write IDs)    (low-level ops)
                │                 │
                └─────────────────┘
                        │
                        ▼
              ┌──────────────────────┐
              │   API Server (/api)  │
              └──────────────────────┘
                        │
                        ▼
              ┌──────────────────────┐
              │   Route model()      │
              │   hooks              │
              └──────────────────────┘
                        │
                        ▼
              ┌──────────────────────┐
              │   Templates &        │
              │   Components         │
              └──────────────────────┘
```
