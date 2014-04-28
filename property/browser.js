var PropertyBrowser = function($viewContainer) {
	var defaultProperties = {};
	var currentItem = null;
	var properties = null;
	var updatePropertiesTimerId = 0;
	
	$viewContainer.addClass('pd-property-browser');
	var classes = ['rasta-color-green',
		'rasta-color-yellow',
		'rasta-color-red'];
	
	this.setDefault = function(properties) {
		
	};
	this.set = function(item, onChange) {
		if (item) {
			var wsItemFactory = WsItemFactory.forType(item.type);
			if (currentItem === item) {
				for (var key in properties) {
					wsItemFactory.setPropertyValue(properties, key, item);
				}
				return;
			}
			$viewContainer.empty();
			properties = wsItemFactory.createProperties(onChange);
			properties = Object.extend({}, properties);
			if (item.p === -1 || item.i === -1) {
				delete properties.p;
				delete properties.i;
			} else {
				delete properties.x;
				delete properties.y;
			}
			var i = 0;
			for (var key in properties) {
				var $property = $('<div class="pd-property"/>');
				var propertyId = 'ws-property-' + key;
				var label = properties[key].label;
				if (typeof label === 'string') {
					label = $('<label for="' + propertyId
						+ '" class="pd-property-label '
						+ classes[i % 3] + '">'
						+ label + '</label>');
				}
				$property.append(label);
				var control = properties[key].control;
				control.attr('id', propertyId);
				control.addClass('pd-property-control ' + classes[++i % 3]);
				wsItemFactory.setPropertyValue(properties, key, item);
				$property.append(control);
				$viewContainer.append($property);
			}
			currentItem = item;
			return;
		}
		$viewContainer.empty();
		currentItem = null;
		properties = null;
	};
};
