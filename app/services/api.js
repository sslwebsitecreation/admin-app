import Service from '@ember/service';

const API_BASE = '/api/v1';
let _redirecting = false;

function handleAuthFailure() {
  if (_redirecting) return;
  _redirecting = true;
  const loginUrl =
    '/cdn-cgi/access/login?redirect_url=' +
    encodeURIComponent(window.location.href);
  window.location.href = loginUrl;
}

async function _fetch(url, options = {}) {
  const response = await fetch(url, options);
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('json')) {
    handleAuthFailure();
    throw new Error('Non-JSON response from server');
  }
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthFailure();
    }
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

export default class ApiService extends Service {
  async getAll() {
    return _fetch(`${API_BASE}/all`);
  }

  async createProduct(data) {
    return _fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async updateProduct(data) {
    return _fetch(`${API_BASE}/products`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id) {
    return _fetch(`${API_BASE}/products`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  }

  async uploadImage(file, width = 1200, height = 1600) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('width', width.toString());
    formData.append('height', height.toString());

    return _fetch(`${API_BASE}/upload-image`, {
      method: 'POST',
      body: formData,
    });
  }

  async deleteImage(key) {
    return _fetch(`${API_BASE}/delete-image`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });
  }

  async createYoutube(data) {
    return _fetch(`${API_BASE}/youtube`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async updateYoutube(data) {
    return _fetch(`${API_BASE}/youtube`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async deleteYoutube(id) {
    return _fetch(`${API_BASE}/youtube`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  }
}
