'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function (defaults) {
  let app = new EmberApp(defaults, {
    'ember-cli-babel': { enableTypeScriptTransform: true },
    'fingerprint': { prepend: '/admin-app/' }
  });

  app.import('app/styles/app.css');

  return app.toTree();
};