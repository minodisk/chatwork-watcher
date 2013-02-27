(function (document, chrome) {
  'use strict';

  var __bind = function (fn, context) {
      return function () {
        return fn.apply(context, Array.prototype.slice.call(arguments));
      };
    }
    ;


  function Connection(port, elem) {
    if (Connection.instance != null) {
      Connection.instance.disconnect();
    }

    this.onChange = __bind(this.onChange, this);
    this.onDisconnect = __bind(this.onDisconnect, this);

    this.port = port;
    this.port.onDisconnect.addListener(this.onDisconnect);

    this.elem = elem;
    this.elem.addEventListener('DOMSubtreeModified', this.onChange);
    this.onChange();

    Connection.instance = this;
  }

  Connection.prototype.onChange = function () {
    var unread = +this.elem.innerText
      ;
    if (isNaN(unread)) {
      return;
    }
    this.port.postMessage({
      unread: unread
    });
  };

  Connection.prototype.onDisconnect = function () {
    console.log('onDisconnect');

    this.port.onDisconnect.removeListener(this.onDisconnect);

    this.elem.removeEventListener('DOMSubtreeModified', this.onChange);
    this.elem = null;

    Connection.instance = null;
  };

  Connection.prototype.disconnect = function () {
    console.log('disconnect');
    this.port.disconnect();
  };


  (function () {
    document.addEventListener('DOMContentLoaded', function () {
      var port
        , elem = document.querySelector('#cw_total_unread_room')
        ;

      console.log('connect to background');
      port = chrome.extension.connect({
        name: 'chatwork-ext'
      });
      new Connection(port, elem);

      chrome.extension.onConnect.addListener(function (port) {
        console.log('connect from background');
        new Connection(port, elem);
      });
    });
  })();

})(document, chrome);