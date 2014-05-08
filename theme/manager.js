var ThemeManager = function($container, themes) {
	var self = this;
	var theme = null;
	var templates = [];
	var templateMap = {};
	var $selectedTemplate = null;
	
	$container.addClass('pd-theme-manager');
	$container.append($('<div>Templates</div>'));
	var $templateContainer = $('<div class="pd-template-container"/>');
	$container.append($templateContainer);
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
					items : []
				};
				self.addTemplate(template);
				self.selectTemplate(template);
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
	$container.append($templateToolbar);

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
    function fireThemeChangeEvent(onLoad) {
		for (var i in themeChangeEventListeners) {
			themeChangeEventListeners[i].onThemeChange(theme, onLoad);
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
		return $('<div class="pd-template"/>')
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
			}).pdDraggable({
				dragObject : function() {
					return $('<div/>').pdWsItem({
						model : {
							type : 'template',
							config : {
								template : template.name
							}
						}
					});
				}
			}).text(template.name);
	}
	
	this.setTheme = function(id, onLoad) {
		var newTheme = Object.findById(themes, id);
		if (!newTheme) {
			throwException('pd.app: Failed to set theme.'
				+ 'Cause:\nTheme with id "' + id + '" not found');
		}
		theme = newTheme;
		fireThemeChangeEvent(onLoad);
	};
	this.getTheme = function() {
		return theme;
	};
	
	this.selectTemplate = function(template) {
		if ($selectedTemplate) {
			$selectedTemplate.removeClass('pd-template-selected');
			$selectedTemplate = null;
		}
		if (template) {
			var $template = $templateContainer.children().filter(
				function(i, element) {
					return $(element).data('template') === template;
				}
			);
			if ($template.length === 0) {
				return;
			}
			$template.addClass('pd-template-selected');
			$selectedTemplate = $template;
		}
		fireTemplateSelectEvent(template);
	};
	this.getSelectedTemplate = function() {
		return $selectedTemplate.data('template');
	};
	this.getTemplate = function(name) {
		return templateMap[name];
	};
	this.addTemplate = function(template) {
		var $template = createTemplateView(template)
			.appendTo($templateContainer);		
		templates.push(template);
		templateMap[template.name] = template;
		if (!template.id) {
			fireTemplateCreateEvent(template);
		}
		return $template;
	};
	this.removeTemplate = function(template) {
		var index = templates.indexOf(template);
		if (index == -1) {
			return;
		}
		templates.splice(index, 1);
		delete templateMap[template.name];
		var $template = $templateContainer.children().filter(
			function(i, element) {
				return $(element).data('template') === template;
			});
		$template.remove();
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
			$selectedTemplate.text(template.name);
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
