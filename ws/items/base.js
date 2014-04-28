var LsWsItemFactory = function() {
	this.createView = function(model) {
		Object.extend(model, {
			type : 'ls',
			zIndex : 2
		});
		return this.uber('createView', model);
	};
	this.render = function(view) {
		var model = view.getAttr('model');
		var text = new Kinetic.Text({
			width : 'auto',
			height : 'auto',
			fill : model.color,
			text : 'LS',
			fontSize : 13,
			fontFamily : 'monospace',
			padding : 2
		});
		view.add(text);
		model.w = text.getWidth();
		model.h = text.getHeight();
		this.uber('render', view);
		view.fire('render');
	};
	this.createProperties = function(model, onChange) {
		var properties = this.uber('createProperties', model, onChange);
		return {
			p : properties.p,
			i : properties.i,
		};
	};
};
LsWsItemFactory.inherits(WsItemFactory);

var PsWsItemFactory = function() {
	this.createView = function(model) {
		Object.extend(model, {
			type : 'ps',
			zIndex : 2
		});
		return this.uber('createView', model);
	};
	this.render = function(view) {
		var model = view.getAttr('model');
		var text = new Kinetic.Text({
			width : 'auto',
			height : 'auto',
			fill : model.color,
			text : 'PS',
			fontSize : 13,
			fontFamily : 'monospace',
			padding : 2
		});
		view.add(text);
		model.w = text.getWidth();
		model.h = text.getHeight();
		this.uber('render', view);
		view.fire('render');
	};
	this.createProperties = function(model, onChange) {
		var properties = this.uber('createProperties', model, onChange);
		return {
			p : properties.p,
			i : properties.i,
		};
	};
};
PsWsItemFactory.inherits(WsItemFactory);
