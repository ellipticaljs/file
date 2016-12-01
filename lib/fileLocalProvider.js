import GenericRepository from 'elliptical-generic-repository'

/*

 File:{
   id:<String>
   idStamp:<String>
   blob:<Blob>
   url:<String>
   dataUrl:<String>
   size:<String>
   total:<Number>
   type:<String>
   isImage:<Boolean>
   progress:<Number>
   completed:<Boolean>
   error:<Boolean>
   queued:<Boolean> 
 }


 */

class FileLocalProvider{
  constructor(dbName){
    this._dbName=(dbName) ? dbName : 'EllipticalLocalFileStore';
    this._db=null;
    this._initDb();
    this._repo=new GenericRepository([]);
    this._progressCallback=null;
  }

  _initDb(){
    var self=this;
    var db;
    var request = window.indexedDB.open(this._dbName, 1);
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
        var file=request.result;
        if(file.isImage){
          self._getFileInfo(file,function(f){
            if(callback) callback(null,f);
          });
        }else if(callback) callback(null,file);
      };
      request.onerror = function(event) {
        if(callback) callback({statusCode:500,message:request.error.message},params);
      };
    }
    else{
      var result=[];
      var direction;
      if(query && query.orderByDesc) direction='prev';
      else direction='next';

      objectStore.openCursor(null,direction).onsuccess = function(event) {
        var cursor = event.target.result;
        if (cursor) {
          result.push(cursor.value);
          cursor.continue();
        }else{
          if(query && query.filter && query.filter !==undefined) result=self.query(result,query.filter);
          if(query && query.paginate) result=self._repo.paginate(result,query.paginate);
          if(callback) callback(null,result);
        }
      };
    }
  }

  post(params,resource,progressCb,callback){
    if(!callback){
      callback=progressCb;
      progressCb=null;
    }
    var self=this;
    var reader = new FileReader();
    var blob=params.blob;
    reader.readAsDataURL(blob);
    reader.onload=function(evt){
      var transaction = self._db.transaction(["objFiles"],"readwrite");
      var objectStore = transaction.objectStore("objFiles");
      params.dataUrl = evt.target.result;
      var request = objectStore.add(params);
      request.onsuccess = function(event) {
        self._simulateProgress(params,callback,progressCb);
      };
      request.onerror = function(event) {
        if(callback) callback({statusCode:500,message:request.error.message},params);
      };
    };
  }

  put(params,resource,callback){
    if(callback) callback({statusCode:501,message:'Put not implemented'});
  }

  delete(params,resource,callback){
    var transaction = this._db.transaction(["objFiles"],"readwrite");
    var objectStore = transaction.objectStore("objFiles");
    var request = objectStore.delete(params.id);
    request.onsuccess = function(event) {
      if(callback) callback(null,null);
    };
    request.onerror = function(event) {
      if(callback) callback({statusCode:500,message:request.error.message},null);
    };
  }
  
  abort(){
    console.warn('Warning: abort file upload not implemented for local database provider');
  }

  query(data,filter, asEnumerable){
    var keys = Object.keys(filter);
    filter = filter[keys[0]];
    filter = filter.toLowerCase();
    var result = this._repo.Enumerable(data).Where(function (x) {
      return ((x.id.toLowerCase().indexOf(filter) == 0) );
    });
    return result.ToArray();
  }

  
  _simulateProgress(params,callback,progressCb){
    var MAX_COUNT=4;
    var total=params.total;
    var i=1;
    var fltSize=parseFloat(total/1000).toFixed(2);
    var e={
      total:total,
      size:fltSize.toString() + ' KB',
      loaded:null,
      progress:null,
      id:params.id,
      lengthComputable:true
    };
    var intervalId=setInterval(function(){
      var loaded=Math.round(total*(i/MAX_COUNT));
      var progress = Math.round((loaded * 100) / e.total);
      e.loaded=loaded;
      e.progress=progress;
      e.completed=(i===MAX_COUNT);
      if(progressCb) progressCb(e);
      if(i===MAX_COUNT){
         clearInterval(intervalId);
         if(callback) callback(null,params);
      }else i+=1;

    },500);
  }

  _getFileInfo(file,callback){
    if(file.blob) this._getBlobInfo(file,callback);
    else if(file.url) this._getImageInfo(file,callback);
    else callback(file);
  }

  _getBlobInfo(file,callback){
    var fr = new FileReader;
    fr.onload = function() {
      var img = new Image;
      img.onload = function() {
        file.imageWidth=img.width + 'px';
        file.imageHeight=img.height + 'px';
        callback(file);
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file.blob);
  }

  _getImageInfo(file,callback){
    var img = new Image;
    img.onload = function() {
      file.imageWidth=img.width + 'px';
      file.imageHeight=img.height + 'px';
      callback(file);
    };
    img.src = file.url;
  }
}


export default FileLocalProvider;