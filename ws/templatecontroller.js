var WsTemplateController = function($viewContainer) {
	var self = this;
	self.createView($viewContainer);
	var model = null;
	var pageView = self.getPageView();
	
	function renderItem(item) {
		var wsItemFactory = WsItemFactory.forType(item.type);
		var itemView = wsItemFactory.createView(item);
		wsItemFactory.render(itemView);
		pageView.add(itemView);
		itemView.setZIndex(item.zIndex);
		itemView.setDraggable(true);
		itemView.on('dragmove', function(data) {
			var item = this.getAttr('model');
			if (item === self.getSelectedItem()) {
				self.selectItem(self.getSelectedItem());
			}
		});
		itemView.on('dragend', function(data) {
			var item = this.getAttr('model');
			var position = this.getPosition();
			item.x = position.x;
			item.y = position.y;
			self.selectItem(item);
			self.fireSelectEvent(item);
		});
		return itemView;
	}
	function addItem(item) {
		item.zIndex = model.items.length === 0
			? 0 : ++model.items[model.items.length - 1].zIndex;
		model.items.push(item);
		var itemView = renderItem(item);
		pageView.batchDraw();
	}
	function removeItem(item) {
		var index = model.items.indexOf(item);
		if (index === -1) {
			return;
		}
		model.items.splice(index, 1);
		var itemView = self.getItemView(item);
		itemView.remove();
		pageView.batchDraw();
	}
	
	var draggingItemView = null;
	var eventListener = {
		onKeydown : function(e) {
			if (!self.onKeydown(e)) {
				return false;
			}
			if (!self.isFocused()) {
				return true;
			}
			if (self.getEditor()) {
				return true;
			}
			
			switch (e.which) {
			case 27:
				self.close();
				self.blur(true);
				return false;
			default:
				break;
			}
			
			if (self.getSelectedItem()) {
				switch (e.which) {
				case 46:
					removeItem(self.getSelectedItem());
					self.selectItem();
					return false;
				case 27:
					self.close();
					return false;
				case 37:
					self.updateSelectedItem({
						x : self.getSelectedItem().x - (e.shiftKey ? 10 : 1)
					});
					self.fireSelectEvent(self.getSelectedItem());
					return false;
				case 38:
					self.updateSelectedItem({
						y : self.getSelectedItem().y - (e.shiftKey ? 10 : 1)
					});
					self.fireSelectEvent(self.getSelectedItem());
					return false;
				case 39:
					self.updateSelectedItem({
						x : self.getSelectedItem().x + (e.shiftKey ? 10 : 1)
					});
					self.fireSelectEvent(self.getSelectedItem());
					return false;
				case 40:
					self.updateSelectedItem({
						y : self.getSelectedItem().y + (e.shiftKey ? 10 : 1)
					});
					self.fireSelectEvent(self.getSelectedItem());
					return false;
				default:
					break;
				}
			}
			
			return true;
		},
		onViewContainerDblClick : function(e) {
			if (e.isPropagationStopped()) {
				return false;
			}
			self.close();
			self.blur(true);
		},
		onSelectedItemViewClick : function(data) {
			if (data.evt.which !== 1) {
				return;
			}
			self.stopClickEventPropagation();
		},
		onSelectedItemViewDblClick : self.onSelectedItemViewDblClick.bind(self),
		onSelectedItemViewResizerDragMove : self.onSelectedItemViewResizerDragMove.bind(self),
		onPageIViewMousedown : function(data) {
			if (self.getEditor() !== null) {
				return;
			}
			draggingItemView = self.getItemViewByPosition(
				self.getView().getPointerPosition());
		},
		onPageIViewMousemove : function(data) {
			if (!draggingItemView) {
				return;
			}
			draggingItemView.startDrag();
			draggingItemView = null;
		},
		onPageIViewMouseup : function(data) {
			draggingItemView = null;
		},
		onDropAccept : function($dragObject) {
			return $dragObject.data('pdWsItem')
				&& $dragObject.data('pdWsItem').view.getAttr('model').type
					!== 'template';
		},
		onDropOver : function(e) {
		},
		onDropOut : function(e) {
		},
		onDropMove : function(e) {
		},
		onDrop : function(e) {
			var dragObjectPosition = e.dragObject.offset();
			var position = self.positionRelativeToPage({
				x : dragObjectPosition.left,
				y : dragObjectPosition.top,
			});
			item = e.dragObject.data('pdWsItem').view.getAttr('model');
			item.x = position.x;
			item.y = position.y;
			if (item.w > model.width) {
				item.w = model.width;
			}
			if (item.h > model.height) {
				item.h = model.height;
			}
			addItem(item);
			self.selectItem(item);
		}
	};
	
	$viewContainer.pdDroppable({
		accept : eventListener.onDropAccept,
		over : eventListener.onDropOver,
		out : eventListener.onDropOut,
		move : eventListener.onDropMove,
		drop : eventListener.onDrop,
	});
	
	$(window).on('resize.pdWsTemplateController', self.onWindowResize);
	$viewContainer.on('mousewheel.pdWsController', self.onMousewheel);
	$(window).on('keydown.pdWsTemplateController', eventListener.onKeydown);
	$(document.body).on('mousedown.pdWsTemplateController', self.onBodyMousedown);
	$viewContainer.on('dblclick.pdWsTemplateController',
		eventListener.onViewContainerDblClick);
	self.getPageIView().on('click.pdWsTemplateController',
		self.onPageIViewClick);
	self.getSelectedItemView().on('dblclick.pdWsTemplateController',
		eventListener.onSelectedItemViewDblClick);
	self.getSelectedItemView().find('.resizer').on('dragmove.pdWsTemplateController',
		eventListener.onSelectedItemViewResizerDragMove);
	self.getPageIView().on('mousedown.pdWsTemplateController',
		eventListener.onPageIViewMousedown);
	self.getPageIView().on('mousemove.pdWsTemplateController',
		eventListener.onPageIViewMousemove);
	self.getPageIView().on('mouseup.pdWsTemplateController',
		eventListener.onPageIViewMouseup);
	
	self.getModel = function() {
		return model;
	};
	
	self.open = function(template) {
		if (model) {
			self.close(false);
		}
		model = template;
		if (!model.items) {
			model.items = [];
		}
		self.setPageSize({
			width : model.width,
			height : model.height
		});
		self.setBgColor(model.bgColor);
		self.render();
	};
	
	function normalizeModel() {
		var items = [];
		for (var i = 0; i < model.items.length; i++) {
			var item = model.items[i];
			item.i = 0;
			for (var j = 0; j < model.items.length; j++) {
				var otherItem = model.items[j];
				if (otherItem === item) {
					continue;
				}
				if (item.y > otherItem.y
					|| (item.y === otherItem.y && item.x > otherItem.x)) {
					item.i++;
				}
			}
			items[item.i] = item;
		}
		model.items = items;
	}
	
	self.close = function(withoutSave) {
		self.selectItem();
		if (!withoutSave) {
			normalizeModel();
			self.fireChangeEvent();
		}
		model = null;
		self.render();
	};
	
	self.updateSelectedItem = function(update) {
		if (!update) {
			removeItem(self.getSelectedItem());
			self.selectItem();
			return;
		}
		$.extend(true, self.getSelectedItem(), update);
		var itemView = self.getItemView(self.getSelectedItem());
		var wsItemFactory = WsItemFactory.forType(self.getSelectedItem().type);
		wsItemFactory.clearView(itemView);
		itemView.on('render', function() {
			self.selectItem(self.getSelectedItem());
			pageView.batchDraw();
			this.off('render');
		});
		wsItemFactory.render(itemView);
	};
	
	self.render = function() {
		pageView.removeChildren();
		if (model && model.items) {
			for (var i = 0; i < model.items.length; i++) {
				var item = model.items[i];
				renderItem(item);
			}
		}
		pageView.batchDraw();
	};
	
	var changeEventListeners = [];
    self.fireChangeEvent = function() {
		for (var i in changeEventListeners) {
			changeEventListeners[i].onChange(model);
		}
    };
	self.addChangeEventListener = function(listener) {
		changeEventListeners.push(listener);
	};
	self.removeChangeEventListener = function(listener) {
		var index = changeEventListeners.indexOf(listener);
		if (index == -1) {
			return;
		}
		changeEventListeners.splice(index, 1);
	};
};

WsTemplateController.inherits(WsControllerSupport);
