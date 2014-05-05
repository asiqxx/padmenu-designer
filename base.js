Function.prototype.method = function(name, func) {
    this.prototype[name] = func;
    return this;
};

Function.method('inherits', function(parent) {
    this.prototype = new parent();
    var d = {}, 
        p = this.prototype;
    this.prototype.constructor = parent; 
    this.method('uber', function uber(name) {
        if (!(name in d)) {
            d[name] = 0;
        }        
        var f, r, t = d[name], v = parent.prototype;
        if (t) {
            while (t) {
                v = v.constructor.prototype;
                t -= 1;
            }
            f = v[name];
        } else {
            f = p[name];
            if (f == this[name]) {
                f = v[name];
            }
        }
        d[name] += 1;
        r = f.apply(this, Array.prototype.slice.apply(arguments, [1]));
        d[name] -= 1;
        return r;
    });
    return this;
});

Function.method('swiss', function(parent) {
    for (var i = 1; i < arguments.length; i += 1) {
        var name = arguments[i];
        this.prototype[name] = parent.prototype[name];
    }
    return this;
});

Object.matches = function(object, criteria) {
	for (var i in criteria) {
		if (typeof object[i] === 'undefined') {
			return false;
		}
		if (typeof object[i] === 'object' || typeof object[i] === 'array') {
			if (!Object.matches(object[i], criteria[i])) {
				return false;
			}
		} else if (object[i] !== criteria[i]) {
			return false;
		}
	}
	return true;
};

Object.extend = function(target, source, overwrite, deep) {
	for (var i in source) {
		if (target[i] === source[i]) {
			continue;
		}
		if ((typeof target[i] === 'object'
			&& typeof source[i] === 'object' && target[i] !== null)
			|| (typeof target[i] === 'array'
			&& typeof source[i] === 'array')) {
			Object.extend(target[i], source[i], overwrite);
		} else if (typeof target[i] === 'undefined' || overwrite === true) {
			if (typeof source[i] === 'object' && source[i] !== null) {
				target[i] = {};
				Object.extend(target[i], source[i], overwrite);
			} else {
				target[i] = source[i];
			}
		}
	}
	return target;
};

Object.findById = function(objects, id) {
	for (var i in objects) {
		if (objects[i].id === id) {
			return objects[i];
		}
	}
	return null;
};

function throwException(message) {
	alert(message);
	throw message;
}
