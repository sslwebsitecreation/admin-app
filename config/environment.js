'use strict';

module.exports = function (environment) {
  let ENV = {
    modulePrefix: 'admin-app',
    environment,
    rootURL: '/',
    locationType: 'auto',
    EmberENV: {
      FEATURES: {
      },
      EXTEND_PROTOTYPES: {
        Date: false,
      },
    },

    APP: {
      apiBaseUrl: '/api/v1',
      imageCdnUrl: 'https://images.abc.in',
    },
  };

  if (environment === 'development') {
    ENV['ember-cli-mirage'] = {
      enabled: true
    };
  }

  if (environment === 'test') {
    ENV.locationType = 'none';
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;
    ENV.APP.rootElement = '#ember-testing';
    ENV.APP.autoboot = false;
  }

  if (environment === 'production') {
  }

  return ENV;
};
