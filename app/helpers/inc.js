import { helper } from '@ember/component/helper';

export default helper(function inc([num]) {
  return num + 1;
});