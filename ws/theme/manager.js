var ThemeManager = function($viewContainer, themes) {
	var theme = null;
	var templates = null;
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
	this.setTemplates = function(tpls) {
		templates = tpls;
		$templateContainer.empty();
		for (var i = 0; i < templates.length; i++) {
			var template = templates[i];
			var $templateView =
				$('<div class="pd-ws-theme-manager-template-view">'
					+ template.name + '</div>');
			var bgColor = new RGBColor(template.bg);
			if (bgColor.ok) {
				var color = bgColor.r > 127 || bgColor.g > 127
					|| bgColor.b > 127 ? 'black' : 'white';
				$templateView.css({
					'background-color' : template.bg,
					'color' : color
				}).data('template', template).on('click', function(e) {
					var $templateView = $(e.target);
					if ($selectedTemplateView) {
						$selectedTemplateView.removeClass(
							'pd-ws-theme-manager-template-view-selected');
					}
					$templateView.addClass(
							'pd-ws-theme-manager-template-view-selected');
					$selectedTemplateView = $templateView;
				});
			}
			$templateContainer.append($templateView);
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
