var PropertyBrowser = function($viewContainer) {
	var defaultProperties = {};
	
	$viewContainer.addClass('pd-ws-property-browser');
	var classes = ['pd-ws-property-color-green',
		'pd-ws-property-color-yellow',
		'pd-ws-property-color-red'];
	
	this.setDefault = function(properties) {
		
	};
	this.set = function(item, onChange) {
		$viewContainer.empty();
		if (item) {
			var properties = WsItemFactory.forType(item.type)
				.createProperties(item, onChange);
			var i = 0;
			for (var key in properties) {
				var $property = $('<div class="pd-ws-property"/>');
				var propertyId = 'ws-property-' + key;
				var label = properties[key].label;
				if (typeof label === 'string') {
					label = $('<label for="' + propertyId
						+ '" class="pd-ws-property-label '
						+ classes[i % 3] + '">'
						+ label + '</label>');
				}
				$property.append(label);
				var control = properties[key].control;
				control.attr('id', propertyId);
				control.addClass('pd-ws-property-control ' + classes[++i % 3]);
				$property.append(control);
				$viewContainer.append($property);
			}
		}
	};
};
