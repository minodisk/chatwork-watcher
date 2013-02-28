(function (chrome) {
  'use strict';

  var __bind = function (fn, context) {
      return function () {
        return fn.apply(context, Array.prototype.slice.call(arguments));
      };
    }
    ;


  function Icon() {
    this.setActive(false);
  }

  Icon.prototype.setActive = function (active) {
    if (active === this.active) {
      return
    }
    this.active = active;
    chrome.browserAction.setIcon({
      path: 'images/icon19_' + (!this.status ? 'onffline' : this.active ? 'normal' : 'disconnected') + '.png'
    });
    chrome.browserAction.setBadgeBackgroundColor({
      color: [0xcc, 0xcc, 0xcc, 0xff]
    });
    chrome.browserAction.setBadgeText({
      text: '?'
    });
  };

  Icon.prototype.setStatus = function (status) {
    if (status === this.status) {
      return
    }
    this.status = status;
    chrome.browserAction.setIcon({
      path: 'images/icon19_' + (!this.status ? 'onffline' : this.active ? 'normal' : 'disconnected') + '.png'
    });
    chrome.browserAction.setBadgeBackgroundColor({
      color: [0xcc, 0xcc, 0xcc, 0xff]
    });
    chrome.browserAction.setBadgeText({
      text: '!'
    });
  };

  Icon.prototype.setUnread = function (unread) {
    chrome.browserAction.setBadgeBackgroundColor({
      color: unread === 0 ? [0, 0, 0, 100] : [255, 0, 0, 255]
    });
    chrome.browserAction.setBadgeText({
      text: unread > 999 ? '999+' : '' + unread
    });
  };


  Connection._connections = {};

  Connection.hasConnection = function () {
    return Object.keys(Connection._connections).length !== 0;
  };

  Connection.addConnection = function (tabId, connection) {
    Connection._connections[tabId] = connection;
  };

  Connection.removeConnection = function (tabId) {
    Connection._connections[tabId].disconnect();
    delete Connection._connections[tabId];
  };

  Connection.getConnection = function (tabId) {
    return Connection._connections[tabId];
  };

  function Connection(tab, port, icon) {
    this.onDisconnect = __bind(this.onDisconnect, this);
    this.onMessage = __bind(this.onMessage, this);
    this.tab = tab;
    this.port = port;
    this.port.onDisconnect.addListener(this.onDisconnect);
    this.port.onMessage.addListener(this.onMessage);
    this.icon = icon;

    Connection.addConnection(this.tab.id, this);
    this.icon.setActive(Connection.hasConnection());
  }

  Connection.prototype.disconnect = function () {
    console.log('disconnect');
    this.port.disconnect();
  };

  Connection.prototype.onDisconnect = function () {
    console.log('onDisconnect');
    this.port.onDisconnect.removeListener(this.onDisconnect);
    this.port.onMessage.removeListener(this.onMessage);

    Connection.removeConnection(this.tab.id);
    this.icon.setActive(Connection.hasConnection());
  };

  Connection.prototype.onMessage = function (msg) {
    console.log('onMessage:', msg);
    if (msg.status != null) {
      this.icon.setStatus(msg.status);
    }
    if (msg.unread != null) {
      this.icon.setUnread(msg.unread);
    }
  };


  (function () {
    var icon = new Icon()
      , rURL = /^https?:\/\/\w+\.chatwork.com\//
      , getAllTabs = function () {
        var d = new Deferred()
          ;
        chrome.windows.getAll({
          populate: true
        }, function (windows) {
          var tabs = []
            ;
          windows.forEach(function (window) {
            tabs = tabs.concat(window.tabs);
          });
          d.call(tabs);
        });
        return d;
      }
      ;

    getAllTabs()
      .next(function (tabs) {
        tabs.forEach(function (tab) {
          if (!rURL.test(tab.url) || Connection.getConnection(tab.id) != null) {
            return;
          }
          console.log('connect to content:', tab.id);
          new Connection(tab, chrome.tabs.connect(tab.id), icon);
        });
      });

    chrome.extension.onConnect.addListener(function (port) {
      console.log('connected from content:', port.sender.tab.id);
      var connection
        ;
      if (connection = Connection.getConnection(port.sender.tab.id)) {
        connection.disconnect();
      }
      console.log(port);
      new Connection(port.sender.tab, port, icon);
    });

    chrome.browserAction.onClicked.addListener(function () {
      getAllTabs()
        .next(function (tabs) {
          var targetTabs = []
            ;

          tabs.forEach(function (tab) {
            if (!rURL.test(tab.url)) {
              return;
            }
            targetTabs.push(tab);
          });

          targetTabs.sort(function (a, b) {
            return a.index - b.index;
          });

          if (targetTabs.length !== 0) {
            chrome.tabs.highlight({
              windowId: targetTabs[0].windowId,
              tabs    : targetTabs[0].index
            }, function (window) {
            });
          } else {
            chrome.tabs.create({
              index : 0,
              url   : 'https://www.chatwork.com/',
              active: true,
              pinned: true
            });
          }
        });
    });

  })();

})(chrome);