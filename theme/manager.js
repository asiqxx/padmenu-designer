var ThemeManager = function($viewContainer, themes, wsTemplateController) {
	var self = this;
	var theme = null;
	var templates = [];
	var templateMap = [];
	var $selectedTemplateView = null;
	
	$viewContainer.addClass('pd-theme-manager');
	var $themeChanger = $('<select class="pd-theme-changer"/>');
	for (var i = 0; i < themes.length; i++) {
		var theme = themes[i];
		$themeChanger.append(new Option(theme.name, theme.id));
	}
	$viewContainer.append($themeChanger);
	$viewContainer.append($('<hr/>'));
	$viewContainer.append($('<div>Templates</div>'));
	var $templateContainer =
		$('<div class="pd-template-container"/>').on('click',
		function() {
			self.selectTemplate();
		});
	$viewContainer.append($templateContainer);
	$viewContainer.append($('<hr/>'));
	var $templateToolbar = $('<div/>').pdToolbar({
		source : [{
			'name' : 'add',
			'type' : 'class',
			'value' : 'icon-icomoon-plus3',
			'click' : function() {
				var templateName = 'A';
				var templateNameCharCode = 65;
				while(self.getTemplate(templateName)) {
					templateName = String.fromCharCode(++templateNameCharCode);
				}
				var template = {
					name : templateName,
					width : theme.width,
					height : theme.height,
					bgColor : 'transparent',
				};
				self.addTemplate(template);
				self.selectTemplate(template.name);
				wsTemplateController.open(template);
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

	var templateSelectEventListeners = [];
    function fireTemplateSelectEvent(selected) {
		for (var i in templateSelectEventListeners) {
			templateSelectEventListeners[i].onTemplateSelect(selected);
		}
    };
	var themeChangeEventListeners = [];
    function fireThemeChangeEvent() {
		for (var i in themeChangeEventListeners) {
			themeChangeEventListeners[i].onThemeChange(theme);
		}
    }
    var changeEventListeners = [];
    function fireChangeEvent() {
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
	
	this.selectTemplate = function(name) {
		if ($selectedTemplateView) {
			$selectedTemplateView.removeClass(
				'pd-template-view-selected');
		}
		var template = templateMap[name];
		if (template) {
			var $templateView = $templateContainer.children().filter(
				function(i, element) {
					return $(element).data('template').name === name;
				});
			if ($templateView.length === 0) {
				return;
			}
			$templateView.addClass(
					'pd-template-view-selected');
			$selectedTemplateView = $templateView;
		}
		fireTemplateSelectEvent(template);
	};
	this.getTemplate = function(name) {
		return templateMap[name];
	};
	this.addTemplate = function(template) {
		var $templateView = $('<div class="pd-template-view"/>')
			.data('template', template).on('click', function(e) {
				var $target = $(e.target);
				var template = $target.data('template');
				if (!template) {
					template = $target.parent().data('template');
				}
				self.selectTemplate(template.name);
				return false;
			}).text(template.name).appendTo($templateContainer);		
		templates.push(template);
		templateMap[template.name] = template;
		return $templateView;
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
	
	self.addTemplateSelectEventListener = function(listener) {
		templateSelectEventListeners.push(listener);
	};
	self.removeTemplateSelectEventListener = function(listener) {
		var index = templateSelectEventListeners.indexOf(listener);
		if (index == -1) {
			return;
		}
		templateSelectEventListeners.splice(index, 1);
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
