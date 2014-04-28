var WsItemPropertiesBuilder = function(properties) {	
	function createUpdateObject(name, value) {
		var updateObject = {};
		var names = name.split('.');
		updateObject[names[names.length - 1]] = value;
		for (var i = 2; i < names.length + 1; i++) {
			var object = {};
			object[names[names.length - i]] = updateObject;
			updateObject = object;
		}
		return updateObject;
	}
	
	this.addStringProperty = function(name, label, onChange) {
		var $control = $('<input type="text">');
		if (onChange) {
			$control.on('change', function() {
				onChange(createUpdateObject(name, $(this).val()));
			});
		} else {
			$control.attr('readonly', 'readonly');
		}
		properties[name] = {
			name : name,
			label : label,
			control : $control
		};
		return properties[name];
	};
	this.addTextProperty = function(name, label, onChange) {
		var $control = $('<textarea rows="5"></textarea>');
		$control.css({
			'width' : '100%',
			'resize' : 'none'
		});
		if (onChange) {
			$control.on('keyup', function() {
				onChange(createUpdateObject(name, $(this).val()));
			});
		} else {
			$control.attr('readonly', 'readonly');
		}
		properties[name] = {
			name : name,
			label : label,
			control : $control
		};
		return properties[name];
	};
	this.addNumberProperty = function(name, label, onChange, min, max, step) {
		var $control = $('<input type="number" min="'
			+ min + '" max="' + max + '" step="' + step + '">');
		if (onChange) {
			$control.on('change', function() {
				onChange(createUpdateObject(name, parseFloat($(this).val())));
			});
		} else {
			$control.attr('readonly', 'readonly');
		}
		properties[name] = {
			name : name,
			label : label,
			control : $control
		};
		return properties[name];
	};
	
	this.setPropertyValue = function(name, model) {
		var names = name.split('.');
		var value = model[names[0]];
		for (var i = 1; i < names.length; i++) {
			value = value[names[i]];
		}
		properties[name].control.val(value);
	};
};

var WsItemFactory = function() {
	this.createView = function(model) {
		Object.extend(model, {
			type : undefined,
			p : -1,
			i : -1,
			x : 0,
			y : 0,
			w : 0,
			h : 0,
			bg : 'transparent',
			color : '#000000',
			borderColor : 'transparent',
			borderWidth : 0,
			opacity : 1,
			zIndex : 1,
			config : {}
		});
		var view = new Kinetic.Group();
		view.setAttr('model', model);
		return view;
	};
	this.render = function(view) {
		var model = view.getAttr('model');
		if (view.getWidth() !== model.w || view.getHeight() !== model.h) {
			view.setSize({
				width : model.w,
				height : model.h
			});
		}
		var bg = new Kinetic.Rect({
			name : 'bg',
			width : view.getWidth(),
			height : view.getHeight(),
			fill : model.bg,
			stroke : model.borderColor,
			strokeWidth : model.borderWidth
		});
		view.add(bg);
		bg.moveToBottom();
		view.setPosition({
			x : model.x,
			y : model.y
		});
		view.setOpacity(model.opacity);
	};
	this.clearView = function(view) {
		view.removeChildren();
	};
	this.createProperties = function(onChange) {
		var properties = {};
		var propertiesBuilder = new WsItemPropertiesBuilder(properties);
		propertiesBuilder.addNumberProperty('p', 'Page');
		propertiesBuilder.addNumberProperty('i', 'Index');
		propertiesBuilder.addNumberProperty('x', 'X', onChange);
		propertiesBuilder.addNumberProperty('y', 'Y', onChange);
		propertiesBuilder.addNumberProperty('w', 'Width', onChange);
		propertiesBuilder.addNumberProperty('h', 'Height', onChange);
		propertiesBuilder.addStringProperty('bg', 'Bg color', onChange);
		propertiesBuilder.addStringProperty('color', 'Color', onChange);
		propertiesBuilder.addNumberProperty('opacity', 'Opacity', onChange,
			0, 1, 0.1);
		return properties;
	};
	this.setPropertyValue = function(properties, name, model) {
		var propertiesBuilder = new WsItemPropertiesBuilder(properties);
		propertiesBuilder.setPropertyValue(name, model);
	};
	this.createEditor = function(model, onChange) {
		return null;
	};
};

WsItemFactory.forType = function(type) {
	if (!type) {
		throw 'WsItemFactory: Failed to create WsItemFactory. Cause:\n'
			+ 'Item type is not specified';
	}
	var constructor = window[type[0].toUpperCase()
		+ type.substring(1) + 'WsItemFactory'];
	if (!constructor) {
		throw 'WsItemFactory: Failed to create WsItemFactory. Cause:\n'
			+ 'Unknown item type "' + type + '"';
	}
	return new constructor();
};
