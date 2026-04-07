// background.js - Service Worker (Manifest V3)

function updateSettings() {
  chrome.storage.local.get(['keyboardshortcut', 'oldkeyboardshortcut'], function(items) {
    chrome.tabs.query({currentWindow: true}, function(tabs) {
      for (var i = 0; i < tabs.length; i++) {
        chrome.tabs.sendMessage(tabs[i].id, {
          action: 'updateSettings',
          keyboardshortcut: items.keyboardshortcut,
          oldkeyboardshortcut: items.oldkeyboardshortcut
        }).catch(function() {});
      }
    });
  });
}

function openAllUrls(tab) {
  chrome.tabs.sendMessage(tab.id, {
    action: 'openRedditLinks',
    tabid: tab.id
  }, function(response) {
    if (chrome.runtime.lastError || !response) return;

    chrome.storage.local.get(
      ['opencomments', 'openvisitedlinks', 'opennsfwlinks', 'openlinksdirectly', 'tabslimit'],
      function(settings) {
        openUrl(response.urls, 0, 0, response.tabid, settings);
      }
    );
  });
}

function openUrl(urls, index, count, tabid, settings) {
  if (index === urls.length) {
    if (count === 0) {
      chrome.tabs.sendMessage(tabid, {action: 'openNextPage'}).catch(function() {});
    }
    return;
  }

  var url = urls[index];

  if (!url[1].match(/^javascript:/i)) {
    var opencomments = (settings.opencomments === 'true' || settings.opencomments === true);
    var openvisitedlinks = (settings.openvisitedlinks === 'true' || settings.openvisitedlinks === true);
    var opennsfwlinks = (settings.opennsfwlinks === 'true' || settings.opennsfwlinks === true);
    var tabslimit = parseInt(settings.tabslimit) || 25;

    if (!opennsfwlinks && ((url[0].toLowerCase().indexOf('nsfw') !== -1) || url[3])) {
      openUrl(urls, index + 1, count, tabid, settings);
      return;
    }

    if (count >= tabslimit) {
      openUrl(urls, index + 1, count, tabid, settings);
      return;
    }

    chrome.history.getVisits({url: url[1]}, function(visitItems) {
      if (!(openvisitedlinks || ((visitItems.length === 0) && url[4]))) {
        openUrl(urls, index + 1, count, tabid, settings);
        return;
      }

      chrome.tabs.sendMessage(tabid, {
        action: 'scrapeInfoCompanionBar',
        index: index
      }).catch(function() {});

      // Add to history immediately so subsequent triggers skip this URL
      // (chrome.tabs.create only adds to history after the tab finishes loading)
      chrome.history.addUrl({url: url[1]});
      chrome.tabs.create({url: url[1], active: false});

      if (opencomments && url[2] && url[1] !== url[2]) {
        chrome.history.addUrl({url: url[2]});
        chrome.tabs.create({url: url[2], active: false});
      }

      openUrl(urls, index + 1, count + 1, tabid, settings);
    });
  } else {
    openUrl(urls, index + 1, count, tabid, settings);
  }
}

function checkVersion() {
  var currVersion = chrome.runtime.getManifest().version;

  chrome.storage.local.get(['version'], function(items) {
    var prevVersion = items.version;

    if (currVersion !== prevVersion) {
      if (prevVersion === undefined) {
        chrome.tabs.create({url: chrome.runtime.getURL('options.html'), active: true});
      } else {
        chrome.tabs.create({url: chrome.runtime.getURL('changelog.html'), active: true});
      }
      chrome.storage.local.set({version: currVersion});
    }
  });
}

function initDefaults() {
  chrome.storage.local.get(
    ['opencomments', 'openvisitedlinks', 'opennsfwlinks', 'openlinksdirectly', 'tabslimit', 'keyboardshortcut'],
    function(items) {
      var defaults = {};

      if (items.opencomments === undefined)     defaults.opencomments = 'false';
      if (items.openvisitedlinks === undefined)  defaults.openvisitedlinks = 'false';
      if (items.opennsfwlinks === undefined)     defaults.opennsfwlinks = 'true';
      if (items.openlinksdirectly === undefined) defaults.openlinksdirectly = 'false';
      if (items.tabslimit === undefined)         defaults.tabslimit = 25;
      if (items.keyboardshortcut === undefined)  defaults.keyboardshortcut = 'Ctrl+Shift+F';

      chrome.storage.local.set(defaults);
    }
  );
}

// Toolbar button click
chrome.action.onClicked.addListener(function(tab) {
  openAllUrls(tab);
});

// Messages from content scripts and options page
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  switch (request.action) {
    case 'keyboardShortcut':
      openAllUrls(sender.tab);
      break;

    case 'initKeyboardShortcut':
      chrome.storage.local.get(['keyboardshortcut'], function(items) {
        chrome.tabs.sendMessage(sender.tab.id, {
          action: 'updateSettings',
          keyboardshortcut: items.keyboardshortcut
        }).catch(function() {});
      });
      break;

    case 'updateSettingsFromOptions':
      updateSettings();
      break;

    default:
      break;
  }
});

// On install/update
chrome.runtime.onInstalled.addListener(function(details) {
  initDefaults();
  if (details.reason === 'install' || details.reason === 'update') {
    checkVersion();
  }
});

// On browser startup ensure defaults exist
chrome.runtime.onStartup.addListener(function() {
  initDefaults();
});
