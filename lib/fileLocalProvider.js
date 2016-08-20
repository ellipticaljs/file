import GenericRepository from 'elliptical-generic-repository'

/*

 File:{
   id:<String>
   blob:<Blob>
   url:<String>
   dataUrl:<String>
   size:<Number>
   type:<String>
 }


 */

class FileLocalProvider{
  constructor(){
    this._db=null;
    this._initDb();
    this._repo=new GenericRepository([]);
    this._progressCallback=null;
  }

  _initDb(){
    var self=this;
    var db;
    var request = window.indexedDB.open("EllipticalLocalFileStore", 1);
    request.onerror = function(event) {
      console.warn('Error opening database');
    };
    request.onsuccess = function(event) {
      db = event.target.result;
      self._db=db;

    };
    request.onupgradeneeded = function(event) {
      db = event.target.result;
      // Create an objectStore for this database
      var objectStore = db.createObjectStore("objFiles", { keyPath: "id" });
      //create
      objectStore.createIndex("id", "id", { unique: true });
      self._db=db;
    };

  }

  get(params,resource,query,callback){
    var self=this;
    var transaction = this._db.transaction(["objFiles"]);
    var objectStore = transaction.objectStore("objFiles");
    if(params && params.id) {
      var request = objectStore.get(params.id);
      request.onsuccess = function(event) {
        if(callback) callback(null,request.result);
      };
      request.onerror = function(event) {
        if(callback) callback({statusCode:request.errorCode},null);
      };
    }
    else{
      var result=[];
      var direction;
      if(query && bquery.orderByDesc) direction='prev';
      else direction='next';

      objectStore.openCursor(null,direction).onsuccess = function(event) {
        var cursor = event.target.result;
        if (cursor) {
          result.push(cursor.value);
          cursor.continue();
        }
        if(query && query.filter && query.filter !==undefined) result=self.query(result,query.filter);
        if(callback) callback(null,result);
      };
    }
  }

  post(params,resource,callback){
    var self=this;
    var reader = new FileReader();
    var transaction = this._db.transaction(["objFiles"],"readwrite");
    var objectStore = transaction.objectStore("objFiles");
    var blob=params.blob;
    reader.readAsDataURL(blob);
    reader.onload=function(evt){
      params.dataUrl = evt.target.result;
      var request = objectStore.add(params);
      request.onsuccess = function(event) {
        self._simulateProgress(params,callback);
      };
      request.onerror = function(event) {
        if(callback) callback({statusCode:request.errorCode},null);
      };
    };
  }

  put(params,resource,callback){
    if(callback) callback({statusCode:501,message:'Put not implemented'});
  }

  delete(params,resource,callback){
    var transaction = this._db.transaction(["objFiles"]);
    var objectStore = transaction.objectStore("objFiles");
    var request = objectStore.delete(params.id);
    request.onsuccess = function(event) {
      if(callback) callback(null,null);
    };
    request.onerror = function(event) {
      if(callback) callback({statusCode:request.errorCode},null);
    };
  }

  query(data,filter, asEnumerable){
    var keys = Object.keys(filter);
    filter = filter[keys[0]];
    filter = filter.toLowerCase();
    var result = this.enumerable(data).Where(function (x) {
      return ((x.id.toLowerCase().indexOf(filter) == 0) );
    });
    return result.ToArray();
  }

  onProgress(fn){
    this._progressCallback=fn;
  }
  
  _simulateProgress(params,callback){
    var MAX_COUNT=4;
    var progressCb=this._progressCallback;
    var size=params.parseInt(params.size);
    var i=1;
    var e={
      total:size,
      size:size,
      loaded:null,
      percentage:null,
      id:params.id,
      lengthComputable:true
    };
    setTimeout(function(){
      var loaded=Math.round(size*(i/MAX_COUNT));
      var percentage = Math.round((loaded * 100) / e.total);
      e.loaded=loaded;
      e.percentage=percentage;
      if(progressCb) progressCb(e);
      if(i===MAX_COUNT){
         if(callback) callback(params);
      }else i+=1;

    },500);
  }
}


export default FileLocalProvider;