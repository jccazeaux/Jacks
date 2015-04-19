var jacks = (function() {
	var plugins = {};
	var globalUses = [];
	var exports = {};
	var serializers = require("./serializers");
	var parsers = require("./parsers");


	function getXHR() {
	  if (window.XMLHttpRequest) {
	    return new XMLHttpRequest;
	  } else {
	    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
	    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
	    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
	    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
	  }
	  return false;
	};
	/**
	 * Serialize data with chosen type
	 * @param {Object} data
	 * @return String
	 */
	function serialize(data, type) {
		var serializer = serializers[type];
		if (serializer == null) {
			throw "No serializer found for type " + type; 
		}
		return serializer(data);
	}

	/**
	 * ProcessUrl with query parameters
	 * @param {String} url
	 * @return String
	 */
	function processUrl(url, query) {
		var token,
			actualUrl = url;
		if (actualUrl.indexOf("?") > 0) {
			token = "&";
		} else {
			token = "?";
		}
		if (query != null) {
			for (param in query) {
				actualUrl += token + param + "=" + query[param];
				token = "&";
			}
		}
		return actualUrl;
	}

	function JacksResponse(xhr) {
		this.status = xhr.status;
		this.statusText = xhr.statusText;
		this.responseText = xhr.responseText;
		var contentType = xhr.getResponseHeader("Content-Type");
		if (parsers[contentType]){
			this.response = parsers[contentType](xhr.responseText);
		} else {
			xhr.response = xhr.responseText;
		}
		this.headers = xhr.getAllResponseHeaders();
	}


	/**
	 * Request object with all request elements
	 * @param {String} requestType
	 * @param {String} url
	 */
	function JacksRequest(requestType, url) {
		/** Request headers */
		var headers = {};
		/** Data, only for post/put */
		var data = null;
		/** Query parameters, to append on url */
		var query = null;
		/** Data type
		 * @todo : keep this or rely on content-type header ? 
		 */
		var type = "application/json";
		/**
		 * request type
		 */
		this.requestType = requestType;
		/**
		 * url
		 */
		this.url = url;
		var that = this;

		/**
		 * Add one or more headers. To add one, send param and value. To add more, send an key/value object.
		 * @param name - name of the header or key/value object
		 * @param value - value of the header. Ignored if name is an object
		 * @returns this or the headers if first param is undefined
		 */
		this.header = function(name, value) {
			if (name === undefined) {
				return headers;
			}
			headers[name] = value;
			return this;
		};

		/**
		 * Sets the type
		 * if type is null, gets the type
		 * @param {String} value
		 * @returns this or the type if first param is undefined
		 */
		this.type = function(value) {
			if (value === undefined) {
				return type;
			}
			type = value;
			return this;
		};

		/**
		 * Add one or more data. To add one, send param and value. To add more, send an key/value object.
		 * @param name - name of the data or key/value object
		 * @param value - value of the data. Ignored if name is an object
		 * @returns this or the data if first param is undefined
		 */
		this.data = function(name, value) {
			if (name === undefined) {
				return data;
			}
			data = data || {};
			if (typeof name === "string") {
				data[name] = value;
			} else if (typeof name === "object") {
				for (var attr in name) {
					data[name[attr]] = name[value];
				}
			}
			return this;
		};

		/**
		 * Add one or more query parameters. To add one, send param and value. To add more, send an key/value object.
		 * @param name - name of the query parameter or key/value object
		 * @param value - value of the query parameter. Ignored if name is an object
		 * @returns this or the query parameters if first param is undefined
		 */
		this.query = function(name, value) {
			if (name === undefined) {
				return query;
			}
			query = query || {};
			if (typeof name === "string") {
				query[name] = value;
				var queryTemp = {};
				queryTemp[name] = value;
				this.url = processUrl(this.url, queryTemp);
			} else if (typeof name === "object") {
				for (var attr in name) {
					query[attr] = name[attr];
					this.url = processUrl(this.url, name);
				}
			}
			return this;
		};

		/**
		 * executes a plugin
		 * @param {Function} pluginFn
		 */
		this.use = function(pluginNameOrFn) {
			if (typeof pluginNameOrFn == "string") {
				if (plugins[pluginNameOrFn] == null) {
					throw "Plugin " + globalUses[i] + " not found";
				}
				plugins[pluginNameOrFn](this);
			} else if (typeof pluginNameOrFn === "function") {
				pluginNameOrFn(this);
			}
			return this;
		}

		/**
		 * Sends the request
		 * @param {Function} callback
		 * @param {Function} error
		 */
		this.send = function(callback, error) {
			var xhr = getXHR();
	  		// state change
			xhr.onreadystatechange = function(){
				if (xhr.readyState != 4) return;

				callback(new JacksResponse(xhr));
			};
			xhr.onerror = function(e) {
				error(e);
			}
			xhr.open(requestType, this.url);
			for (var header in headers) {
				xhr.setRequestHeader(header, headers[header]);
			}
			xhr.send(serialize(data, headers["Content-Type"] || type));
		}

		// Exec plugins
		for (var i = 0 ; i < globalUses.length ; i++) {
			this.use(globalUses[i]);
		}
	}

	exports.get = function(url) {
		return new JacksRequest("GET", url);
	}
	exports.post = function(url) {
		return new JacksRequest("POST", url);
	}
	exports.put = function(url) {
		return new JacksRequest("PUT", url);
	}
	exports["delete"] = function(url) {
		return new JacksRequest("DELETE", url);
	}
	exports.plugin = function(name, pluginObject) {
		plugins[name] = pluginObject;
		return this;
	}
	exports.use = function(pluginNameOrFn) {
		globalUses.push(pluginNameOrFn);
		return this;
	}
	exports.parser = function(type, parserFn) {
		parsers[type] = parserFn;
		return this;
	}
	exports.serializer = function(type, serializerFn) {
		serializers[type] = serializerFn;
		return this;
	}
	return exports;
})();

window.jacks = jacks;