// contentScript.js - Manifest V3 (no jQuery dependency)

var link_set = [];
var comment_set = [];

function isVisible(el) {
  return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
}

function hasAncestorWithClass(el, className) {
  var parent = el.parentElement;
  while (parent) {
    if (parent.classList && parent.classList.contains(className)) return true;
    parent = parent.parentElement;
  }
  return false;
}

function fakeClick(obj) {
  // Support Shreddit web components as well as old .thing containers
  var thing = obj.closest('shreddit-post') || obj.closest('.thing');
  if (thing) thing.classList.add('visited');

  var evObj = document.createEvent('MouseEvents');
  evObj.initMouseEvent('mousedown', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 1, null);
  obj.dispatchEvent(evObj);
}

function isNSFW(el) {
  return false;
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  switch (request.action) {
    case 'openRedditLinks': {
      var isShreddit  = !!document.querySelector('shreddit-post');
      var isOldReddit = !!document.getElementById('siteTable');

      if (isShreddit) {
        // www.reddit.com — Web Components layout (2024+)
        link_set = Array.from(document.querySelectorAll('shreddit-post a[slot="full-post-link"]')).filter(isVisible);
        // Fallback if slot attribute is not present
        if (link_set.length === 0) {
          link_set = Array.from(document.querySelectorAll('shreddit-post a[data-click-id="body"]')).filter(isVisible);
        }
        comment_set = Array.from(document.querySelectorAll('shreddit-post a[data-click-id="comments"]')).filter(isVisible);
      } else if (isOldReddit) {
        // old.reddit.com — classic layout
        link_set    = Array.from(document.querySelectorAll('#siteTable a.title')).filter(isVisible);
        comment_set = Array.from(document.querySelectorAll('#siteTable a.comments')).filter(isVisible);
      } else {
        // Legacy fallback — 2018 new-Reddit layout
        link_set    = Array.from(document.querySelectorAll('.scrollerItem a[data-click-id="body"]')).filter(isVisible);
        comment_set = Array.from(document.querySelectorAll('.scrollerItem a[data-click-id="comments"]')).filter(isVisible);
      }

      var data = [];
      for (var i = 0; i < link_set.length; i++) {
        var linkEl = link_set[i];
        var commentEl = comment_set[i] || null;
        var linkIsNSFW = isNSFW(linkEl);
        var linkNotVisited = !hasAncestorWithClass(linkEl, 'visited');

        data.push([
          linkEl.textContent.trim(),
          linkEl.href,
          commentEl ? commentEl.href : '',
          linkIsNSFW,
          linkNotVisited
        ]);
      }

      if (data.length > 0) {
        sendResponse({urls: data, tabid: request.tabid});
      }
      break;
    }

    case 'openNextPage': {
      var isOldReddit = !!document.getElementById('siteTable');

      if (isOldReddit) {
        var nextLink = document.querySelector('.nextprev a[rel~="next"]');
        if (nextLink) window.location = nextLink.href;
      } else {
        // Shreddit and legacy new Reddit both use infinite scroll
        window.scrollTo(0, document.body.scrollHeight);
      }
      break;
    }

    case 'scrapeInfoCompanionBar':
      if (link_set[request.index]) {
        fakeClick(link_set[request.index]);
      }
      break;

    case 'updateSettings':
      if (request.keyboardshortcut !== request.oldkeyboardshortcut) {
        if (request.oldkeyboardshortcut) {
          shortcut.remove(request.oldkeyboardshortcut);
        }
        shortcut.add(request.keyboardshortcut, function() {
          chrome.runtime.sendMessage({action: 'keyboardShortcut'});
        });
      }
      break;

    default:
      break;
  }

  return true;
});

chrome.runtime.sendMessage({action: 'initKeyboardShortcut'});
