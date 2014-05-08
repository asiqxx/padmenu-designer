var TextWsItemFactory = function() {
	this.createView = function(model) {
		Object.extend(model, {
			type : 'text',
			w : 0,
			h : 0,
			config : {
				fontFamily : 'Arial',
				fontSize : 13,
				fontStyle : 'normal',
				fontVariant : 'normal',
				align : 'left',
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
			fontFamily : model.config.fontFamily,
			fontSize : model.config.fontSize,
			fontStyle : model.config.fontStyle,
			fontVariant : model.config.fontVariant,
			align : model.config.align,
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
			.addStringsProperty('config.fontFamily', 'Font', onChange, {
				'Georgia' : 'Georgia, serif',
				'Palatino Linotype' : '"Palatino Linotype", "Book Antiqua", Palatino, serif',
				'Times New Roman' : '"Times New Roman", Times, serif',
				'Arial' : 'Arial, Helvetica, sans-serif',
				'Arial Black' : '"Arial Black", Gadget, sans-serif',
				'Comic Sans MS' : '"Comic Sans MS", cursive, sans-serif',
				'Impact' : 'Impact, Charcoal, sans-serif',
				'Lucida Sans Unicode' : '"Lucida Sans Unicode", "Lucida Grande", sans-serif',
				'Tahoma' : 'Tahoma, Geneva, sans-serif',
				'Trebuchet MS' : '"Trebuchet MS", Helvetica, sans-serif',
				'Verdana' : 'Verdana, Geneva, sans-serif',
				'Courier New' : '"Courier New", Courier, monospace',
				'Lucida Console' : '"Lucida Console", Monaco, monospace',
			})
			.addNumberProperty('config.fontSize', 'Font Size', onChange,
				1, 96, 1)
			.addStringsProperty('config.fontStyle', 'Font Style', onChange, {
				'normal' : 'normal',
				'bold' : 'bold',
				'italic' : 'italic'
			})
			.addStringsProperty('config.fontVariant', 'Font Variant', onChange, {
				'normal' : 'normal',
				'small-caps' : 'small-caps'
			})
			.addStringsProperty('config.align', 'Align', onChange, {
				'left' : 'normal',
				'center' : 'center',
				'right' : 'right'
			})
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
