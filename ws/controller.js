var WsController = function($viewContainer, model, theme) {
	var self = this;
	self.createView($viewContainer);
	
	var page = 0;
	var pageView = self.getPageView();
	var reneredItems = [];
	var eventListener = {
		onSelectedItemViewDblClick : self.onSelectedItemViewDblClick.bind(self),
		onKeydown : function(e) {
			if (!self.isFocused()) {
				return true;
			}
			if (!self.onKeydown(e)) {
				return false;
			}
			switch (e.which) {
			case 46:
				if (self.getSelectedItem()) {
					WsController.cache.remove(self.getSelectedItem());
					reneredItems = [];
					model.remove(self.getSelectedItem().p,
						self.getSelectedItem().i);
					model.store();
					self.selectItem();
					return false;
				}
				break;
			default:
				break;
			}
			return true;
		},
		onDropAccept : function($dragObject) {
			return $dragObject.data('pdWsItem');
		},
		onDropOver : function(e) {
			self.selectItem();
			e.dragObject.off({
				'destroy' : eventListener.onDrop
			});
			e.dragObject.on('destroy', eventListener.onDrop);
			
			var placeholderItem = e.dragObject.data('pdWsItem').view.getAttr('model');
			if (placeholderItem.w > model.getWidth()) {
				placeholderItem.w = model.getWidth();
			}
			if (placeholderItem.h > model.getHeight()) {
				placeholderItem.h = model.getHeight();
			}
			self.setPlaceholderItem(placeholderItem);
		},
		onDropOut : function(e) {
			var placeholderItem = self.getPlaceholderItem();
			if (placeholderItem.p === page || placeholderItem.i !== -1) {
				model.remove(placeholderItem.p, placeholderItem.i);
			}
		},
		onDropMove : function(e) {
			var dragObjectPosition = e.dragObject.offset();
			var position = self.positionRelativeToPage({
				x : dragObjectPosition.left,
				y : dragObjectPosition.top,
			});
			if (position.x < 0 || position.y < 0
				|| position.x > pageView.getWidth()
				|| position.y > pageView.getHeight()) {
				return;
			}
			var placeholderItem = self.getPlaceholderItem();
			placeholderItem.x = position.x;
			placeholderItem.y = position.y;
			if (placeholderItem.p != page || placeholderItem.i == -1) {
				model.add(page, placeholderItem);
			} else {
				model.realign(page, placeholderItem.i);
			}
		},
		onDrop : function(e) {
			var placeholderItem = self.getPlaceholderItem();
			if (placeholderItem.p !== page || placeholderItem.i === -1) {
				WsController.cache.remove(placeholderItem);
			} else {
				model.store();
			}
			var itemView = self.getItemView(placeholderItem);
			if (itemView) {
				self.selectItem(placeholderItem);
			}
			self.setPlaceholderItem();
		}
	};
	var modelEventListener = {
		onStore : function() {
		},
		onChange : function(range) {
			if (page >= model.get().pages.length) {
				page--;
				self.render(0);
				self.firePagesChangeEvent();
				return;
			}
			if (range[0].p == page) {
				self.render(range[0].i);
			} else if (range[1].p == page) {
				self.render(range[0].i);
			} else {
				self.render(0);
			}
		},
		onPagesChange : function(pages) {
			self.firePagesChangeEvent();
		}
	};
	$viewContainer.pdDroppable({
		accept : eventListener.onDropAccept,
		over : eventListener.onDropOver,
		out : eventListener.onDropOut,
		move : eventListener.onDropMove
	});
	$(window).on('resize.pdWsController', self.onWindowResize);
	$(window).on('keydown.pdWsController', eventListener.onKeydown);
	$(document.body).on('mousedown.pdWsController', self.onBodyMousdown);
	self.getPageIView().on('click.pdWsController', self.onPageIViewClick);
	self.getSelectedItemView().on('dblclick.pdWsTemplateController',
		eventListener.onSelectedItemViewDblClick);
	model.addChangeEventListener(modelEventListener);
	model.addPagesChangeEventListener(modelEventListener);
	
	var startDrag = false;
	var draggingItemView = null;
	self.getPageIView().on('mousedown.pdWsController', function(data) {
		if (data.evt.which !== 1) {
			return;
		}
		if (self.getEditor() !== null) {
			return;
		}
		startDrag = true;
		
	});
	self.getPageIView().on('mousemove.pdWsController', function(data) {
		if (!startDrag) {
			return;
		}
		startDrag = false;
		draggingItemView = self.getItemViewByPosition(
			self.getView().getPointerPosition());
		if (!draggingItemView) {
			return;
		}
		self.setPlaceholderItem(draggingItemView.getAttr('model'));
		draggingItemView = draggingItemView.clone().add(new Kinetic.Circle({
			radius : 2.5,
			fill : 'white',
			stroke : 'grey',
			strokeWidth : 0.5,
		}));
		self.getPageIView().add(draggingItemView);
		draggingItemView.on('dragmove', function(data) {
			var position = draggingItemView.getPosition();
			if (position.x < 0 || position.y < 0
				|| position.x > pageView.getWidth()
				|| position.y > pageView.getHeight()) {
				return;
			}
			var placeholderItem = self.getPlaceholderItem();
			placeholderItem.x = position.x;
			placeholderItem.y = position.y;
			if (placeholderItem.p != page || placeholderItem.i == -1) {
				model.add(page, placeholderItem);
			} else {
				model.realign(page, placeholderItem.i);
			}
		});
		self.selectItem();
		draggingItemView.setDragDistance(8);
		draggingItemView.startDrag();
	});
	self.getPageIView().on('mouseup.pdWsController', function(data) {
		startDrag = false;
		if (!draggingItemView) {
			return;
		}
		draggingItemView.remove();
		draggingItemView.destroy();
		draggingItemView = null;
		self.selectItem(self.getPlaceholderItem());
		self.setPlaceholderItem();
		self.getPageView().draw();
	});
	self.onPageSelect = function(selectedPage) {
		if (selectedPage >= 0 && selectedPage < model.get().pages.length) {
			page = selectedPage;
			self.render(0);
			self.firePagesChangeEvent();
			self.selectItem(self.getSelectedItem());
		}
	};
		
	self.updateSelectedItem = function(update) {
		var selectedItem = self.getSelectedItem();
		reneredItems = [];
		if (!update) {
			model.remove(selectedItem.p, selectedItem.i);
			self.selectItem();
			WsController.cache.remove(selectedItem);
			model.store();
			return;
		}
		Object.extend(selectedItem, update, true);
		if (selectedItem.w < 0) {
			selectedItem.w = 0;
		}
		if (selectedItem.h < 0) {
			selectedItem.h = 0;
		}
		function onRender(itemView) {
			WsController.cache.remove(selectedItem);
			WsController.cache.add(itemView);
			model.update(selectedItem.p, selectedItem.i);
			if (page !== selectedItem.p) {
				page = selectedItem.p;
				self.render(0);
				self.firePagesChangeEvent();
			}
			self.selectItem(selectedItem);
			self.fireSelectEvent(selectedItem);
			model.store();
		}
		var wsItemFactory = WsItemFactory.forType(selectedItem.type);
		var itemView = wsItemFactory.createView(selectedItem);
		itemView.on('render', function() {
			if (selectedItem.w < 1 || selectedItem.w > model.getWidth()) {
				selectedItem.w = model.getWidth();
				var itemView = wsItemFactory.createView(selectedItem);
				itemView.on('render', function() {
					onRender(itemView);
				});
				wsItemFactory.render(itemView);
			} else if (selectedItem.h < 1
				|| selectedItem.h > model.getHeight()) {
				selectedItem.h = model.getHeight();
				var itemView = wsItemFactory.createView(selectedItem);
				itemView.on('render', function() {
					onRender(itemView);
				});
				wsItemFactory.render(itemView);
			} else {
				onRender(this);
			}
		});
		wsItemFactory.render(itemView);
	};
	
	function compareItemArrays(firstArray, secondArray) {
		if (firstArray.length !== secondArray.length) {
			return false;
		}
		for (var i = 0; i < firstArray.length; i++) {
			if (firstArray[i] !== secondArray[i]) {
				return false;
			}
		}
		return true;
	}
	self.render = function(index) {
		var items = model.get(page);
		if (items.length) {
			items = items.slice(index);
			if (compareItemArrays(items, reneredItems)) {
				return;
			}
			pageView.getChildren(function(node) {
				return node.getAttr('model')
					&& node.getAttr('index') >= index;
			}).remove();
			self.setPlaceholderItem(self.getPlaceholderItem());
			for (var i = 0; i < items.length; i++) {
				var item = items[i];
				var itemView = WsController.cache.get(item);
				if (itemView) {
					itemView.setPosition({
						x : item.x,
						y : item.y,
					});
				} else {
					var wsItemFactory = WsItemFactory.forType(item.type);
					itemView = wsItemFactory.createView(item);
					wsItemFactory.render(itemView);
					WsController.cache.add(itemView);
				}
				pageView.add(itemView);
				itemView.setZIndex(item.zIndex);
				itemView.setAttr('index', item.i);
				if (item === self.getPlaceholderItem()) {
					self.setPlaceholderItem(item);
				}
			}
			reneredItems = items;
		} else {
			self.setPlaceholderItem();
			pageView.getChildren().remove();
			reneredItems = [];
		}
		pageView.batchDraw();
	};
	
	var pagesChangeEventListeners = [];
    self.firePagesChangeEvent = function() {
		for (var i in pagesChangeEventListeners) {
			pagesChangeEventListeners[i].onPagesChange(page,
				model.get().pages.length);
		}
    };
	self.addPagesChangeEventListener = function(listener) {
		pagesChangeEventListeners.push(listener);
	};
	self.removePagesChangeEventListener = function(listener) {
		var index = pagesChangeEventListeners.indexOf(listener);
		if (index == -1) {
			return;
		}
		pagesChangeEventListeners.splice(index, 1);
	};
	
	self.setPageSize({
		width : model.getWidth(),
		height : model.getHeight()
	});
	self.setBgColor(theme.bgColor);
	self.render(0);
};

WsController.inherits(WsControllerSupport);

WsController.cache = (function(){
	var items = [];
	var itemViews = [];
	return {
		add : function(itemView) {
			items.push(itemView.getAttr('model'));
			itemViews.push(itemView);
		},
		get : function(item) {
			var index = items.indexOf(item);
			if (index === -1) {
				return null;
			}
			return itemViews[index];
		},
		remove : function(item) {
			var index = items.indexOf(item);
			if (index === -1) {
				return null;
			}
			items.splice(index, 1);
			itemViews.splice(index, 1);
		},
		clear : function() {
			items = [];
			itemViews = [];
		}
	};
})();
