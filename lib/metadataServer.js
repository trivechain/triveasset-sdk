var Client = require('node-rest-client').Client;

var client = new Client();

var MetadataServer = function (settings) {
  var self = this;
  // self.settings = settings || {}
  self.host = 'https://asset.trivechain.com/metadata';

  client.registerMethod('upload', this.host + '/addMetadata', 'POST');
  client.registerMethod('download', this.host + '/getMetadata/${ipfsHash}', 'GET');
};

MetadataServer.prototype.upload = function uploadMetadata (metadata, callback) {
  var self = this;

  if (!metadata.metadata && !metadata.rules) {
    return callback(null, metadata);
  }
  var metafile = {};
  if (metadata.metadata) { metafile.data = metadata.metadata; }
  if (metadata.rules) { metafile.rules = metadata.rules; }

  var args = {
    data: {
      metadata: metafile
    },
    headers: { 'Content-Type': 'application/json' }
  };

  client.methods.upload(args, function (data, response) {
    if (response.statusCode == 200) {
      var ipfsData = self._safeParse(data);
      metadata.ipfsHash = ipfsData.ipfsHash;
      return callback(null, metadata);
    } else if (data) {
      return callback(new Error('Error when uploading metadata', response.statusCode));
    } else {
      return callback(new Error('Error when uploading metadata', response.statusCode));
    }
  }).on('error', function (err) {
    return callback(new Error('Error when uploading metadata', err.request.options));
  });
};

MetadataServer.prototype.download = function (hash, callback) {
  if (!hash) {
    return callback();
  }

  var args = {
    path: { ipfsHash: hash },
    headers: { 'Content-Type': 'application/json' }
  };

  client.methods.download(args, function (data, response) {
    if (response.statusCode == 200) {
      return callback(null, data);
    } else if (data) {
      return callback(new Error('Error when seeding metadata', response.statusCode));
    } else {
      return callback(new Error('Error when seeding metadata', response.statusCode));
    }
  }).on('error', function (err) {
    return callback(new Error('Error when downloading metadata', err.request.options));
  });
};

MetadataServer.prototype._safeParse = function safeParse (item) {
  try {
    if ((typeof item === 'string') || (item instanceof Buffer)) {
      return JSON.parse(item);
    } else {
      return item;
    }
  } catch (e) {
    return item;
  }
};

module.exports = MetadataServer;
