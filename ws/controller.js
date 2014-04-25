var WsControllerSupport = function() {
	var self = this;
	
	var viewContainer = null;
	var view = null;
	var pageView = null;
	var pageBgView = null;
	var pageIView = null;
	
	self.getView = function() {
		return view;
	};
	self.getPageView = function() {
		return pageView;
	};
	self.getPageBgView = function() {
		return pageBgView;
	};
	self.getPageIView = function() {
		return pageIView;
	};
	
	self.positionRelativeToPage = function(position) {
		var viewContainerPosition = viewContainer.offset();
		var pageViewPosition = pageView.getAbsolutePosition();
		return {
			x : position.x - viewContainerPosition.left - pageViewPosition.x,
			y : position.y - viewContainerPosition.top - pageViewPosition.y
		};
	}
	
	self.getItemView = function(item) {
		var itemViews = pageView.getChildren(function(node) {
			return node.getAttr('model') === item;
		});
		return itemViews.length === 0 ? null : itemViews[0];
	}
	
	var placeholderItemView = null;
	self.getPlaceholderItemView = function() {
		return placeholderItemView;
	};
	var placeholderItem = null;
	self.getPlaceholderItem = function() {
		return placeholderItem;
	};
	self.setPlaceholderItem = function(item) {
		placeholderItem = item;
		var itemView = self.getItemView(placeholderItem);
		if (!placeholderItem || itemView === null) {
			placeholderItemView.setVisible(false);
		} else {
			placeholderItemView.setPosition(itemView.getPosition());
			placeholderItemView.setSize(itemView.getSize());
			placeholderItemView.setVisible(true);
		}
		pageIView.batchDraw();
	}
	
	var selectedItemView = null;
	self.getSelectedItemView = function() {
		return selectedItemView;
	};
	var selectedItem = null;
	self.getSelectedItem = function() {
		return selectedItem;
	};
	self.selectItem = function(item) {
		var itemView = self.getItemView(item);
		if (!item || itemView === null) {
			selectedItemView.setVisible(false);
		} else {
			selectedItemView.setPosition(itemView.getPosition());
			selectedItemView.setSize(itemView.getSize());
			selectedItemView.getChildren().setSize(itemView.getSize());
			selectedItemView.setVisible(true);
		}
		if (item !== selectedItem) {
			self.destroyEditor();
			selectedItem = item;
			self.fireSelectEvent();
		}
		pageIView.batchDraw();
	};
	
	var editor = null;
	self.getEditor = function() {
		return editor;
	},
	self.createEditor = function(onChange) {
		if (selectedItem === null) {
			return;
		}
		editor = WsItemFactory.forType(selectedItem.type).createEditor(
			selectedItem, onChange);
		if (editor === null) {
			return;
		}
		editor.setSize(selectedItemView.getSize());
		editor.setAttr('preventDestroy', true);
		selectedItemView.add(editor);
		editor.fire('create');
		pageIView.batchDraw();
	},
	self.destroyEditor = function() {
		if (editor === null) {
			return;
		}
		var temporaryEditor = editor;
		editor = null;
		temporaryEditor.destroy();
		temporaryEditor.fire('destroy');
		pageIView.batchDraw();
	},
	self.setBgColor = function(color) {
		var pageBg = pageBgView.find('.bgColor');
		pageBg.fill(color);
		pageBg.cache();
		var placeholderItemView = pageIView.find('.placeholderItemView');
		var rgbColor = new RGBColor(color);
		if (rgbColor.ok) {
			placeholderItemView.fill('rgba(' + rgbColor.r + ',' + rgbColor.g + ',' + rgbColor.b + ',' + 0.5 + ')');
		}
	};
	self.setPagePosition = function(position) {
		pageView.setPosition(position);
		pageBgView.setPosition(position);
		pageIView.setPosition(position);
	};
	self.setPageSize = function(size) {
		pageView.setSize(size);
		pageBgView.setSize(size);
		pageBgView.getChildren().setSize(size);
		pageIView.setSize(size);
	};
	var isPageViewDraggingEnabled = false;
	self.updateViewGeometry = function() {
		view.setSize({
			width : viewContainer.width(),
			height : viewContainer.height()
		});
		self.setPagePosition({
			x : (view.getWidth() - pageView.getWidth()) / 2,
			y : (view.getHeight() - pageView.getHeight()) / 2
		});
		view.batchDraw();
	};
	
	var windowResizeEventTimerId = 0;
	self.onWindowResize = function() {
		clearTimeout(windowResizeEventTimerId);
		windowResizeEventTimerId = setTimeout(function() {
			self.updateViewGeometry();
		}, 250);
	};
	self.onKeydown = function(e) {
		//console.log('onKeydown')
		if (editor) {
			e.stopPropagation();
		}
		switch (e.which) {
		case 27:
			self.destroyEditor();
			break;
		default:
			break;
		}
		return;
	};
	self.onBodyClick = function(e) {
		//console.log('onBodyClick')
		if (e.which !== 1) {
			return;
		}
		if (editor) {
			if (editor.getAttr('preventDestroy') === true) {
				editor.setAttr('preventDestroy', false);
				return;
			}
			self.destroyEditor();
		}
	};
	self.onPageBgViewClick = function(data) {
		//console.log('onPageBgViewClick')
		if (data.evt.which !== 1) {
			return;
		}
		self.selectItem();
	},
	self.onPageViewClick = function(data) {
		//console.log('onPageViewClick')
		if (data.evt.which !== 1) {
			return;
		}
		var itemView = WsControllerSupport.getEventTarget(data,
			function(target) {
				return target.getAttr('model');
			}, function(target) {
				return target.getType() === 'Layer';
			}
		);
		self.selectItem(itemView.getAttr('model'));
	},
	self.onSelectedItemViewClick = function(data) {
		//console.log('onSelectedItemViewClick')
		if (data.evt.which !== 1) {
			return;
		}
		if (editor !== null) {
			editor.setAttr('preventDestroy', true);
		}
	}
	self.onSelectedItemViewDblClick = function(data) {
		//console.log('onSelectedItemViewDblClick')
		if (data.evt.which !== 1) {
			return;
		}
		if (editor !== null) {
			return;
		}
		self.createEditor(this.updateSelectedItem);
	}
	
	var pageMargin = 20;
	self.createView = function(container) {
		viewContainer = container;
		viewContainer.pdDraggable({
			dragObject : function() {
				return $('<div/>');
			},
			start : function(e) {
				if (e.which !== 2) {
					e.stopPropagation();
				} else {
					e.dragObject.data('position', pageView.getPosition());
				}
			},
			drag : function(e) {
				var position = e.dragObject.data('position');
				var newPosition = {
					x : position.x + e.offset.left,
					y : position.y + e.offset.top,
				};
				if (newPosition.x > pageMargin
					|| newPosition.x + pageView.getWidth() + pageMargin
					< view.getWidth()) {
					newPosition.x = pageView.getPosition().x;
				}
				if (newPosition.y > pageMargin
					|| newPosition.y + pageView.getHeight() + pageMargin
					< view.getHeight()) {
					newPosition.y = pageView.getPosition().y;
				}
				self.setPagePosition(newPosition);
				view.batchDraw();
			},
		});
		view = new Kinetic.Stage({
			container : viewContainer.get(0)
		});
		pageView = new Kinetic.Layer();
		view.add(pageView);
		pageView.setZIndex(1);
		pageBgView = new Kinetic.Layer();
		pageBgView.add(new Kinetic.Rect({
			name : 'bgColor',
			stroke : 'black',
			strokeWidth : 1,
		}));
		view.add(pageBgView);
		pageBgView.setZIndex(0);
		pageIView = new Kinetic.Layer();
		selectedItemView = new Kinetic.Group({
			name : 'selectedItemView'
		});
		selectedItemView.add(new Kinetic.Rect({
			name : 'selection',
			stroke : 'red',
			strokeWidth : 1
		}));
		pageIView.add(selectedItemView);
		placeholderItemView = new Kinetic.Rect({
			name : 'placeholderItemView',
			fill : 'rgba(255, 255, 255, 0.5)',
			stroke : 'red',
			strokeWidth : 1,
			dash : [8, 4]
		});
		pageIView.add(placeholderItemView);
		view.add(pageIView);
		pageIView.setZIndex(2);
	};
	
	var selectEventListeners = [];
    self.fireSelectEvent = function(selectedItem) {
		for (var i in selectEventListeners) {
			selectEventListeners[i].onSelect(self.getSelectedItem());
		}
    };
	self.addSelectEventListener = function(listener) {
		selectEventListeners.push(listener);
	};
	self.removeSelectEventListener = function(listener) {
		var index = selectEventListeners.indexOf(listener);
		if (index == -1) {
			return;
		}
		selectEventListeners.splice(index, 1);
	};
};
WsControllerSupport.getEventTarget = function(e, matchFunction, breakFunction) {
	var target = null;
	var getParentFunctionName = null;
	if (e.target.getParent) {
		target = e.target;
		getParentFunctionName = 'getParent';
		if (!breakFunction) {
			breakFunction = function(target) {
				return target;
			}
		}
	} else {
		target = $(e.target);
		getParentFunctionName = 'parent';
		if (!breakFunction) {
			breakFunction = function(target) {
				return target.length === 0;
			}
		}
	}
	while(!breakFunction(target)) {
		if (matchFunction(target)) {
			return target;
		}
		target = target[getParentFunctionName]();
	}
	return null;
};

var WsController = function(viewContainer, model, themeManager) {
	var self = this;
	self.createView(viewContainer);
	self.setPageSize({
		width : model.getWidth(),
		height : model.getHeight()
	});
	self.setBgColor(themeManager.getTheme().bg);
	
	var page = 0;
	var pageView = self.getPageView();
	var reneredItems = [];
	var eventListener = {
		onSelectedItemViewDblClick : self.onSelectedItemViewDblClick.bind(self),
		onKeydown : function(e) {
			//console.log('onKeydown')
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
			return;
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
	var themeManagerEventListener = {
		onChange : function(theme, templates) {
		}
	};
	viewContainer.pdDroppable({
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
	themeManager.addChangeEventListener(themeManagerEventListener);
	
	self.updateSelectedItem = function(update) {
		WsController.cache.remove(self.getSelectedItem());
		reneredItems = [];
		if (!update) {
			model.remove(self.getSelectedItem().p,
				self.getSelectedItem().i);
			model.store();
			self.selectItem();
			return;
		}
		$.extend(true, self.getSelectedItem(), update);
		var wsItemFactory = WsItemFactory.forType(self.getSelectedItem().type);
		var itemView = wsItemFactory.createView(self.getSelectedItem());
		itemView.on('render', function() {
			var selectedItem = self.getSelectedItem();
			if (selectedItem.w > model.getWidth()) {
				selectedItem.w = model.getWidth();
			}
			if (selectedItem.h > model.getHeight()) {
				selectedItem.h = model.getHeight();
			}
			model.update(selectedItem.p, selectedItem.i);
			model.store();
			if (page != selectedItem.p) {
				page = selectedItem.p;
				self.render(0);
			}
			self.selectItem(selectedItem);
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
		console.log(index);
		var items = model.get(page);
		console.log('==');
		console.log(items.length);
		console.log(reneredItems.length);
		if (items.length) {
			items = items.slice(index);
			if (compareItemArrays(items, reneredItems)) {
				console.log('return');
				return;
			}
			console.log('render');
			var itemViews = pageView.getChildren(function(node) {
				return node.getAttr('model')
					&& node.getAttr('index') >= index;
			});
			itemViews.each(function(node) {
				node.remove();
			});
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
			self.setPlaceholderItem(self.getPlaceholderItem());
			pageView.removeChildren();
			reneredItems = [];
		}
		pageView.batchDraw();
	};
	
	self.updateViewGeometry();
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

var WsTemplateController = function(viewContainer, themeManager) {
	var self = this;
	self.createView(viewContainer);
	var model = null;
	var pageView = self.getPageView();
	
	function addItem(item) {
		model.items.push(item);
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
		});
		pageView.draw();
	}
	function removeItem(item) {
		var index = model.items.indexOf(item);
		if (index === -1) {
			return;
		}
		model.items.splice(index, 1);
		var itemView = self.getItemView(item);
		itemView.remove();
		pageView.draw();
	}
	
	var eventListener = {
		onKeydown : function(e) {
			//console.log('onKeydown')
			self.onKeydown(e);
			if (e.isPropagationStopped()) {
				return;
			}
			switch (e.which) {
			case 46:
				if (self.getSelectedItem()) {
					removeItem(self.getSelectedItem());
					self.selectItem();
				}
				break;
			default:
				break;
			}
			return;
		},
		onSelectedItemViewDblClick : self.onSelectedItemViewDblClick.bind(self),
		onSelectedItemViewMousedown : function(data) {
			if (self.getEditor() !== null) {
				return;
			}
			var itemView = self.getItemView(self.getSelectedItem());
			itemView.startDrag();
		},
		onDropAccept : function($dragObject) {
			return $dragObject.data('pdWsItem');
		},
		onDropOver : function(e) {
			//console.log('dropover');
		},
		onDropOut : function(e) {
			//console.log('dropout');
		},
		onDropMove : function(e) {
			//console.log('dropmove');
		},
		onDrop : function(e) {
			//console.log('drop');
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
	
	viewContainer.pdDroppable({
		accept : eventListener.onDropAccept,
		over : eventListener.onDropOver,
		out : eventListener.onDropOut,
		move : eventListener.onDropMove,
		drop : eventListener.onDrop,
	});
			
	self.open = function(template) {
		model = template;
		if (typeof model.items !== 'array') {
			model.items = [];
		}
		self.setPageSize({
			width : model.width,
			height : model.height
		});
		self.setBgColor(model.bgColor);
		
		$(window).on('resize.pdWsTemplateController', self.onWindowResize);
		$(window).on('keydown.pdWsTemplateController', eventListener.onKeydown);
		$(document.body).on('click.pdWsTemplateController', self.onBodyClick);
		self.getPageView().on('click.pdWsTemplateController',
			self.onPageViewClick);
		self.getPageBgView().on('click.pdWsTemplateController',
			self.onPageBgViewClick);
		self.getSelectedItemView().on('click.pdWsTemplateController',
			self.onSelectedItemViewClick);
		self.getSelectedItemView().on('dblclick.pdWsTemplateController',
			eventListener.onSelectedItemViewDblClick);
		self.getSelectedItemView().on('mousedown.pdWsTemplateController',
			eventListener.onSelectedItemViewMousedown);
			
		viewContainer.show();
		self.updateViewGeometry();
	};
	
	self.close = function() {
		viewContainer.hide();
		$(window).off('.pdWsTemplateController');
		$(document.body).on('.pdWsTemplateController');
		self.getPageView().on('.pdWsTemplateController');
		self.getPageBgView().on('.pdWsTemplateController');
		self.getSelectedItemView().off('.pdWsTemplateController');
		pageView.removeChildren();
		pageView.draw();
		self.fireChangeEvent();
		model = null;
	};
	
	self.updateSelectedItem = function(update) {
		if (!update) {
			removeItem(self.getSelectedItem());
			self.selectItem();
			return;
		}
		$.extend(true, self.getSelectedItem(), update);
		var itemView = self.getItemView(self.getSelectedItem());
		WsItemFactory.util.clearView(itemView);
		itemView.on('render', function() {
			self.selectItem(self.getSelectedItem());
			pageView.batchDraw();
			this.off('render');
		});
		WsItemFactory.forType(self.getSelectedItem().type).render(itemView);
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
	
	viewContainer.hide();
};

WsTemplateController.inherits(WsControllerSupport);
