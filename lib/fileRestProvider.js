
import RestProvider from 'elliptical-rest-provider';

class FileRestProvider extends RestProvider{
  constructor($provider,useEntity){
    super($provider);
    this._progressCallback=null;
    this._xhr=null;
    this._entity=null;
    this.useEntity=false;
    this._postCallback=null;
    this._lengthComputable=true;
    this._iteration=0;
    if(useEntity!==undefined) this.useEntity=useEntity;
  }

  post(params,resource,callback) {
    this._lengthComputable=true;
    this._iteration=0;
    this._entity=params;
    this._postCallback=callback;
    var url = this.baseEndpoint + '/' + resource;
    this._xhr = new XMLHttpRequest();
    if(this.useEntity) this._entityUpload(params,url);
    else this._fileUpload(params,url);
  }

  put(params,resource,callback){
     if(callback) callback({statusCode:501,message:'Put not implemented'});
  }

  onProgress(fn){
    this._progressCallback=fn;
  }

  _entityUpload(params,url){
    var xhr=this._xhr;
    xhr.upload.addEventListener("progress", this._onEntityProgress.bind(this),false);
    xhr.upload.addEventListener("load", this._onEntityComplete.bind(this),false);
    xhr.upload.addEventListener("error", this._onEntityError.bind(this),false);
    var reader = new FileReader();
    var blob=params.blob;
    reader.readAsDataURL(blob);
    reader.onload=function(evt){
      params.dataUrl = evt.target.result;
      xhr.open("POST", url);
      xhr.send(params);
    };
  }

  _fileUpload(params,url){
    var xhr=this._xhr;
    xhr.upload.addEventListener("progress", this._onFileProgress.bind(this),false);
    xhr.upload.addEventListener("load", this._onFileComplete.bind(this),false);
    xhr.upload.addEventListener("error", this._onFileError.bind(this),false);
    var formData = new FormData();
    formData.append('file',params);
    xhr.open("POST", url);
    xhr.overrideMimeType('text/plain; charset=x-user-defined-binary');
    xhr.send(formData);
  }

  _onFileProgress(event){
    if(!this._progressCallback) return;
    var id=this._entity.id;
    if (event.lengthComputable) {
      var e={
        size:event.total,
        total:event.total,
        loaded:event.loaded,
        percentage:null,
        id:id,
        lengthComputable:true
      };

      e.percentage=Math.round((e.loaded * 100) / e.total);
      this._progressCallback(e);

    }else this._progressCallback(event);
  }

  _onFileComplete(event){
    this._removeFileListeners();
    var entity=this._entity;
    var callback=this._postCallback;
    if(callback) callback(null,entity);
  }

  _onFileError(event){
    this._removeFileListeners();
    var callback=this._postCallback;
    var err={
      statusCode:500,
      message:'Error uploading file'
    };
    if(callback) callback(err,null);
  }

  _removeFileListeners(){
    var xhr=this._xhr;
    xhr.upload.addEventListener("progress", this._onFileProgress.bind(this),false);
    xhr.upload.addEventListener("load", this._onFileComplete.bind(this),false);
    xhr.upload.addEventListener("error", this._onFileError.bind(this),false);
  }

  _onEntityProgress(event){
    var progressCb=this._progressCallback;
    if(!progressCb) return;
    var MAX_COUNT=90;
    var id=this._entity.id;
    var e;
    if (event.lengthComputable) {
      e={
        size:event.total,
        total:event.total,
        loaded:event.loaded,
        percentage:null,
        id:id,
        lengthComputable:true
      };

      e.percentage=Math.round((e.loaded * 100) / e.total);
      progressCb(e);

    }else {
      var iteration=this._iteration;
      this._lengthComputable=false;
      var entity=this._entity;
      var size=entity.size;
      e={
        size:entity.size,
        total:entity.size,
        loaded:null,
        percentage:null,
        id:id,
        lengthComputable:true
      };
      if(iteration <(MAX_COUNT-2)){
        iteration+=1;
        this._iteration=iteration;
      }
      var loaded=Math.round(size*(iteration/MAX_COUNT));
      var percentage = Math.round((loaded * 100) / e.total);
      e.loaded=loaded;
      e.percentage=percentage;
      progressCb(e);
    }
  }

  _onEntityComplete(event){
    this._removeEntityListeners();
    var entity=this._entity;
    if(!this._lengthComputable) this._fireEntityLoadComplete();
    var callback=this._postCallback;
    if(callback) callback(null,entity);
  }

  _onEntityError(event){
    this._removeEntityListeners();
    var callback=this._postCallback;
    var err={
      statusCode:500,
      message:'Error uploading file entity'
    };
    if(callback) callback(err,null);
  }

  _removeEntityListeners(){
    var xhr=this._xhr;
    xhr.upload.addEventListener("progress", this._onEntityProgress.bind(this),false);
    xhr.upload.addEventListener("load", this._onEntityComplete.bind(this),false);
    xhr.upload.addEventListener("error", this._onEntityError.bind(this),false);
  }
  
  _fireEntityLoadComplete(){
    var entity=this._entity;
    var e={
      size:entity.size,
      total:entity.size,
      loaded:entity.size,
      percentage:100,
      id:entity.id,
      lengthComputable:true
    };
    
  }

}


export default FileRestProvider;