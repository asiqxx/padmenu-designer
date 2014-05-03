var TextWsItemFactory = function() {
	this.createView = function(model) {
		Object.extend(model, {
			type : 'text',
			w : 0,
			h : 0,
			config : {
				fontFamily : 'Arial, Helvetica',
				fontSize : 13,
				text : ''
			}
		});
		return this.uber('createView', model);
	};
	this.render = function(view) {
		var model = view.getAttr('model');
		var text = new Kinetic.Text({
			width : model.w ? model.w : 'auto',
			height : 'auto',
			fill : model.color,
			text : model.config.text,
			fontSize : model.config.fontSize,
			fontFamily : model.config.fontFamily,
		});
		if (model.config.text.length === 0) {
			text.setText('Type here...');
			text.setOpacity(0.625);
		}
		view.add(text);
		model.w = text.getWidth();
		model.h = text.getHeight();
		this.uber('render', view);
		view.fire('render');
	};
	this.createProperties = function(onChange) {
		var properties = this.uber('createProperties', onChange);
		properties.h.control.attr('type', 'text');
		properties.h.control.attr('readonly', 'readonly');
		PropertiesBuilder(properties)
			.addStringProperty('config.fontFamily', 'Font', onChange)
			.addNumberProperty('config.fontSize', 'Font Size', onChange,
				1, 100000, 1)
			.addTextProperty('config.text', 'Text', onChange);
		return properties;
	};
	function setSelectionRange($input, selectionStart, selectionEnd) {
		var input = $input.get(0);
		if (input.setSelectionRange) {
			input.focus();
			input.setSelectionRange(selectionStart, selectionEnd);
		} else if (input.createTextRange) {
			var range = input.createTextRange();
			range.collapse(true);
			range.moveEnd('character', selectionEnd);
			range.moveStart('character', selectionStart);
			range.select();
		}
	}
	this.createEditor = function(model, onChange) {
		var $textarea = $('<textarea></textarea>').css({
			'left' : '666666px'
		}).text(model.config.text).on('keyup', function(e) {
			var text = $textarea.val();
			onChange({
				h : 0,
				config : {
					text : text
				}
			});
		}).appendTo($(document.body));
		setSelectionRange($textarea, model.config.text.length, model.config.text.length);
		var editor = new Kinetic.Rect({
			stroke : 'blue',
			strokeWidth : 2,
		});
		editor.on('destroy', function() {
			if ($textarea.val().length === 0) {
				onChange();
			}
			$textarea.remove();
		});
		return editor;
	};
};
TextWsItemFactory.inherits(WsItemFactory);
