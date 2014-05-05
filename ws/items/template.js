var TemplateWsItemFactory = function() {
	this.createView = function(model) {
		Object.extend(model, {
			w : 128,
			h : 128,
			type : 'template',
			config : {
				template : null,
				price : null
			}
		});
		if (typeof model.meta !== 'object' || model.meta === null) {
			model.meta = {};
		}
		var event = $.Event('message', {
			id : 'gettemplate',
			template : model.config.template
		});
		$(window).triggerHandler(event);
		model.meta.template = event.template;
		if (model.meta.template) {
			if (typeof model.meta.template === 'object'
				&& model.meta.template !== null) {
				model.w = model.meta.template.width;
				model.h = model.meta.template.height;
				model.bg = model.meta.template.bgColor;
			}			
		}
		var event = $.Event('message', {
			id : 'getprice',
			price : model.config.price
		});
		$(window).triggerHandler(event);
		model.meta.price = event.price;
		return this.uber('createView', model);
	};
	this.render = function(view) {
		var self = this;
		var model = view.getAttr('model');
		if (model.meta.template) {
			// TODO if (!template) {}
			// TODO if (!price) {}
			
			var renderedItemCount = 0;
			var offsets = [];
			for (var i = 0; i < model.meta.template.items.length; i++) {
				var itemModel = {};
				Object.extend(itemModel, model.meta.template.items[i]);
				if (model.meta.price) {
					for (var key in itemModel) {
						if (typeof itemModel[key] === 'string'
							&& !itemModel[key].match(/[#][0-9a-fA-F]{6}/)) {
							var hashes = null;
							var regexp = /[#][\w\[\].]+/;
							while (hashes = itemModel[key].match(regexp)) {
								var hashValue = null;
								try {
									hashValue = eval('model.meta.price.' + hashes[0].substr(1));
									itemModel[key] = itemModel[key].replace(regexp, hashValue);
								} catch (e) {
									itemModel[key] = null;
									break;
								}
							}
						}
					}
					if (typeof itemModel.config === 'object') {
						for (var key in itemModel.config) {
							if (typeof itemModel.config[key] === 'string'
								&& !itemModel[key].match(/[#][0-9a-fA-F]{6}/)) {
								var hashes = null;
								var regexp = /[#][\w\[\].]+/;
								while (hashes = itemModel.config[key].match(regexp)) {
									var hashValue = null;
									try {
										hashValue = eval('model.meta.price.' + hashes[0].substr(1));
										itemModel.config[key] = itemModel.config[key].replace(regexp, hashValue);
									} catch (e) {
										itemModel.config[key] = null;
										break;
									}
								}
							}
						}
					}
				}
				if (itemModel.type === 'text') {
					itemModel.config.text = 'asdasdas/nasdasdsada/nasdasdas/nd';
				}
				var offsetItemIndex = -1;
				for (var k = 0; k < offsets.length; k++) {
					if (itemModel.y > offsets[k][0]) {
						if (offsetItemIndex === -1
							|| offsets[k][1] > offsets[offsetItemIndex][1]) {
							offsetItemIndex = k;
						}
					}
				}
				if (offsetItemIndex !== -1) {
					itemModel.y += offsets[offsetItemIndex][2];
				}
				
				var wsItemFactory = WsItemFactory.forType(itemModel.type);
				var itemView = wsItemFactory.createView(itemModel);
				itemView.on('render', function() {
					if (++renderedItemCount
						=== model.meta.template.items.length) {
						// fire render event if necessary
					}
				});
				wsItemFactory.render(itemView);
				view.add(itemView);

				if (itemModel.h !== model.meta.template.items[i].h) {
					var originalBottom = model.meta.template.items[i].y
						+ model.meta.template.items[i].h;
					var bottom = itemModel.y + itemModel.h;
					var offset = itemModel.h - model.meta.template.items[i].h;
					var ownOffset = offsetItemIndex === -1
						? 0 : offsets[offsetItemIndex][2];
					offsets.push([originalBottom, bottom, ownOffset + offset]);
				}
				var bottom = itemModel.y + itemModel.h;
				if (model.h < bottom) {
					model.h = bottom;
				}
			}
		}
		self.uber('render', view);
		view.fire('render');
	};
	this.createProperties = function(onChange) {
		var properties = this.uber('createProperties', onChange);
		for (var key in properties) {
			properties[key].control.attr('type', 'text');
			properties[key].control.attr('readonly', 'readonly');
		}
		return properties;
	};
	this.createEditor = function(model, onChange) {
		// TODO if (!template) {}
		$(window).triggerHandler($.Event('message', {
			id : 'opentemplate',
			template : model.config.template
		}));
		return null;
	};
};
TemplateWsItemFactory.inherits(WsItemFactory);
