import Service from '@ember/service';

const API_BASE = '/api/v1';

export default class ApiService extends Service {
  async getAll() {
    const response = await fetch(`${API_BASE}/all`);
    return response.json();
  }

  async createProduct(data) {
    const response = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async updateProduct(data) {
    const response = await fetch(`${API_BASE}/products`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async deleteProduct(id) {
    const response = await fetch(`${API_BASE}/products`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    return response.json();
  }

  async uploadImage(file, width = 1200, height = 1600) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('width', width.toString());
    formData.append('height', height.toString());

    const response = await fetch(`${API_BASE}/upload-image`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  }

  async deleteImage(key) {
    const response = await fetch(`${API_BASE}/delete-image`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });
    return response.json();
  }

  async createYoutube(data) {
    const response = await fetch(`${API_BASE}/youtube`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async updateYoutube(data) {
    const response = await fetch(`${API_BASE}/youtube`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async deleteYoutube(id) {
    const response = await fetch(`${API_BASE}/youtube`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    return response.json();
  }
}