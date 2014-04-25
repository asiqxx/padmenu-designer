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
	this.createProperties = function(model, onChange) {
		return {
			p : WsItemFactory.util.property('p', 'Page', model.p),
			i : WsItemFactory.util.property('i', 'Index', model.i),
			w : WsItemFactory.util.property('w', 'Width', model.w, onChange),
			h : WsItemFactory.util.property('h', 'Height', model.h, onChange),
			bg : WsItemFactory.util.property('bg', 'Background',
				model.bg, onChange),
			color : WsItemFactory.util.property('color', 'Color',
				model.color, onChange),
			opacity : WsItemFactory.util.property('opacity', 'Opacity',
				model.opacity, onChange),
		};
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

WsItemFactory.util = {
	parseString : function(value) {
		return value;
	},
	parseBoolean : function(value) {
		return value === 'true';
	},
	property : function(name, label, value, onChange) {
		var control;
		if (onChange) {
			var inputType = 'text';
			var parseFunction = WsItemFactory.util.parseString;
			// The following input types are not supported by all browsers.
			if (typeof value === 'number') {
				//inputType = 'number';
				parseFunction = parseFloat;
			} else if (typeof value === 'boolean') {
				//inputType = 'checkbox';
				parseFunction = WsItemFactory.util.parseBoolean;
			} else if (typeof value === 'string') {
				if (value.match(/[#][a-fA-F0-9]{6}/)) {
					//inputType = 'color';
				}
			}
			control = $('<input type="' + inputType + '">')
				.on('change', function() {
				var model = {};
				var names = name.split('.');
				model[names[names.length - 1]] = parseFunction($(this).val());
				for (var i = 2; i < names.length + 1; i++) {
					var object = {};
					object[names[names.length - i]] = model;
					model = object;
				}
				onChange(model);
			});
		} else {
			control = $('<input type="' + inputType + '" readonly=true>');
		}
		return {
			label : label,
			control : control.val(value)
		};
	},
	clearView : function(view) {
		view.removeChildren();
	}
};
