var PriceService = function($container, source) {
	var self = this;
	
	$container.addClass('pd-price-service');
	
	function walkTree(item, $parent, level) {
		for (var key in item) {
			if (typeof item[key] === 'object') {
				if (typeof item[key].media === 'undefined') {
					var $category = $('<div class="pd-price-service-level-'
						+ level + '"/>').append(
							$('<div class="pd-price-service-item '
								+ 'pd-price-service-category">'
								+ /*item[key].name*/'Category' + '</div>'))
						.pdDraggable({
							dragObject : function() {
								return $('<div/>').pdWsItem({
									model : {
										type : 'template',
										config : {
											price : JSON.parse(
												JSON.stringify(item[key].id)),
											template : 'default'
										}
									}
								});
							}
						});
								
					$parent.append($category);
					walkTree(item[key], $category, level + 1);
				} else {
					var $item = $('<div class="pd-price-service-level-'
						+ level + '"/>').append(
							$('<div class="pd-price-service-item">'
								+ /*item[key].name*/'Item' + '</div>'))
						.pdDraggable({
							dragObject : function() {
								return $('<div/>').pdWsItem({
									model : {
										type : 'template',
										config : {
											price : item[key].id,
											template : 'default'
										}
									}
								});
							}
						});
					$parent.append($item);
				}
			}
		}
	}
	walkTree(source, $container, 0);
	
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
