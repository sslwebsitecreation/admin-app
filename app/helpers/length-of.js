import { helper } from '@ember/component/helper';

export default helper(function lengthOf([value]) {
  if (!value) return 0;
  if (typeof value === 'string') {
    const parts = value.split(',').filter(Boolean);
    return parts.length;
  }
  if (Array.isArray(value)) return value.length;
  return 0;
});
