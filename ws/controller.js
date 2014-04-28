var WsController = function($viewContainer, model, theme) {
	var self = this;
	self.createView($viewContainer);
	self.setPageSize({
		width : model.getWidth(),
		height : model.getHeight()
	});
	self.setBgColor(theme.bgColor);
	
	var page = 0;
	var pageView = self.getPageView();
	var reneredItems = [];
	var eventListener = {
		onSelectedItemViewDblClick : self.onSelectedItemViewDblClick.bind(self),
		onKeydown : function(e) {
			//console.log('onKeydown');
			if (!self.isFocused()) {
				return;
			}
			self.onKeydown(e);
			if (e.isPropagationStopped()) {
				return;
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
				}
				break;
			default:
				break;
			}
		},
		onDropAccept : function($dragObject) {
			return $dragObject.data('pdWsItem');
		},
		onDropOver : function(e) {
			//console.log('dropover');
			self.selectItem();
			e.dragObject.off({
				'destroy' : eventListener.onDrop
			});
			e.dragObject.on('destroy', eventListener.onDrop);
			
			var placeholderItem = e.dragObject.data('pdWsItem').view.getAttr('model');
			if (placeholderItem.p != page || placeholderItem.i == -1) {
				if (placeholderItem.w > model.getWidth()) {
					placeholderItem.w = model.getWidth();
				}
				if (placeholderItem.h > model.getHeight()) {
					placeholderItem.h = model.getHeight();
				}
			} else {
				e.dragObject.data('index', placeholderItem.i);
				redrawItem(placeholderItem);
			}
			self.setPlaceholderItem(placeholderItem);
		},
		onDropOut : function(e) {
			//console.log('dropout');
			var placeholderItem = self.getPlaceholderItem();
			if (placeholderItem.p != page || placeholderItem.i == -1) {
				return;
			}
			if (typeof e.dragObject.data('index') != 'number') {
				model.remove(placeholderItem.p, placeholderItem.i);
			}
		},
		onDropMove : function(e) {
			//console.log('dropmove');
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
			//console.log('drop');
			var placeholderItem = self.getPlaceholderItem();
			if (placeholderItem.p != page || placeholderItem.i == -1) {
				var index = e.dragObject.data('index');
				if (typeof index == 'number') {
					model.insert(page, index, placeholderItem);
				} else {
					WsController.cache.remove(placeholderItem);
				}
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
	};
	$viewContainer.pdDroppable({
		accept : eventListener.onDropAccept,
		over : eventListener.onDropOver,
		out : eventListener.onDropOut,
		move : eventListener.onDropMove
	});
	$(window).on('resize.pdWsController', self.onWindowResize);
	$(window).on('keydown.pdWsController', eventListener.onKeydown);
	$(document.body).on('click.pdWsController', self.onBodyClick);
	self.getPageView().on('click.pdWsController', self.onPageViewClick);
	self.getPageBgView().on('click.pdWsController', self.onPageBgViewClick);
	self.getSelectedItemView().on('click.pdWsController',
		self.onSelectedItemViewClick);
	self.getSelectedItemView().on('dblclick.pdWsController',
		eventListener.onSelectedItemViewDblClick);
	model.addChangeEventListener(modelEventListener);
	
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
		var wsItemFactory = WsItemFactory.forType(selectedItem.type);
		var itemView = wsItemFactory.createView(selectedItem);
		itemView.on('render', function() {
			WsController.cache.remove(selectedItem);
			WsController.cache.add(itemView);
			model.update(selectedItem.p, selectedItem.i);
			if (page != selectedItem.p) {
				page = selectedItem.p;
				self.render(0);
			}
			self.selectItem(selectedItem);
			self.fireSelectEvent(selectedItem);
			model.store();
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
	self.reneredItems = reneredItems;
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
	
	self.focus();
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
