import { helper } from '@ember/component/helper';

export default helper(function imageUrl([relativePath]) {
  if (!relativePath) return null;
  if (relativePath.startsWith('http')) return relativePath;

  let hostname = window.location.hostname;

  if (hostname.startsWith('admin.')) {
    hostname = hostname.replace(/^admin\./, 'images.');
  }

  return `${window.location.protocol}//${hostname}/${relativePath}`;
});