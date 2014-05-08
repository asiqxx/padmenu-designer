(function($) {
    var DragManager = (function() {
		var droppables = [];
		var $element = null;
		var elementOptions = null;
		var $dragObject = null;
		var initialPointerPosition = null;
		var pointerOffset = null;
		var offset = null;
		var $currentDroppable = null;
		
		var documentBodyStyleCursorBackup;
		
		function cancel() {
			$element = null;
			elementOptions = null;
			$dragObject = null;
			initialPointerPosition = null;
			pointerOffset = null;
			offset = null;
			$currentDroppable = null;
			removeDocumentEventHandlers();
		}

		function mouseMove(e) {
			if (offset === null) {
				if (Math.abs(initialPointerPosition.left - e.pageX)
					< elementOptions.distance
					&& Math.abs(initialPointerPosition.top - e.pageY)
					< elementOptions.distance) {
					return false;
				}
				$dragObject.appendTo($(document.body));
				var event = $.Event('dragstart', {
					dragObject : $dragObject,
					which : e.which
				});
				$element.triggerHandler(event);
				if (event.isPropagationStopped()) {
					cancel();
					return false;
				}
				document.body.style.cursor = 'pointer';
			}

			offset = {
				left : e.pageX - initialPointerPosition.left,
				top : e.pageY - initialPointerPosition.top
			};
			
			var dragObjectPosition = {
				left : e.pageX - pointerOffset.left,
				top : e.pageY - pointerOffset.top,
			};
			$dragObject.css(dragObjectPosition);
			$element.triggerHandler($.Event('drag', {
				dragObject : $dragObject,
				offset : offset
			}));

			var $newDroppable = getCurrentDroppable(
				$dragObject, dragObjectPosition);

			if ($currentDroppable == null ? (null != $newDroppable)
				: ($currentDroppable.get(0) !== ($newDroppable == null
					? null : $newDroppable.get(0)))) {
				if ($currentDroppable) {
					$currentDroppable.triggerHandler($.Event('dropout', {
						dragObject : $dragObject
					}));
				}
				if ($newDroppable) {
					$newDroppable.triggerHandler($.Event('dropover', {
						dragObject : $dragObject
					}));
				}
				$currentDroppable = $newDroppable;
			}
			if ($currentDroppable) {
				$currentDroppable.triggerHandler($.Event('dropmove', {
					dragObject : $dragObject,
					offset : offset
				}));
			}

			return false;
		}

		function mouseUp(e) {
			document.body.style.cursor = documentBodyStyleCursorBackup;
			
			if (offset !== null) {
				var pointerPosition = {
					left : e.pageX,
					top : e.pageY
				};
				if ($currentDroppable) {
					$currentDroppable.triggerHandler($.Event('drop', {
						dragObject : $dragObject,
						offset : offset
					}));
				}
				$element.triggerHandler($.Event('dragstop', {
					dragObject : $dragObject,
					offset : offset
				}));
				$dragObject.triggerHandler($.Event('destroy', {
					dragObject : $dragObject
				}));
				$dragObject.remove();
			}
			cancel();
			
			return false;
		}

		function mouseDown(e) {
			documentBodyStyleCursorBackup = document.body.style.cursor;

			$element = $(this);
			elementOptions = $element.data('pdDraggable').options;
			initialPointerPosition = {
				left : e.pageX,
				top : e.pageY
			};
			if (typeof elementOptions.dragObject == 'function') {
				$dragObject = elementOptions.dragObject();
				pointerOffset = {
					left : $dragObject.width() / 2,
					top : $dragObject.height() / 2
				};
			} else {
				$dragObject = $element.clone(true, true);
				pointerOffset = {
					left : initialPointerPosition.left - $element.offset().left,
					top : initialPointerPosition.top - $element.offset().top
				};
			}
			$dragObject.css({
				'position' : 'absolute',
				'z-index' : elementOptions.zIndex,
				'left' : initialPointerPosition.left - pointerOffset.left,
				'top' : initialPointerPosition.top - pointerOffset.top,
			});

			addDocumentEventHandlers();
			
			return false;
		}

		function addDocumentEventHandlers() {
			var $document = $(document);
			var $body = $(document.body);

			$document.on('mousemove.pdDragManager', mouseMove);
			$document.on('mouseup.pdDragManager', mouseUp);
			$document.on('dragstart.pdDragManager', function() {
				return false;
			});
			$body.on('selectstart.pdDragManager', function() {
				return false;
			});
			if (typeof document.body.style.MozUserSelect != 'undefined') {
				DragManager.MozUserSelectBackup = 
					document.body.style.MozUserSelect;
				document.body.style.MozUserSelect = 'none';
			}
		}

		function removeDocumentEventHandlers() {
			var $document = $(document);
			var $body = $(document.body);
			
			$document.off('.pdDragManager');
			$body.off('.pdDragManager');
			if (typeof document.body.style.MozUserSelect != 'undefined') {
				document.body.style.MozUserSelect = 
					DragManager.MozUserSelectBackup;
				delete DragManager.MozUserSelectBackup;
			}
		}

		function getCurrentDroppable($dragObject, offset) {
			for (var i = 0; i < droppables.length; i++) {
				var droppable = droppables[i];
				var droppableElement = droppable.target.get(0);
				if (droppableElement.offsetParent === null
					|| droppableElement === $element.get(0)
					|| !droppable.options.accept($dragObject)) {
					continue;
				}
				var boundingRect = droppableElement.getBoundingClientRect();
				if (offset.left > boundingRect.left
					&& offset.left < boundingRect.right
					&& offset.top > boundingRect.top
					&& offset.top < boundingRect.bottom) {
					return droppable.target;
				}
			}
			return null;
		}

		return {
			makeDraggable : function($element) {
				$element.on('mousedown', mouseDown);
			},
			unmakeDraggable : function($element) {
				$element.off({
					'mousedown' : mouseDown
				});
			},
			makeDroppable : function($element) {
				droppables.push($element.data('pdDroppable'));
			},
			unmakeDroppable : function($element) {
				var index = droppables.indexOf($element.data('pdDroppable'));
				if (index == -1) {
					return;
				}
				droppables.splice(index, 1);
			}
		};
    }());
    
	var draggableMembers = {
		private : {
			create : function(options) {
				var $self = $(this);
				
				if (!$self.data('pdDraggable')) {
					options = $.extend(
						{
							dragObject : null,
							distance : 8,
							zIndex : 1136
						},
						options
					);
			
					if (typeof options.start == 'function') {
						$self.on('dragstart.pdDraggable', options.start);
					}
					if (typeof options.drag == 'function') {
						$self.on('drag.pdDraggable', options.drag);
					}
					if (typeof options.stop == 'function') {
						$self.on('dragstop.pdDraggable', options.stop);
					}
					
					$self.data('pdDraggable', {
						target : $self,
						options : options
					});
					
					DragManager.makeDraggable($self);
				}
				
				return $self;
			}
		},
		public : {
			destroy : function() {
				var $self = $(this);
				
				$self.off('.pdDraggable');
				$self.removeData('pdDraggable');
				DragManager.unmakeDraggable($self);
					
				return $self;
			}
		}
	};
	
	$.fn.pdDraggable = function(method) {
		if (draggableMembers.public[method]) {
			return draggableMembers.public[method].apply(this,
				Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return draggableMembers.private.create.apply(this, arguments);
		} else {
			$.error('$.fn.pdDraggable: Method "' + method + '" not found.');
		} 
	};
	
	var droppableMembers = {
		private : {
			create : function(options) {
				var $self = $(this);
				
				if (!$self.data('pdDroppable')) {			
					if (typeof options.accept != 'function') {
						options.accept = function() {
							return false;
						};
					}
					if (typeof options.over == 'function') {
						$self.on('dropover.pdDroppable', options.over);
					}
					if (typeof options.out == 'function') {
						$self.on('dropout.pdDroppable', options.out);
					}
					if (typeof options.move == 'function') {
						$self.on('dropmove.pdDroppable', options.move);
					}
					if (typeof options.drop == 'function') {
						$self.on('drop.pdDroppable', options.drop);
					}
					
					$self.data('pdDroppable', {
						target : $self,
						options : options
					});
					
					DragManager.makeDroppable($self);
				}
				
				return $self;
			}
		},
		public : {
			destroy : function() {
				var $self = $(this);
				
				$self.off('.pdDroppable');
				$self.removeData('pdDroppable');
				DragManager.unmakeDroppable($self);
					
				return $self;
			}
		}
	};
	
	$.fn.pdDroppable = function(method) {
		if (droppableMembers.public[method]) {
			return droppableMembers.public[method].apply(this,
				Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return droppableMembers.private.create.apply(this, arguments);
		} else {
			$.error('$.fn.pdDroppable: Method "' + method + '" not found.');
		} 
	}
})(jQuery);
