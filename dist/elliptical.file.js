(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['exports', 'elliptical-generic-repository'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require('elliptical-generic-repository'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.elliptical.GenericRepository);
    global.elliptical.FileLocalProvider = mod.exports.default;
  }
})(this, function (exports, _ellipticalGenericRepository) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _ellipticalGenericRepository2 = _interopRequireDefault(_ellipticalGenericRepository);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var FileLocalProvider = function () {
    function FileLocalProvider(dbName) {
      _classCallCheck(this, FileLocalProvider);

      this._dbName = dbName ? dbName : 'EllipticalLocalFileStore';
      this._db = null;
      this._initDb();
      this._repo = new _ellipticalGenericRepository2.default([]);
      this._progressCallback = null;
    }

    _createClass(FileLocalProvider, [{
      key: '_initDb',
      value: function _initDb() {
        var self = this;
        var db;
        var request = window.indexedDB.open(this._dbName, 1);
        request.onerror = function (event) {
          console.warn('Error opening database');
        };
        request.onsuccess = function (event) {
          db = event.target.result;
          self._db = db;
        };
        request.onupgradeneeded = function (event) {
          db = event.target.result;
          // Create an objectStore for this database
          var objectStore = db.createObjectStore("objFiles", { keyPath: "id" });
          //create
          objectStore.createIndex("id", "id", { unique: true });
          self._db = db;
        };
      }
    }, {
      key: 'get',
      value: function get(params, resource, query, callback) {
        var self = this;
        var transaction = this._db.transaction(["objFiles"]);
        var objectStore = transaction.objectStore("objFiles");
        if (params && params.id) {
          var request = objectStore.get(params.id);
          request.onsuccess = function (event) {
            if (callback) callback(null, request.result);
          };
          request.onerror = function (event) {
            if (callback) callback({ statusCode: 500, message: request.error.message }, params);
          };
        } else {
          var result = [];
          var direction;
          if (query && query.orderByDesc) direction = 'prev';else direction = 'next';

          objectStore.openCursor(null, direction).onsuccess = function (event) {
            var cursor = event.target.result;
            if (cursor) {
              result.push(cursor.value);
              cursor.continue();
            }else{
              if (query && query.filter && query.filter !== undefined) result = self.query(result, query.filter);
              if (callback) callback(null, result);
            }
          };
        }
      }
    }, {
      key: 'post',
      value: function post(params, resource, callback) {
        var self = this;
        var reader = new FileReader();
        var blob = params.blob;
        reader.readAsDataURL(blob);
        reader.onload = function (evt) {
          var transaction = self._db.transaction(["objFiles"], "readwrite");
          var objectStore = transaction.objectStore("objFiles");
          params.dataUrl = evt.target.result;
          var request = objectStore.add(params);
          request.onsuccess = function (event) {
            self._simulateProgress(params, callback);
          };
          request.onerror = function (event) {
            if (callback) callback({ statusCode: 500, message: request.error.message }, params);
          };
        };
      }
    }, {
      key: 'put',
      value: function put(params, resource, callback) {
        if (callback) callback({ statusCode: 501, message: 'Put not implemented' });
      }
    }, {
      key: 'delete',
      value: function _delete(params, resource, callback) {
        var transaction = this._db.transaction(["objFiles"]);
        var objectStore = transaction.objectStore("objFiles");
        var request = objectStore.delete(params.id);
        request.onsuccess = function (event) {
          if (callback) callback(null, null);
        };
        request.onerror = function (event) {
          if (callback) callback({ statusCode: 500, message: request.error.message }, null);
        };
      }
    }, {
      key: 'abort',
      value: function abort() {
        console.warn('Warning: abort file upload not implemented for local database provider');
      }
    }, {
      key: 'query',
      value: function query(data, filter, asEnumerable) {
        var keys = Object.keys(filter);
        filter = filter[keys[0]];
        filter = filter.toLowerCase();
        var result = this.enumerable(data).Where(function (x) {
          return x.id.toLowerCase().indexOf(filter) == 0;
        });
        return result.ToArray();
      }
    }, {
      key: 'onProgress',
      value: function onProgress(fn) {
        this._progressCallback = fn;
      }
    }, {
      key: '_simulateProgress',
      value: function _simulateProgress(params, callback) {
        var MAX_COUNT = 4;
        var progressCb = this._progressCallback;
        var total = params.total;
        var i = 1;
        var fltSize = parseFloat(total / 1000).toFixed(2);
        var e = {
          total: total,
          size: fltSize.toString() + ' KB',
          loaded: null,
          progress: null,
          id: params.id,
          lengthComputable: true
        };
        var intervalId = setInterval(function () {
          var loaded = Math.round(total * (i / MAX_COUNT));
          var progress = Math.round(loaded * 100 / e.total);
          e.loaded = loaded;
          e.progress = progress;
          e.completed = i === MAX_COUNT;
          if (progressCb) progressCb(e);
          if (i === MAX_COUNT) {
            clearInterval(intervalId);
            if (callback) callback(null, params);
          } else i += 1;
        }, 500);
      }
    }]);

    return FileLocalProvider;
  }();

  exports.default = FileLocalProvider;
});
(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['exports', 'elliptical-rest-provider'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require('elliptical-rest-provider'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.elliptical.RestProvider);
    global.elliptical.FileRestProvider = mod.exports.default;
  }
})(this, function (exports, _ellipticalRestProvider) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _ellipticalRestProvider2 = _interopRequireDefault(_ellipticalRestProvider);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  var FileRestProvider = function (_RestProvider) {
    _inherits(FileRestProvider, _RestProvider);

    function FileRestProvider($provider, useEntity) {
      _classCallCheck(this, FileRestProvider);

      var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(FileRestProvider).call(this, $provider));

      _this._progressCallback = null;
      _this._xhr = null;
      _this._entity = null;
      _this.useEntity = false;
      _this._postCallback = null;
      _this._lengthComputable = true;
      _this._iteration = 0;
      if (useEntity !== undefined) _this.useEntity = useEntity;
      return _this;
    }

    _createClass(FileRestProvider, [{
      key: 'post',
      value: function post(params, resource, callback) {
        this._lengthComputable = true;
        this._iteration = 0;
        this._entity = params;
        this._postCallback = callback;
        var url = this.baseEndpoint + '/' + resource;
        this._xhr = new XMLHttpRequest();
        if (this.useEntity) this._entityUpload(params, url);else this._fileUpload(params, url);
      }
    }, {
      key: 'put',
      value: function put(params, resource, callback) {
        if (callback) callback({ statusCode: 501, message: 'Put not implemented' });
      }
    }, {
      key: 'onProgress',
      value: function onProgress(fn) {
        this._progressCallback = fn;
      }
    }, {
      key: 'abort',
      value: function abort() {
        var xhr = this._xhr;
        xhr.abort();
      }
    }, {
      key: '_entityUpload',
      value: function _entityUpload(params, url) {
        var xhr = this._xhr;
        xhr.upload.addEventListener("progress", this._onEntityProgress.bind(this), false);
        xhr.upload.addEventListener("load", this._onEntityComplete.bind(this), false);
        xhr.upload.addEventListener("error", this._onEntityError.bind(this), false);
        var reader = new FileReader();
        var blob = params.blob;
        reader.readAsDataURL(blob);
        reader.onload = function (evt) {
          params.dataUrl = evt.target.result;
          xhr.open("POST", url);
          xhr.send(params);
        };
      }
    }, {
      key: '_fileUpload',
      value: function _fileUpload(params, url) {
        var xhr = this._xhr;
        xhr.upload.addEventListener("progress", this._onFileProgress.bind(this), false);
        xhr.upload.addEventListener("load", this._onFileComplete.bind(this), false);
        xhr.upload.addEventListener("error", this._onFileError.bind(this), false);
        var formData = new FormData();
        formData.append('file', params);
        xhr.open("POST", url);
        xhr.overrideMimeType('text/plain; charset=x-user-defined-binary');
        xhr.send(formData);
      }
    }, {
      key: '_onFileProgress',
      value: function _onFileProgress(event) {
        if (!this._progressCallback) return;
        var id = this._entity.id;
        var total = event.size;
        var fltSize = parseFloat(total / 1000).toFixed(2);
        if (event.lengthComputable) {
          var e = {
            size: fltSize.toString() + ' KB',
            total: total,
            loaded: event.loaded,
            progress: null,
            id: id,
            lengthComputable: true,
            completed: false
          };
          e.completed = e.loaded === e.total;
          e.progress = Math.round(e.loaded * 100 / e.total);
          this._progressCallback(e);
        } else this._progressCallback(event);
      }
    }, {
      key: '_onFileComplete',
      value: function _onFileComplete(event) {
        this._removeFileListeners();
        var entity = this._entity;
        entity.complete = true;
        entity.error = false;
        var callback = this._postCallback;
        if (callback) callback(null, entity);
      }
    }, {
      key: '_onFileError',
      value: function _onFileError(event) {
        var entity = this._entity;
        this._removeFileListeners();
        var callback = this._postCallback;
        entity.error = true;
        entity.complete = false;
        var err = {
          statusCode: 500,
          message: 'Error uploading file'
        };
        if (callback) callback(err, entity);
      }
    }, {
      key: '_removeFileListeners',
      value: function _removeFileListeners() {
        var xhr = this._xhr;
        xhr.upload.addEventListener("progress", this._onFileProgress.bind(this), false);
        xhr.upload.addEventListener("load", this._onFileComplete.bind(this), false);
        xhr.upload.addEventListener("error", this._onFileError.bind(this), false);
      }
    }, {
      key: '_onEntityProgress',
      value: function _onEntityProgress(event) {
        var progressCb = this._progressCallback;
        if (!progressCb) return;
        var MAX_COUNT = 90;
        var id = this._entity.id;
        var e, total, fltSize;
        if (event.lengthComputable) {
          total = event.total;
          fltSize = parseFloat(total / 1000).toFixed(2);
          e = {
            size: fltSize.toString() + ' KB',
            total: total,
            loaded: event.loaded,
            progress: null,
            id: id,
            lengthComputable: true,
            completed: false
          };
          e.progress = Math.round(e.loaded * 100 / e.total);
          progressCb(e);
        } else {
          var iteration = this._iteration;
          this._lengthComputable = false;
          var entity = this._entity;
          total = entity.total;
          fltSize = parseFloat(total / 1000).toFixed(2);
          e = {
            size: fltSize.toString() + ' KB',
            total: total,
            loaded: null,
            progress: null,
            id: id,
            lengthComputable: true,
            completed: false
          };
          if (iteration < MAX_COUNT - 2) {
            iteration += 1;
            this._iteration = iteration;
          }
          var loaded = Math.round(size * (iteration / MAX_COUNT));
          var progress = Math.round(loaded * 100 / e.total);
          e.loaded = loaded;
          e.progress = progress;
          progressCb(e);
        }
      }
    }, {
      key: '_onEntityComplete',
      value: function _onEntityComplete(event) {
        this._removeEntityListeners();
        var entity = this._entity;
        if (!this._lengthComputable) this._fireEntityLoadComplete();
        var callback = this._postCallback;
        if (callback) callback(null, entity);
      }
    }, {
      key: '_onEntityError',
      value: function _onEntityError(event) {
        var entity = this._entity;
        entity.error = true;
        entity.complete = false;
        this._removeEntityListeners();
        var callback = this._postCallback;
        var err = {
          statusCode: 500,
          message: 'Error uploading file entity'
        };
        if (callback) callback(err, entity);
      }
    }, {
      key: '_removeEntityListeners',
      value: function _removeEntityListeners() {
        var xhr = this._xhr;
        xhr.upload.addEventListener("progress", this._onEntityProgress.bind(this), false);
        xhr.upload.addEventListener("load", this._onEntityComplete.bind(this), false);
        xhr.upload.addEventListener("error", this._onEntityError.bind(this), false);
      }
    }, {
      key: '_fireEntityLoadComplete',
      value: function _fireEntityLoadComplete() {
        var progressCb = this._progressCallback;
        if (!progressCb) return;
        var entity = this._entity;
        var total = entity.total;
        var fltSize = parseFloat(total / 1000).toFixed(2);

        var e = {
          size: fltSize.toString() + ' KB',
          total: total,
          loaded: total,
          progress: 100,
          completed: true,
          error: false,
          id: entity.id,
          lengthComputable: true
        };

        progressCb(e);
      }
    }]);

    return FileRestProvider;
  }(_ellipticalRestProvider2.default);

  exports.default = FileRestProvider;
});
(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['exports', 'elliptical-service'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require('elliptical-service'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.elliptical.Service);
    global.elliptical.FileService = mod.exports.default;
  }
})(this, function (exports, _ellipticalService) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _ellipticalService2 = _interopRequireDefault(_ellipticalService);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function _asyncToGenerator(fn) {
    return function () {
      var gen = fn.apply(this, arguments);
      return new Promise(function (resolve, reject) {
        function step(key, arg) {
          try {
            var info = gen[key](arg);
            var value = info.value;
          } catch (error) {
            reject(error);
            return;
          }

          if (info.done) {
            resolve(value);
          } else {
            return Promise.resolve(value).then(function (value) {
              return step("next", value);
            }, function (err) {
              return step("throw", err);
            });
          }
        }

        return step("next");
      });
    };
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  var FileService = function (_Service) {
    _inherits(FileService, _Service);

    function FileService() {
      _classCallCheck(this, FileService);

      return _possibleConstructorReturn(this, Object.getPrototypeOf(FileService).apply(this, arguments));
    }

    _createClass(FileService, [{
      key: 'post',
      value: function post(params, callback) {
        this.constructor.post(params, callback);
      }
    }, {
      key: 'postAsync',
      value: function postAsync(params) {
        return this.constructor.postAsync(params);
      }
    }, {
      key: 'onProgress',
      value: function onProgress(fn) {
        this.constructor.onProgress(fn);
      }
    }, {
      key: 'abort',
      value: function abort() {
        this.$provider.abort();
      }
    }], [{
      key: 'post',
      value: function post(params, callback) {
        var $provider = this.$provider,
            resource = this['@resource'];
        $provider.post(params, resource, callback);
      }
    }, {
      key: 'postAsync',
      value: function () {
        var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(params) {
          var $provider, resource;
          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  $provider = this.$provider;
                  resource = this['@resource'];
                  return _context.abrupt('return', new Promise(function (resolve, reject) {
                    $provider.post(params, resource, function (err, data) {
                      if (err) reject(err);else resolve(data);
                    });
                  }));

                case 3:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, this);
        }));

        function postAsync(_x) {
          return _ref.apply(this, arguments);
        }

        return postAsync;
      }()
    }, {
      key: 'onProgress',
      value: function onProgress(fn) {
        var context = this;
        var $provider = this.$provider;
        $provider.onProgress(function (e) {
          if (fn) fn.call(context, e);
        });
      }
    }]);

    return FileService;
  }(_ellipticalService2.default);

  FileService["@resource"] = 'File';

  exports.default = FileService;
});