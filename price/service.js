var PriceService = function($container, source) {
	var self = this;
	
	$container.addClass('pd-price-service');
	
	function createTree(item, $container, level) {
		for (var key in item) {
			if (typeof item[key] === 'object') {
				var $level = $('<div class="pd-price-service-level pd-price-service-level-'
						+ level + '"/>');
				var $item = $('<div class="pd-price-service-item">'
					+ item[key].name + '</div>');
				
				
				var template = item[key].template;
				
				if (typeof item[key].media === 'undefined') {
					if (typeof template === 'undefined') {
						template = 'link' + (level + 1);
					}
				} else {
					if (typeof template === 'undefined') {
						template = 'default';
					}
				}
				var createDragObject = (function(template, price) {
						var f = function() {
						var $item = $('<div/>').pdWsItem({
							model : {
								type : 'template',
								config : {
									price : price,
									template : template
								}
							}
						});
						return $item;
					};
					return f;
				}(template, key));
				$item.pdDraggable({
					dragObject : createDragObject
				});
					
				$level.append($item);
				$container.append($level);
				if (typeof item[key].media === 'undefined') {
					$icon = $('<div class="pd-price-service-level-icon"/>');
					$level.prepend($icon);
					$item.addClass('pd-price-service-category');
					$item.on('click', function(e) {
						var $item = $(this);
						var $level = $item.parent();
						if ($level.hasClass('pd-price-service-level-collapsed')) {
							$level.children('.pd-price-service-level').slideDown('normal')
							$level.removeClass('pd-price-service-level-collapsed');
						} else {
							$level.children('.pd-price-service-level').slideUp('normal')
							$level.addClass('pd-price-service-level-collapsed');
						}
					});
					createTree(item[key], $level, level + 1);
				}
			}
		}
	}
	createTree(source, $container, 0);
	
	$container.find('.pd-price-service-category').trigger('click');
	
	function find(source, id) {
		for (var key in source) {
			if (typeof source[key] === 'object') {
				if (key === id) {
					return source[key];
				}
				if (typeof source[key].media === 'undefined') {
					var item = find(source[key], id);
					if (item !== null) {
						return item;
					}
				}
			}
		}
		return null;
	}
	
	self.get = function(id) {
		return find(source, id);
	};
};
