var TemplateWsItemFactory = function() {
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
		var self = this;
		var model = view.getAttr('model');
		var renderedItemCount = 0;
		model.h = model.config.template.height;
		model.w = model.config.template.width;
		var offsetY = 0;
		var originalBottom = 0;
		var bottom = 0;
		for (var i = 0; i < model.config.template.items.length; i++) {
			var itemModel = {};
			Object.extend(itemModel, model.config.template.items[i]);
			console.log(model.config.template.items[i])
			itemModel.config.text = 'asik\nand\ntomik';
			if (itemModel.y > originalBottom) {
				itemModel.y += offsetY;
			}
			
			var wsItemFactory = WsItemFactory.forType(itemModel.type);
			var itemView = wsItemFactory.createView(itemModel);
			itemView.on('render', function() {
				view.add(this);
				if (++renderedItemCount
					=== model.config.template.items.length) {
					self.uber('render', view);
					view.fire('render');
				}
			});
			wsItemFactory.render(itemView);
			
			if (itemModel.h !== model.config.template.items[i].h) {
				offsetY += itemModel.h - model.config.template.items[i].h;
				originalBottom = model.config.template.items[i].y
					+ model.config.template.items[i].h;
			}
			bottom = itemModel.y + itemModel.h;
			if (model.h < bottom) {
				model.h = bottom;
			}
		}
	};
};
TemplateWsItemFactory.inherits(WsItemFactory);
