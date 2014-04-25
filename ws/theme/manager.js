var ThemeManager = function($viewContainer, themes) {
	var self = this;
	var theme = null;
	var templates = [];
	var templateMap = [];
	var $selectedTemplateView = null;
	
	$viewContainer.addClass('pd-ws-theme-manager');
	var $themeChanger = $('<select class="pd-ws-theme-manager-changer"/>');
	for (var i = 0; i < themes.length; i++) {
		var theme = themes[i];
		$themeChanger.append(new Option(theme.name, theme.id));
	}
	$viewContainer.append($themeChanger);
	$viewContainer.append($('<hr/>'));
	$viewContainer.append($('<div>Templates</div>'));
	var $templateContainer =
		$('<div class="pd-ws-theme-manager-template-container"/>');
	$viewContainer.append($templateContainer);
	$viewContainer.append($('<hr/>'));
	var $templateToolbar = $('<div/>').pdToolbar({
		source : [{
			'name' : 'add',
			'type' : 'class',
			'value' : 'icon-icomoon-plus3',
			'click' : function() {
				var template = {
					name : 'template',
					width : theme.width,
					height : theme.height,
					bg : 'transparent',
				};
				self.addTemplate(template).triggerHandler('click');
				
			}
		}, {
			'name' : 'remove',
			'type' : 'class',
			'value' : 'icon-icomoon-remove2',
			'click' : function() {
			}
		}]
	});
	$viewContainer.append($templateToolbar);

	var themeChangeEventListeners = [];
    function fireThemeChangeEvent() {
		for (var i in themeChangeEventListeners) {
			themeChangeEventListeners[i]
				.onThemeChange(theme);
		}
    }
    var changeEventListeners = [];
    function fireChangeEvent(range) {
		for (var i in changeEventListeners) {
			changeEventListeners[i].onChange(theme, templates);
		}
    }
	
	this.setTheme = function(id) {
		var newTheme = Object.findById(themes, id);
		if (!newTheme) {
			throwException('pd.app: Failed to set theme.'
				+ 'Cause:\nTheme with id "' + id + '" not found');
		}
		theme = newTheme;
		fireThemeChangeEvent();
	};
	this.getTheme = function() {
		return theme;
	};
	this.selectTemplate = function(template) {
		var $templateView = $templateContainer.children().filter(function(i, element) {
			return $(element).data('template') === template;
		});
		if ($selectedTemplateView) {
			$selectedTemplateView.removeClass(
				'pd-ws-theme-manager-template-view-selected');
			$selectedTemplateView.css({
				'border-color' : ''
			});
		}
		$templateView.addClass(
				'pd-ws-theme-manager-template-view-selected');
		$templateView.css({
			'border-color' : $templateView.css('background-color')
		});
		$selectedTemplateView = $templateView;
	};
	this.addTemplate = function(template) {
		var $templateView =
			$('<div class="pd-ws-theme-manager-template-view">'
				+ template.name + '</div>')
			.data('template', template).on('click', function(e) {
				self.selectTemplate($(e.target).data('template'));
			});
		var bgColor = new RGBColor(template.bg);
		if (bgColor.ok) {
			var color = bgColor.r > 127 || bgColor.g > 127
				|| bgColor.b > 127 ? '#000' : '#F5F5DC';
			$templateView.css({
				'background-color' : template.bg,
				'color' : color
			});
		}
		$templateContainer.append($templateView);
		templates.push(template);
		templateMap[template.name] = template;
		return $templateView;
	};
	this.getTemplate = function(name) {
		return templateMap[name];
	};
	this.setTemplates = function(templates) {
		$templateContainer.empty();
		for (var i = 0; i < templates.length; i++) {
			this.addTemplate(templates[i]);
		}
		fireChangeEvent();
	};
	this.getTemplates = function() {
		return templates;
	};
	
	this.addThemeChangeEventListener = function(listener) {
		themeChangeEventListeners.push(listener);
	};
	this.removeThemeChangeEventListener = function(listener) {
		var index = themeChangeEventListeners.indexOf(listener);
		if (index == -1) {
			return;
		}
		themeChangeEventListeners.splice(index, 1);
	};
	this.addChangeEventListener = function(listener) {
		changeEventListeners.push(listener);
	};
	this.removeChangeEventListener = function(listener) {
		var index = changeEventListeners.indexOf(listener);
		if (index == -1) {
			return;
		}
		changeEventListeners.splice(index, 1);
	};
};
