import { helper } from '@ember/component/helper';

export default helper(function and([a, b]) {
  return a && b;
});
