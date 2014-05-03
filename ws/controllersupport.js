var WsControllerSupport = function() {
	var self = this;
	
	var $viewContainer = null;
	var view = null;
	var pageView = null;
	var pageBgView = null;
	var pageIView = null;
	
	self.getViewContainer = function() {
		return $viewContainer;
	};
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

	var scale = 0;
	self.getScale = function() {
		return scale;
	};
	self.setScale = function(newScale) {
		scale = newScale;
		scaleObject = {
			x : scale,
			y : scale
		};
		pageView.setScale(scaleObject);
		pageBgView.setScale(scaleObject);
		pageIView.setScale(scaleObject);
		self.updateViewGeometry();
	};
	self.positionRelativeToPage = function(position) {
		var viewContainerPosition = $viewContainer.offset();
		var pageViewPosition = pageView.getAbsolutePosition();
		var safeScale = scale === 0 ? 1 : scale;
		return {
			x : (position.x - viewContainerPosition.left - pageViewPosition.x)
				/ safeScale,
			y : (position.y - viewContainerPosition.top - pageViewPosition.y)
				/ safeScale
		};
	};
	self.getItemViewByPosition = function(position) {
		var target = pageView.getIntersection(position);
		if (target === null) {
			return null;
		}
		return WsControllerSupport.getEventTarget({
				target : target
			},
			function(target) {
				return target.getAttr('model');
			}, function(target) {
				return target.getType() === 'Layer';
			}
		);
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
		pageIView.find('.bg').setSize(size);
	};
	self.updateViewGeometry = function() {
		view.setSize({
			width : $viewContainer.width(),
			height : $viewContainer.height()
		});
		var safeScale = scale === 0 ? 1 : scale;
		self.setPagePosition({
			x : (view.getWidth() - pageView.getWidth() * safeScale) / 2,
			y : (view.getHeight() - pageView.getHeight() * safeScale) / 2
		});
		view.draw();
	};
	
	self.getItemView = function(item) {
		var itemViews = pageView.getChildren(function(node) {
			return node.getAttr('model') === item;
		});
		return itemViews.length === 0 ? null : itemViews[0];
	};
	
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
	};
	
	var selectedItemView = null;
	self.getSelectedItemView = function() {
		return selectedItemView;
	};
	var selectedItem = null;
	self.getSelectedItem = function() {
		return selectedItem;
	};
	self.selectItem = function(item) {
		if (!item || self.getItemView(item) === null) {
			selectedItemView.setVisible(false);
		} else {
			var itemView = self.getItemView(item);
			selectedItemView.setPosition(itemView.getPosition());
			selectedItemView.setSize(itemView.getSize());
			selectedItemView.getChildren().setSize(itemView.getSize());
			selectedItemView.setVisible(true);
		}
		if (item !== selectedItem) {
			if (editor !== null) {
				self.destroyEditor();
			} else {
				pageIView.batchDraw();
			}
			selectedItem = item;
			self.fireSelectEvent(selectedItem);
		} else {
			pageIView.batchDraw();
		}
	};
	
	var editor = null;
	self.getEditor = function() {
		return editor;
	};
	self.createEditor = function(onChange) {
		if (editor !== null || selectedItem === null) {
			return null;
		}
		editor = WsItemFactory.forType(selectedItem.type).createEditor(
			selectedItem, onChange);
		if (editor === null) {
			return null;
		}
		editor.setSize(selectedItemView.getSize());
		selectedItemView.add(editor);
		editor.fire('create');
		pageIView.batchDraw();
		return editor;
	};
	self.destroyEditor = function() {
		if (editor === null) {
			return null;
		}
		var temporaryEditor = editor;
		editor = null;
		temporaryEditor.destroy();
		temporaryEditor.fire('destroy');
		pageIView.batchDraw();
		return temporaryEditor;
	};
	
	self.setBgColor = function(color) {
		var pageBg = pageBgView.find('.bgColor');
		pageBg.fill(color);
		var placeholderItemViewBgColor = tinycolor(color);
		placeholderItemViewBgColor.setAlpha(0.625);
		placeholderItemView.fill(placeholderItemViewBgColor.toRgbString());
		pageBgView.draw();
	};
	
	var clickEventPropagationStopped = false;
	self.isClickEventPropagationStopped = function() {
		if (clickEventPropagationStopped) {
			clickEventPropagationStopped = false;
			return true;
		}
		return false;
	};
	self.stopClickEventPropagation = function() {
		clickEventPropagationStopped = true;
	};
	var dblClickEventPropagationStopped = false;
	self.isDblClickEventPropagationStopped = function() {
		if (dblClickEventPropagationStopped) {
			dblClickEventPropagationStopped = false;
			return true;
		}
		return false;
	};
	self.stopDblClickEventPropagation = function() {
		dblClickEventPropagationStopped = true;
	};
	
	function stopEventPropagation(e) {
		e.stopPropagation();
		e.preventDefault();
		e.cancelBubble = true;
		return false;
	}
	
	var windowResizeEventTimerId = 0;
	self.onWindowResize = function() {
		clearTimeout(windowResizeEventTimerId);
		if (!self.isFocused()) {
			return true;
		}
		windowResizeEventTimerId = setTimeout(function() {
			self.updateViewGeometry();
		}, 250);
	};
	self.onKeydown = function(e) {
		if (!self.isFocused()) {
			return true;
		}
		switch (e.which) {
		case 13:
			if (selectedItem && self.createEditor(this.updateSelectedItem)) {
				return stopEventPropagation(e);
			}
			break;
		case 27:
			if (selectedItem && self.destroyEditor()) {
				return stopEventPropagation(e);
			}
			break;
		default:
			break;
		}
		return true;
	};
	self.onBodyMousdown = function(e) {
		if (!self.isFocused()) {
			return true;
		}
		self.destroyEditor();
	};
	self.onPageIViewClick = function(data) {
		if (data.evt.which !== 1) {
			return;
		}
		var itemView = self.getItemViewByPosition(view.getPointerPosition());
		if (itemView === null) {
			self.selectItem();
			return;
		}
		var itemModel = itemView.getAttr('model');
		if (itemModel !== selectedItem) {
			self.selectItem(itemModel);
		}
		self.stopClickEventPropagation();
	};
	self.onSelectedItemViewDblClick = function(data) {
		if (data.evt.which !== 1) {
			return;
		}
		if (self.createEditor(this.updateSelectedItem)) {
			self.stopDblClickEventPropagation();
		}
	};
	
	var pageMargin = 20;
	self.createView = function($container) {
		$viewContainer = $container;
		$viewContainer.addClass('pd-ws');
		$viewContainer.data('wsController', self);
		$viewContainer.pdDraggable({
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
				var safeScale = scale === 0 ? 1 : scale;
				if (newPosition.x > pageMargin
					|| newPosition.x + pageView.getWidth() * safeScale
						+ pageMargin
					< view.getWidth()) {
					newPosition.x = pageView.getPosition().x;
				}
				if (newPosition.y > pageMargin
					|| newPosition.y + pageView.getHeight() * safeScale
						+ pageMargin
					< view.getHeight()) {
					newPosition.y = pageView.getPosition().y;
				}
				self.setPagePosition(newPosition);
				view.batchDraw();
			},
		}).on('dblclick.pdWsControllerSupport',
			function(e) {
				if(self.isDblClickEventPropagationStopped()) {
					return stopEventPropagation(e);
				}
			}).on('click.pdWsControllerSupport',
			function(e) {
				if(self.isClickEventPropagationStopped()) {
					return stopEventPropagation(e);
				}
			});
		view = new Kinetic.Stage({
			container : $viewContainer.get(0)
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
			strokeWidth : 1.5
		}));
		pageIView.add(selectedItemView);
		var pageIViewBg = new Kinetic.Rect({
			name : 'bg'
		});
		pageIView.add(pageIViewBg);
		pageIViewBg.moveToBottom();
		placeholderItemView = new Kinetic.Rect({
			name : 'placeholderItemView',
			stroke : 'red',
			strokeWidth : 1,
			dash : [8, 4]
		});
		pageIView.add(placeholderItemView);
		view.add(pageIView);
		pageIView.setZIndex(2);
	};
	
	var focused = false;
	self.isFocused = function() {
		return focused;
	};
	self.focus = function() {
		var $focusedWsController = $('.pd-ws-focused');
		if ($focusedWsController.length !== 0) {
			var focusedWsController = $focusedWsController.data('wsController');
			if (focusedWsController === self) {
				return;
			}
			focusedWsController.blur();
		}
		$viewContainer.addClass('pd-ws-focused');
		self.updateViewGeometry();
		self.fireSelectEvent(selectedItem);
		focused = true;
	};
	self.blur = function(passOnFocus) {
		if (!self.isFocused()) {
			return;
		}
		if (passOnFocus) {
			var $unfocusedWsControllers = $('.pd-ws:not(.pd-ws-focused)');
			if ($unfocusedWsControllers.length !== 0) {
				var unfocusedWsController = $unfocusedWsControllers.eq(0)
					.data('wsController');
				unfocusedWsController.focus();
				return;
			}
		}
		$viewContainer.removeClass('pd-ws-focused');
		self.fireSelectEvent();
		focused = false;
	};
	
	var selectEventListeners = [];
    self.fireSelectEvent = function(selected) {
		for (var i in selectEventListeners) {
			selectEventListeners[i].onSelect(selected);
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
