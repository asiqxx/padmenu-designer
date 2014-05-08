var VideoWsItemFactory = function() {
	this.createView = function(model) {
		Object.extend(model, {
			type : 'image',
			w : 128,
			h : 128,
			config : {
				src : ''
			}
		});
		return this.uber('createView', model);
	};
	function render(view, model, imageObject) {
		var image = new Kinetic.Image({
			width : model.w,
			height : model.h,
			image : imageObject
		});
		view.add(image);
	}
	this.render = function(view) {
		var self = this;
		var model = view.getAttr('model');
		var imageObject = ImageWsItemFactory.cache[model.config.src];
		if (imageObject) {
			render(view, model, imageObject);
			self.uber('render', view);
			view.fire('render');
		} else {
			imageObject = new Image();
			imageObject.onload = function() {
				ImageWsItemFactory.cache[model.config.src] = imageObject;
				render(view, model, imageObject);
				self.uber('render', view);
				view.fire('render');
			};
			imageObject.src = 'public/images/video.png';
		}
	};
	this.createProperties = function(onChange) {
		var properties = this.uber('createProperties', onChange);
		PropertiesBuilder(properties)
			.addStringProperty('config.src', 'Video Src', onChange);
		return properties;
	};
};
VideoWsItemFactory.inherits(WsItemFactory);
