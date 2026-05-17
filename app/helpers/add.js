import { helper } from '@ember/component/helper';

export default helper(function add([num, amount = 1]) {
  return num + amount;
});