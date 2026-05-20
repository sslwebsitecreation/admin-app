import { helper } from '@ember/component/helper';

export default helper(function split([string, delimiter]) {
  if (!string) return [];
  return string.split(delimiter || ',');
});
