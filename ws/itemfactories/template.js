var CircleWsItemFactory = function() {
	this.createView = function(model) {
		Object.extend(model, {
			w : 128,
			h : 128,
			type : 'template',
			config : {
				template : 'default',
				price : null
			}
		});
		return this.uber('createView', model);
	};
	this.render = function(view) {
		var model = view.getAttr('model');

		this.uber('render', view);
		view.fire('render');
	};
};
CircleWsItemFactory.inherits(WsItemFactory);
