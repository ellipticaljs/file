import Service from 'elliptical-service';

/*

     File:{
         id:<String>
 *       idStamp:<String>
 *       blob:<Blob>
 *       url:<String>
 *       dataUrl:<String>
 *       size:<String>
 *       total:<Number>
 *       type:<String>
 *       isImage:<Boolean>
 *       title:<String>,
 *       meta:<String>,
 *       link:<String>,
 *       width:<Number>,
 *       imageWidth:<String>,
 *       imageHeight:<String>,
 *       active:<Boolean>
 *       dataLink:<String>
 *       newTarget:<Boolean>
 *       progress:<Number>
 *       error:<Boolean>
 *       queued:<Boolean>   
 *    }
*/

class FileService extends Service{
  
  static _toQueryable(obj) {
    if ((typeof obj !== 'object')) return obj;
    var qry = {};
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (key.indexOf('$') !== 0) {
          if(key.indexOf('id')===0) qry['sw_Id']= obj[key];
          else qry[key] = obj[key];
        }
      }
    }
    return qry;
  }
  
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


