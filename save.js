(function (config) {
	var Q = require('q'),
		fs = require('fs'),
		request = require('request'),
		exec = require('child_process').exec,
		hostRegExp = new RegExp('^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)'),
		contentTypeImageRegExp = new RegExp('^image'),
		saveToFolder = 'page',
		mkdirPrefix = 'mkdir ',
		dependencies,
		host = '',
		domain = '',
		protocol = '',
		setHost = function (url) {
			var res = hostRegExp.exec(url);
			domain = res[3];
			protocol = res[1];
			host = protocol + domain;
		},
		makeFileSavePath = function (path) {
			var indexOf = path.indexOf('?'),
				resultPath,
				result = {},
				aux;
			if (indexOf !== -1) {
				path = path.slice(0,indexOf);
				if (path[path.length-1] === '/') {
					path = path + 'queryBuffer.txt';
				}
			}
			if (path === '/') {
				resultPath = __dirname + '/' + config.contentPath + '/' + 'index.html';
			} else {
				resultPath = __dirname + '/' + config.contentPath + path;
			}
			resultPath = resultPath.replace(/\//g,'\\');
			result.resultPath = resultPath;
			aux = resultPath.split('\\');
			result.file = aux.pop();
			result.path = aux.join('\\');
			return result;
		},
		findHarFile = function () {
			return Q.Promise(function (resolve, reject) {
				fs.readdir(__dirname, function (err, files) {
					if (err) reject(err);
					files.forEach(function (filename) {
						var aux = filename.split('.'),
							ext = aux.pop();
						if (aux.length && ext === 'har') {
							resolve( filename );
						}
					});
					reject();
				});
			});
		},
		makeFolderSync = function (path) {
			fs.mkdirSync(path);
		},
		makeFolder = function (depUrl) {
			var needLoadTo = Object.keys(depUrl)[0],
				saveTo = makeFileSavePath(needLoadTo);
			return Q.Promise(function (resolve, reject) {
				if (!fs.existsSync(saveTo.path)) {
					exec(mkdirPrefix + saveTo.path, function (err) {
						if (err && err.code !== 1) {
							//console.log(err);
							reject(err);
						} else {
							resolve('Create folder ' + saveTo.path);
						}
					});
				} else {
					resolve('Folder is exist' + saveTo.path);
				}
			});
		},
		makeAllFolders = function (depsUrls) {
			var promises = [];
			for (var i in depsUrls) {
				promises.push(makeFolder(depsUrls[i]));
			}
			return Q.all(promises);
		},
		deleteFolderRecursive = function(path) {
		    var files = [];
		    if( fs.existsSync(path) ) {
		        files = fs.readdirSync(path);
		        files.forEach(function(file,index){
		            var curPath = path + "/" + file;
		            if(fs.lstatSync(curPath).isDirectory()) { // recurse
		                deleteFolderRecursive(curPath);
		            } else { // delete file
		                fs.unlinkSync(curPath);
		            }
		        });
		        fs.rmdirSync(path);
		    }
		},
		readHarFile = function (filename) {
			return Q.Promise(function (resolve, reject) {
				fs.readFile(__dirname + '/' + filename, 'utf8', function (err, data) {
					if (err) reject(err);
					try {
						var data = JSON.parse(data);
					}catch (e) {
						reject(e);
					}
				 	resolve(data);
				});
			});
		},
		findUrlEntries = function (json) {
			return Q.Promise(function (resolve, reject) {
				var request = [];
				json.log.entries.forEach(function (item) {
					request.push(item.request.url);
				});
				resolve(request);
			});
		},
		findHostUrlDeps = function (getRequests) {
			return Q.Promise(function (resolve, reject) {
				var depsUrls = [],
					info;
				getRequests.forEach(function (url) {
					if (!host) {
						setHost(url);
						depsUrls.push({
							'/': url
						});
						return;
					}
					if ((new RegExp('^'+host)).test(url)) {
						// same host
						info = {};
						info[url.replace(host,'')] = url;
						console.log(host);
						depsUrls.push(info);
					}
				});
				resolve(depsUrls)
			});
		},
		uploadAndSave = function (depUrl) {
			var needLoadTo = Object.keys(depUrl)[0],
				httpResource = depUrl[needLoadTo],
				saveTo = makeFileSavePath(needLoadTo),
				reqq = request(httpResource).pipe( fs.createWriteStream(saveTo.resultPath) );
			console.log('try to upload from', httpResource, 'and save to ', saveTo );
			return Q.Promise(function (resolve, reject) {
				resolve();
			});
		},
		uploadAll = function (depsUrls) {
			console.log(depsUrls);

			var promises = [];
			for (var i in depsUrls) {
				promises.push(uploadAndSave(depsUrls[i]));
			}
			return Q.all(promises);
		};

		// deleteFolderRecursive(config.contentPath);
		// makeFolderSync('content/my/some/test.txt');
		findHarFile()
		.then(function (filename) {
			return readHarFile(filename);
		},function (e) {
			console.error('ERROR: Has No Har file '+e);
		})
		.then(function (data) {
			return findUrlEntries(data);
		}, function (e) {
			console.error('ERROR: readHarFile '+e);
		}).
		then(function (getRequests) {
			return findHostUrlDeps(getRequests);
		}, function (e) {
			console.error('ERROR: findUrlEntries '+e);
		})
		.then(function (depsUrls) {
			dependencies = depsUrls;
			return makeAllFolders(depsUrls);
			//return uploadAll(depsUrls);
		}, function (e) {
			console.error('ERROR: makeAllFolders '+e);
		})
		.then(function () {
			return uploadAll(dependencies);
		}, function (e) {
			console.error('ERROR: uploadAll '+e);
		})
		.then(function () {
			console.log('all done');
		}, function (e) {
			console.error('ERROR: some errors occures '+e);
		});

})({
	contentPath: 'content'
});