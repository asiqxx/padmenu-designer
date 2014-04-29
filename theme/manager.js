var ThemeManager = function($viewContainer, themes, wsTemplateController) {
	var self = this;
	var theme = null;
	var templates = [];
	var templateMap = {};
	var $selectedTemplateView = null;
	
	$viewContainer.addClass('pd-theme-manager');
	//~ var $themeChanger = $('<select class="pd-theme-changer"/>');
	//~ for (var i = 0; i < themes.length; i++) {
		//~ var theme = themes[i];
		//~ $themeChanger.append(new Option(theme.name, theme.id));
	//~ }
	//~ $viewContainer.append($themeChanger);
	//~ $viewContainer.append($('<hr/>'));
	$viewContainer.append($('<div>Templates</div>'));
	var $templateContainer = $('<div class="pd-template-container"/>');
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
					owner : theme.id,
					width : theme.width,
					height : theme.height,
					bgColor : 'transparent',
				};
				self.addTemplate(template);
				self.selectTemplate(template);
				wsTemplateController.open(template);
			}
		}, {
			'name' : 'remove',
			'type' : 'class',
			'value' : 'icon-icomoon-remove2',
			'click' : function() {
				var template = self.getSelectedTemplate();
				if (!template) {
					return;
				}
				self.removeTemplate(template);
			}
		}]
	});
	$viewContainer.append($templateToolbar);

    var templateCreateEventListeners = [];
    function fireTemplateCreateEvent(template) {
		for (var i in templateCreateEventListeners) {
			templateCreateEventListeners[i].onTemplateCreate(template);
		}
    };
    var templateRemoveEventListeners = [];
    function fireTemplateRemoveEvent(template) {
		for (var i in templateRemoveEventListeners) {
			templateRemoveEventListeners[i].onTemplateRemove(template);
		}
    };
	var templateSelectEventListeners = [];
    function fireTemplateSelectEvent(selected) {
		for (var i in templateSelectEventListeners) {
			templateSelectEventListeners[i].onTemplateSelect(selected);
		}
    };
    var templateDblClickEventListeners = [];
    function fireTemplateDblClickEvent(template) {
		for (var i in templateDblClickEventListeners) {
			templateDblClickEventListeners[i].onTemplateDblClick(template);
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
    
	$templateContainer.on('click', function() {
		self.selectTemplate();
	}).on('dblclick', function(e) {
		fireTemplateDblClickEvent();
	});
	
	function createTemplateView(template) {
		return $('<div class="pd-template-view"/>')
			.data('template', template).on('click', function(e) {
				var $target = $(e.target);
				var template = $target.data('template');
				if (!template) {
					template = $target.parent().data('template');
				}
				self.selectTemplate(template);
				e.stopPropagation();
				return false;
			}).on('dblclick', function(e) {
				var $target = $(e.target);
				var template = $target.data('template');
				if (!template) {
					template = $target.parent().data('template');
				}
				fireTemplateDblClickEvent(template);
				e.stopPropagation();
				return false;
			}).text(template.name);
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
		if ($selectedTemplateView) {
			$selectedTemplateView.removeClass('pd-template-view-selected');
		}
		if (template) {
			var $templateView = $templateContainer.children().filter(
				function(i, element) {
					return $(element).data('template') === template;
				}
			);
			if ($templateView.length === 0) {
				return;
			}
			$templateView.addClass('pd-template-view-selected');
			$selectedTemplateView = $templateView;
		}
		fireTemplateSelectEvent(template);
	};
	this.getSelectedTemplate = function() {
		return $selectedTemplateView.data('template');
	};
	this.getTemplate = function(name) {
		return templateMap[name];
	};
	this.addTemplate = function(template) {
		if (!template.id) {
			fireTemplateCreateEvent(template);
		}
		var $templateView = createTemplateView(template)
			.appendTo($templateContainer);		
		templates.push(template);
		templateMap[template.name] = template;
		return $templateView;
	};
	this.removeTemplate = function(template) {
		var index = templates.indexOf(template);
		if (index == -1) {
			return;
		}
		templates.splice(index, 1);
		delete templateMap[template.name];
		var $templateView = $templateContainer.children().filter(
			function(i, element) {
				return $(element).data('template') === template;
			});
		$templateView.remove();
		fireTemplateRemoveEvent(template);
	};
	this.setTemplateName = function(template, name) {
		if (typeof templateMap[template.name] === 'undefined'
			|| templateMap[template.name] !== template) {
			return;
		}
		delete templateMap[template.name];
		template.name = name;
		templateMap[template.name] = template;
		if (template === self.getSelectedTemplate()) {
			$selectedTemplateView.text(template.name);
		}
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

	self.addTemplateCreateEventListener = function(listener) {
		templateCreateEventListeners.push(listener);
	};
	self.removeTemplateCreateEventListener = function(listener) {
		var index = templateCreateEventListeners.indexOf(listener);
		if (index == -1) {
			return;
		}
		templateCreateEventListeners.splice(index, 1);
	};
	self.addTemplateRemoveEventListener = function(listener) {
		templateRemoveEventListeners.push(listener);
	};
	self.removeTemplateRemoveEventListener = function(listener) {
		var index = templateRemoveEventListeners.indexOf(listener);
		if (index == -1) {
			return;
		}
		templateRemoveEventListeners.splice(index, 1);
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
	self.addTemplateDblClickEventListener = function(listener) {
		templateDblClickEventListeners.push(listener);
	};
	self.removeTemplateDblClickEventListener = function(listener) {
		var index = templateDblClickEventListeners.indexOf(listener);
		if (index == -1) {
			return;
		}
		templateDblClickEventListeners.splice(index, 1);
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
