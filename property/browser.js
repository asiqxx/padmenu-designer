var PropertyBrowser = function($viewContainer) {
	var properties = null;
	
	$viewContainer.addClass('pd-property-browser');
	var classes = ['rasta-color-green',
		'rasta-color-yellow',
		'rasta-color-red'];
	
	this.get = function() {
		return properties;
	};
	this.set = function(newProperties) {
		if (properties === newProperties) {
			return;
		}
		properties = newProperties;
		$viewContainer.children().detach();
		if (!properties) {
			return;
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
			$property.append(control);
			$viewContainer.append($property);
		}
	};
};

var PropertiesBuilder = function(properties) {
	function createUpdateObject(name, value) {
		var updateObject = {};
		var names = name.split('.');
		updateObject[names[names.length - 1]] = value;
		for (var i = 2; i < names.length + 1; i++) {
			var object = {};
			object[names[names.length - i]] = updateObject;
			updateObject = object;
		}
		return updateObject;
	}
	
	return {
		addStringProperty : function(name, label, onChange) {
			var $control = $('<input type="text">');
			if (onChange) {
				$control.on('change', function() {
					onChange(createUpdateObject(name, $(this).val()));
				});
			} else {
				$control.attr('readonly', 'readonly');
			}
			properties[name] = {
				name : name,
				label : label,
				control : $control
			};
			return this;
		},
		addTextProperty : function(name, label, onChange) {
			var $control = $('<textarea rows="5"></textarea>');
			$control.css({
				'width' : '100%',
				'resize' : 'none'
			});
			if (onChange) {
				$control.on('keyup', function() {
					onChange(createUpdateObject(name, $(this).val()));
				});
			} else {
				$control.attr('readonly', 'readonly');
			}
			properties[name] = {
				name : name,
				label : label,
				control : $control
			};
			return this;
		},
		addNumberProperty : function(name, label, onChange, min, max, step) {
			var $control = $('<input type="number" min="'
				+ min + '" max="' + max + '" step="' + step + '">');
			if (onChange) {
				$control.on('change', function() {
					onChange(createUpdateObject(name, parseFloat($(this).val())));
				});
			} else {
				$control.attr('readonly', 'readonly');
			}
			properties[name] = {
				name : name,
				label : label,
				control : $control
			};
			return this;
		},
		addColorProperty : function(name, label, onChange) {
			var $control = $('<input type="color">');
			if (onChange) {
				$control.on('change', function() {
					onChange(createUpdateObject(name, $(this).val()));
				});
			} else {
				$control.attr('readonly', 'readonly');
			}
			properties[name] = {
				name : name,
				label : label,
				control : $control
			};
			return this;
		},
	
		setPropertyValue : function(name, model) {
			var names = name.split('.');
			var value = model[names[0]];
			for (var i = 1; i < names.length; i++) {
				value = value[names[i]];
			}
			properties[name].control.val(value);
		},
		setPropertyValues : function(model) {
			for (var key in properties) {
				this.setPropertyValue(key, model)
			}
			return this;
		}
	}
};
