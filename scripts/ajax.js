

define(function() {
    function post(url, params, callback) {
        let xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                callback(xhr.response);
            }
        }
        xhr.open('POST', url);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.send(params);
        return xhr;
    }

    function get(url, callback) {
        let req = new XMLHttpRequest();
        req.timeout = 31000; // time in milliseconds
        req.onreadystatechange = function() {
            if (req.readyState === 4) {
                callback(req.response, req.error);
            }
        }
        req.open("GET", url);
        req.send();
    }

    function update(url, data, callback) {
        let xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                callback(xhr.response);
            }
        }
        xhr.open('POST', url);
        xhr.setRequestHeader('Content-type','application/json; charset=utf-8');
        xhr.send(JSON.stringify(data));
        return xhr;
    }
    return {
        post: post,
        get: get,
        update: update,
    }
});