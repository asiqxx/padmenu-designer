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
			height : model.h ? model.h : 'auto',
			fill : model.color,
			text : model.config.text.length
				? model.config.text : ' Type here... ',
			fontSize : model.config.fontSize,
			fontFamily : model.config.fontFamily,
		});
		view.add(text);
		model.w = text.getWidth();
		model.h = text.getHeight();
		this.uber('render', view);
		view.fire('render');
	};
	this.createProperties = function(model, onChange) {
		var properties = this.uber('createProperties', model, onChange);
		var configTextProperty = WsItemFactory.util.property('config.text',
			'Text', model.config.text, onChange);
		configTextProperty.control.css({
			'width' : '100%',
			'height' : '200px'
		});
		return Object.extend(properties, {
			'config.text' : {
				label : 'Text',
				control : $('<textarea rows="5"></textarea>').css({
					'width' : '100%',
					'resize' : 'none'
				}).text(model.config.text).on('keyup', function() {
					var text = $(this).val();
					if (text.length === 0) {
						onChange();
					} else {
						onChange({
							h : 0,
							config : {
								text : text
							}
						});
					}
				})
			}
		});
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
			fill : 'red',
			opacity : 0.2
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
