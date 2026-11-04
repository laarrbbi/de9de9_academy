// Shows #app-error when the app has not drawn a screen after a few seconds:
// a missing file (content.js not built) or an error while starting. A plain
// script rather than a module, so it still runs when the modules fail to
// load; for the same reason its text lives in index.html, not i18n.js.
setTimeout(function () {
  if (!document.querySelector('#app > .screen')) {
    document.getElementById('app-error').hidden = false;
  }
}, 4000);
