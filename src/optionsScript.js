// optionsScript.js - Manifest V3 (chrome.storage.local)

function save_options() {
  var checkbox_opencomments    = document.getElementById('opencomments');
  var checkbox_openvisitedlinks = document.getElementById('openvisitedlinks');
  var checkbox_opennsfwlinks   = document.getElementById('opennsfwlinks');
  var checkbox_openlinksdirectly = document.getElementById('openlinksdirectly');
  var input_tabslimit          = document.getElementById('tabslimit');
  var input_keyboardshortcut   = document.getElementById('keyboardshortcut');

  if (isNaN(input_tabslimit.value) || input_tabslimit.value.trim() === '') {
    alert('Only Integer for New Tabs Limit!');
    chrome.storage.local.get(['tabslimit'], function(items) {
      input_tabslimit.value = items.tabslimit || 25;
    });
    return;
  }

  chrome.storage.local.get(['keyboardshortcut'], function(items) {
    var oldShortcut = items.keyboardshortcut;

    chrome.storage.local.set({
      opencomments:     checkbox_opencomments.checked,
      openvisitedlinks: checkbox_openvisitedlinks.checked,
      opennsfwlinks:    checkbox_opennsfwlinks.checked,
      openlinksdirectly: checkbox_openlinksdirectly.checked,
      tabslimit:        parseInt(input_tabslimit.value),
      oldkeyboardshortcut: oldShortcut,
      keyboardshortcut: input_keyboardshortcut.value
    }, function() {
      chrome.runtime.sendMessage({action: 'updateSettingsFromOptions'});

      var status = document.getElementById('status');
      status.innerHTML = '<span style="color:#FF0000">Options Saved.</span><br>';
      setTimeout(function() {
        status.innerHTML = '';
      }, 750);
    });
  });
}

function restore_options() {
  chrome.storage.local.get(
    ['opencomments', 'openvisitedlinks', 'opennsfwlinks', 'openlinksdirectly', 'tabslimit', 'keyboardshortcut'],
    function(items) {
      document.getElementById('opencomments').checked     = (items.opencomments === 'true' || items.opencomments === true);
      document.getElementById('openvisitedlinks').checked = (items.openvisitedlinks === 'true' || items.openvisitedlinks === true);
      document.getElementById('opennsfwlinks').checked    = (items.opennsfwlinks === 'true' || items.opennsfwlinks === true);
      document.getElementById('openlinksdirectly').checked = (items.openlinksdirectly === 'true' || items.openlinksdirectly === true);
      document.getElementById('tabslimit').value          = items.tabslimit !== undefined ? items.tabslimit : 25;
      document.getElementById('keyboardshortcut').value   = items.keyboardshortcut || 'Ctrl+Shift+F';
    }
  );
}

document.addEventListener('DOMContentLoaded', function() {
  document.querySelector('button').addEventListener('click', function() {
    setTimeout(save_options, 0);
  });
  restore_options();
});
