
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

  abort(){
    var xhr=this._xhr;
    xhr.abort();
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
    var total=event.size;
    var fltSize=parseFloat(total/1000).toFixed(2);
    if (event.lengthComputable) {
      var e={
        size:fltSize.toString() + ' KB',
        total:total,
        loaded:event.loaded,
        progress:null,
        id:id,
        lengthComputable:true,
        completed:false
      };
      e.completed=(e.loaded===e.total);
      e.progress=Math.round((e.loaded * 100) / e.total);
      this._progressCallback(e);

    }else this._progressCallback(event);
  }

  _onFileComplete(event){
    this._removeFileListeners();
    var entity=this._entity;
    entity.complete=true;
    entity.error=false;
    var callback=this._postCallback;
    if(callback) callback(null,entity);
  }

  _onFileError(event){
    var entity=this._entity;
    this._removeFileListeners();
    var callback=this._postCallback;
    entity.error=true;
    entity.complete=false;
    var err={
      statusCode:500,
      message:'Error uploading file'
    };
    if(callback) callback(err,entity);
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
    var e,total,fltSize;
    if (event.lengthComputable) {
      total=event.total;
      fltSize=parseFloat(total/1000).toFixed(2);
      e={
        size:fltSize.toString() + ' KB',
        total:total,
        loaded:event.loaded,
        progress:null,
        id:id,
        lengthComputable:true,
        completed:false
      };
      e.progress=Math.round((e.loaded * 100) / e.total);
      progressCb(e);

    }else {
      var iteration=this._iteration;
      this._lengthComputable=false;
      var entity=this._entity;
      total=entity.total;
      fltSize=parseFloat(total/1000).toFixed(2);
      e={
        size:fltSize.toString() + ' KB',
        total:total,
        loaded:null,
        progress:null,
        id:id,
        lengthComputable:true,
        completed:false
      };
      if(iteration <(MAX_COUNT-2)){
        iteration+=1;
        this._iteration=iteration;
      }
      var loaded=Math.round(size*(iteration/MAX_COUNT));
      var progress = Math.round((loaded * 100) / e.total);
      e.loaded=loaded;
      e.progress=progress;
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
    var entity=this._entity;
    entity.error=true;
    entity.complete=false;
    this._removeEntityListeners();
    var callback=this._postCallback;
    var err={
      statusCode:500,
      message:'Error uploading file entity'
    };
    if(callback) callback(err,entity);
  }

  _removeEntityListeners(){
    var xhr=this._xhr;
    xhr.upload.addEventListener("progress", this._onEntityProgress.bind(this),false);
    xhr.upload.addEventListener("load", this._onEntityComplete.bind(this),false);
    xhr.upload.addEventListener("error", this._onEntityError.bind(this),false);
  }
  
  _fireEntityLoadComplete(){
    var progressCb=this._progressCallback;
    if(!progressCb) return;
    var entity=this._entity;
    var total=entity.total;
    var fltSize=parseFloat(total/1000).toFixed(2);
    
    var e={
      size:fltSize.toString() + ' KB',
      total:total,
      loaded:total,
      progress:100,
      completed:true,
      error:false,
      id:entity.id,
      lengthComputable:true
    };

    progressCb(e);
    
  }

}


export default FileRestProvider;