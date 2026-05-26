import { helper } from '@ember/component/helper';

export default helper(function repeat([count]) {
  return new Array(count || 0).fill(null);
});
