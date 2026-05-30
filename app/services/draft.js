import Service from '@ember/service';
import { inject as service } from '@ember/service';

const DRAFT_KEY = 'product-draft';

export default class DraftService extends Service {
  @service indexedDb;

  async saveDraft(data) {
    const draft = {
      ...data,
      savedAt: new Date().toISOString(),
    };
    await this.indexedDb.set(DRAFT_KEY, draft);
  }

  async loadDraft() {
    try {
      const draft = await this.indexedDb.get(DRAFT_KEY);
      if (!draft) return null;
      return draft;
    } catch (e) {
      return null;
    }
  }

  async clearDraft() {
    try {
      await this.indexedDb.delete(DRAFT_KEY);
    } catch (e) {
      // ignore
    }
  }

  async clearDraftWithImages(api) {
    const draft = await this.loadDraft();
    if (draft?.images) {
      for (const img of draft.images) {
        if (img.key) {
          try {
            await api.deleteImage(img.key);
          } catch (_) {
            // ignore
          }
        }
      }
    }
    await this.clearDraft();
  }
}
