import EmberRouter from '@ember/routing/router';
import config from 'admin-app/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  this.route('products', function () {
    this.route('new');
    this.route('edit', { path: '/edit/:id' });
  });
  this.route('youtube', function () {
    this.route('new');
    this.route('edit', { path: '/edit/:id' });
  });
  this.route('utilities', function () {
    this.route('image-converter');
  });
});