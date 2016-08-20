import Service from 'elliptical-service';

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

class FileService extends Service{

  static post(params,callback){
    var $provider = this.$provider,
      resource = this['@resource'];
    $provider.post(params, resource, callback);
  }

  static async postAsync(params){
    var $provider = this.$provider;
    var resource = this['@resource'];
    return new Promise(function(resolve,reject){
      $provider.post(params, resource, function(err,data){
        if(err) reject(err);
        else resolve(data);
      });
    });
  }

  static onProgress(fn){
    var context=this;
    var $provider = this.$provider;
    $provider.onProgress(function(e){
      if(fn) fn.call(context,e);
    });
  }
  
  post(params,callback){
    this.constructor.post(params, callback);
  }
  
  postAsync(params){
    return this.constructor.postAsync(params);
  }
  
  onProgress(fn){
    this.constructor.onProgress(fn);
  }

}

FileService["@resource"]='File';


export default FileService;


