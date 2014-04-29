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
			zIndex : 0,
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
		if (typeof view.getParent() !== 'undefined') {
			view.setZIndex(model.zIndex);
		}
	};
	this.clearView = function(view) {
		view.removeChildren();
	};
	this.createProperties = function(onChange) {
		var properties = {};
		PropertiesBuilder(properties)
		.addNumberProperty('p', 'Page')
		.addNumberProperty('i', 'Index')
		.addNumberProperty('x', 'X', onChange)
		.addNumberProperty('y', 'Y', onChange)
		.addNumberProperty('w', 'Width', onChange)
		.addNumberProperty('h', 'Height', onChange)
		.addColorProperty('bg', 'Bg Color', onChange)
		.addColorProperty('color', 'Color', onChange)
		.addNumberProperty('opacity', 'Opacity', onChange, 0, 1, 0.1)
		.addNumberProperty('zIndex', 'ZIndex', onChange, 0, 255, 1);
		return properties;
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
