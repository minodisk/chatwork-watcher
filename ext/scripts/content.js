(function (document, chrome) {
  'use strict';

  var __bind = function (fn, context) {
      return function () {
        return fn.apply(context, Array.prototype.slice.call(arguments));
      };
    }
    ;


  function Connection(port, $status, $unread) {
    if (Connection.instance != null) {
      Connection.instance.disconnect();
    }

    this._onDisconnect = __bind(this._onDisconnect, this);
    this._checkStatus = __bind(this._checkStatus, this);
    this._onUnreadChange = __bind(this._onUnreadChange, this);

    this._port = port;
    this._port.onDisconnect.addListener(this._onDisconnect);

    // watch offline notification
    this._$status = $status;
    this._statusIntervalId = setInterval(this._checkStatus, 1000);
    this._checkStatus();

    this._$unread = $unread;
    this._$unread.addEventListener('DOMSubtreeModified', this._onUnreadChange);
    this._onUnreadChange();

    Connection.instance = this;
  }

  Connection.prototype._onDisconnect = function () {
    console.log('_onDisconnect');

    this._port.onDisconnect.removeListener(this._onDisconnect);

    clearInterval(this._statusIntervalId);
    this._$status = null;

    this._$unread.removeEventListener('DOMSubtreeModified', this._onUnreadChange);
    this._$unread = null;

    Connection.instance = null;
  };

  Connection.prototype._checkStatus = function () {
    var display = getComputedStyle(this._$status, '').display
      ;
    if (display === this._statusDisplay) {
      return;
    }
    this._statusDisplay = display;
    this._port.postMessage({
      status: this._statusDisplay !== 'block'
    });
  };

  Connection.prototype._onUnreadChange = function () {
    var unread = +this._$unread.innerText
      ;
    if (isNaN(unread)) {
      return;
    }
    this._port.postMessage({
      unread: unread
    });
  };

  Connection.prototype.disconnect = function () {
    console.log('disconnect');
    this._port.disconnect();
  };


  (function () {
    document.addEventListener('DOMContentLoaded', function () {
      var connection
        , port
        , $unread = document.querySelector('#cw_total_unread_room')
        , $status = document.querySelector('#cw_offline')
        ;

      console.log('connect to background');
      port = chrome.extension.connect({
        name: 'chatwork-watcher'
      });
      connection = new Connection(port, $status, $unread);

      chrome.extension.onConnect.addListener(function (port) {
        console.log('connect from background');
        connection = new Connection(port, $status, $unread);
      });
    });

  })();

})(document, chrome);