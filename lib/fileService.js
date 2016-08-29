import Service from 'elliptical-service';

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
  error:<Boolean>
  queued:<Boolean> 
 }

*/

class FileService extends Service{
  
  post(params,callback){
    var progressCb=this._progressCb;
    var $provider = this.constructor.$provider,
      resource = this['@resource'];
    $provider.post(params, resource, progressCb,callback);
  }
  
  async postAsync(params){
    var progressCb=this._progressCb;
    var $provider = this.constructor.$provider;
    var resource = this['@resource'];
    return new Promise(function(resolve,reject){
      $provider.post(params, resource, progressCb,function(err,data){
        if(err) reject(err);
        else resolve(data);
      });
    });
  }
  
  onProgress(fn){
    this._progressCb=fn;
  }
  
  abort(){
    this.$provider.abort();
  }

}

FileService["@resource"]='File';


export default FileService;


