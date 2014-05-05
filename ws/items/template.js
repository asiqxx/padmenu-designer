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
		var event = $.Event('message-gettemplate', {
			template : model.config.template
		});
		$(window).triggerHandler(event);
		if (typeof model.meta !== 'object' || model.meta === null) {
			model.meta = {
				template : event.template
			};
		} else {
			model.meta.template = event.template;
		}
		if (typeof model.meta.template === 'object'
			&& model.meta.template !== null) {
			model.w = model.meta.template.width;
			model.h = model.meta.template.height;
			model.bg = model.meta.template.bgColor;
		}
		return this.uber('createView', model);
	};
	this.render = function(view) {
		var self = this;
		var model = view.getAttr('model');
		// TODO if (!template) {}
		// TODO if (!price) {}
		var renderedItemCount = 0;
		var offsets = [];
		for (var i = 0; i < model.meta.template.items.length; i++) {
			var itemModel = {};
			Object.extend(itemModel, model.meta.template.items[i]);
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
		var event = $.Event('message-opentemplate', {
			template : model.config.template
		});
		$(window).triggerHandler(event);
		return null;
	};
};
TemplateWsItemFactory.inherits(WsItemFactory);
