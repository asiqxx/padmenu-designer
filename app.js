jQuery(document).ready(function($) {
	app = (function(){
		var wsModel = null;
		var wsController = null;
		var wsTemplateController = null;
		var themeManager = null;
		var navigationManager = null;
		var propertyBrowser = null;
		
		function loadThemes(onLoad) {
			console.info('pd.app: Loading themes...');
			dpd.theme.get(function(themes, error) {
				if (error) {
					throwException('pd.app: Failed to load themes. Cause:\n'
						+ error.message);
				}
				themeManager = new ThemeManager($('#theme'), themes);
				console.info('pd.app: Themes loaded.');
				onLoad();
			});
		}
		
		function loadMenu(onLoad) {
			var menuId = window.location.hash.substr(1,
				window.location.hash.length - 1);
			if (!menuId) {
				throwException('pd.app: Failed to load menu. Cause:\n'
					+ 'The id of menu must be provided as a hash part of URL');
			}
			console.info('pd.app: Trying to restore previous session...');
			wsModel.restore(0);
			var menu = wsModel.get();
			if (menu && menu.id == menuId) {
				console.info('pd.app: Previous session restored.');
				loadThemes(onLoad);
			} else {
				console.info('pd.app: Previous session not found.');
				console.info('pd.app: Loading menu...');
				dpd.menu.get(menuId, function(menu, error) {
					if (error) {
						throwException('pd.app: Failed to load menu. '
							+ 'Cause:\n' + error.message);
					}
					wsModel.store(menu);
					console.info('pd.app: Menu loaded.');
					loadThemes(onLoad);
				});
			}
		}
		
		(function load() {
			wsModel = new WsModel();
			loadMenu(function() {
				navigationManager = new NavigationManager($('#navigation'));
				propertyBrowser = new PropertyBrowser($('#properties'));
				
				// Init WsModel.
				var menuStoreEventTimerId = 0;
				var wsModelEventListener = {
					onStore : function(menu) {
						clearTimeout(menuStoreEventTimerId);
						menuStoreEventTimerId = setTimeout(function() {
							console.info('pd.app: Save menu...');
							dpd.menu.put(menu, function(menu, error) {
								if (error) {
									console.error('pd.app: Failed to '
										+ 'save menu. Cause:\n'
										+ error.message);
								} else {
									console.info('pd.app: Model saved.');
								}
							});
						}, 3000);
					}
				};
				wsModel.addStoreEventListener(wsModelEventListener);
				
				// Init WsTemplateController.
				var wsTemplateControllerProperties = {};
				function setWsTemplateControllerPropertyValues(template) {
					PropertiesBuilder(wsTemplateControllerProperties)
						.setPropertyValues({
							name : template.name,
							width : template.width,
							height : template.height,
							bgColor : template.bgColor,
						});
				}
				var themeManagerEventListener = {
					onTemplateCreate : function(template) {
						wsTemplateController.open(template);
					},
					onTemplateRemove : function(template) {
						console.info('pd.app: Remove template...');
						wsTemplateController.close(withoutSave = true);
						if (template.id) {
							dpd.template.del(template.id, function(tpl, error) {
								if (error) {
									console.error('pd.app: Failed to '
										+ 'remove template. Cause:\n'
										+ error.message);
								} else {
									console.info('pd.app: Template removed.');
								}
							});
						} else {
							console.info('pd.app: Template removed.');
						}
					},
					onTemplateSelect : function(template) {
						if (wsTemplateController.isFocused()) {
							if (template) {
								if (template
									!== wsTemplateController.getModel()) {
									wsTemplateController.open(template);
									setWsTemplateControllerPropertyValues(template);
								}
							} else {
								wsTemplateController.close();
							}
						}
					},
					onTemplateDblClick : function(template) {
						if (template
							&& template !== wsTemplateController.getModel()) {
							wsTemplateController.open(template);
							setWsTemplateControllerPropertyValues(template);
						}
					},
					onThemeChange : function(theme) {
						console.info('pd.app: Loading theme templates...');
						dpd.template.get({
							'owner' : theme.id
						}, function(templates, error) {
							if (error) {
								throwException('pd.app: Failed to load theme '
									+ 'templates. Cause:\n' + error.message);
							}		
							themeManager.setTemplates(templates);
							console.info('pd.app: Theme templates loaded.');
						});
					}
				};
				themeManager.addTemplateCreateEventListener(
					themeManagerEventListener);
				themeManager.addTemplateRemoveEventListener(
					themeManagerEventListener);
				themeManager.addTemplateSelectEventListener(
					themeManagerEventListener);
				themeManager.addTemplateDblClickEventListener(
					themeManagerEventListener);
				themeManager.addThemeChangeEventListener(
					themeManagerEventListener);
				themeManager.setTheme(wsModel.get().theme);
				
				function saveTheme() {
					console.info('pd.app: Save theme...');
					dpd.theme.put(themeManager.getTheme(), function(theme, error) {
						if (error) {
							console.error('pd.app: Failed to '
								+ 'save theme. Cause:\n'
								+ error.message);
						} else {
							console.info('pd.app: Theme saved.');
						}
					});
				}
				
				// Init WsController.
				wsController = new WsController($('#ws'), wsModel,
					themeManager.getTheme());
				wsController.addPagesChangeEventListener(navigationManager);
				
				var currentPropertyBrowserItem = null;
				
				function onWsControllerPropertyChange(update) {
					if (update.bgColor) {
						themeManager.getTheme().bgColor = update.bgColor;
						wsController.setBgColor(update.bgColor);
						saveTheme();
					}
				}
				var wsControllerProperties = {};
				PropertiesBuilder(wsControllerProperties)
					.addStringProperty('themeName', 'Theme')
					.addStringProperty('themeDescription', 'Description')
					.addNumberProperty('width', 'Width')
					.addNumberProperty('height', 'Height')
					.addColorProperty('bgColor', 'Bg Color',
						onWsControllerPropertyChange)
					.setPropertyValues({
						themeName : themeManager.getTheme().name,
						themeDescription : themeManager.getTheme().description,
						width : themeManager.getTheme().width,
						height : themeManager.getTheme().height,
						bgColor : themeManager.getTheme().bgColor,
					});
				
				var wsControllerEventListener = {
					onSelect : function(selectedItem) {
						var properties = null;
						if (selectedItem) {
							var wsItemFactory = WsItemFactory
								.forType(selectedItem.type);
							if (currentPropertyBrowserItem === selectedItem) {
								properties = propertyBrowser.get();
							} else {
								properties = wsItemFactory.createProperties(
									wsController.updateSelectedItem);
								delete properties.x;
								delete properties.y;
								delete properties.zIndex;
							}
							PropertiesBuilder(properties)
								.setPropertyValues(selectedItem);
						} else {
							properties = wsControllerProperties;
						}
						propertyBrowser.set(properties);
						currentPropertyBrowserItem = selectedItem;
					}
				};
				wsController.addSelectEventListener(wsControllerEventListener);
				
				// Init WsTemplateController.
				wsTemplateController = new WsTemplateController(
					$('#ws-template'));
				function onWsTemplateControllerPropertyChange(update) {
					if (update.name) {
						themeManager.setTemplateName(
							wsTemplateController.getModel(), update.name);
					} else if (update.width) {
						wsTemplateController.getModel().width = update.width;
						wsTemplateController.setPageSize({
							width : update.width,
							height : wsTemplateController.getPageView()
								.getHeight()
						});
						wsTemplateController.updateViewGeometry();
					} else if (update.height) {
						wsTemplateController.getModel().height = update.height;
						wsTemplateController.setPageSize({
							width : wsTemplateController.getPageView()
								.getWidth(),
							height : update.height
						});
						wsTemplateController.updateViewGeometry();
					} else if (update.bgColor) {
						wsTemplateController.getModel().bgColor =
							update.bgColor;
						wsTemplateController.setBgColor(update.bgColor);
					}
				}
				PropertiesBuilder(wsTemplateControllerProperties)
					.addStringProperty('name', 'Name',
						onWsTemplateControllerPropertyChange)
					.addNumberProperty('width', 'Width',
						onWsTemplateControllerPropertyChange)
					.addNumberProperty('height', 'Height',
						onWsTemplateControllerPropertyChange)
					.addColorProperty('bgColor', 'Bg Color',
						onWsTemplateControllerPropertyChange);
				var wsTemplateControllerEventListener = {
					onChange : function(template) {
						console.info('pd.app: Save template...');
						if (template.id) {
							dpd.template.put(template, function(tpl, error) {
								if (error) {
									console.error('pd.app: Failed to '
										+ 'save template. Cause:\n'
										+ error.message);
								} else {
									template.id = tpl.id;
									console.info('pd.app: Template saved.');
								}
							});
						} else {
							dpd.template.post(template, function(tpl, error) {
								if (error) {
									console.error('pd.app: Failed to '
										+ 'save template. Cause:\n'
										+ error.message);
								} else {
									template.id = tpl.id;
									console.info('pd.app: Template saved.');
								}
							});
						}
						wsController.updateItems(wsModel.find({
							type : 'template',
							config : {
								template : template.name
							}
						}), {});
					},
					onSelect : function(selectedItem) {
						var properties = null;
						if (selectedItem) {
							var wsItemFactory = WsItemFactory
								.forType(selectedItem.type);
							if (currentPropertyBrowserItem === selectedItem) {
								properties = propertyBrowser.get();
							} else {
								properties = wsItemFactory.createProperties(
									wsTemplateController.updateSelectedItem);
								delete properties.p;
								delete properties.i;
							}
							PropertiesBuilder(properties)
								.setPropertyValues(selectedItem);
						} else {
							properties = wsTemplateControllerProperties;
						}
						propertyBrowser.set(properties);
						currentPropertyBrowserItem = selectedItem;
					}
				};
				wsTemplateController.addChangeEventListener(
					wsTemplateControllerEventListener);
				wsTemplateController.addSelectEventListener(
					wsTemplateControllerEventListener);
					
				// Init NavigationManager.
				navigationManager.addPageSelectEventListener(wsController);
				navigationManager.setPage(0);
				
				var $window = $(window);
				$window.on('message-opentemplate', function(e) {
					var template = themeManager.getTemplate(e.template);
					wsTemplateController.open(template);
					setWsTemplateControllerPropertyValues(template);
				});
				$window.on('message-gettemplate', function(e) {
					e.template = themeManager.getTemplate(e.template);
				});
				
				$('#panel-west').pdAccordion();
				var $toolbar = $('#panel-east').pdAccordion({
					mode : 'multi',
					collapsible : true
				});
				
				$('#ws-items').pdToolbar({
					source : [{
						'name' : 'text',
						'type' : 'class',
						'value' : 'icon-icomoon-language',
						'draggable' : {
							dragObject : function() {
								return $('<div/>').pdWsItem({
									model : {
										type : 'text'
									}
								});
							}
						}
					}, {
						'name' : 'image',
						'type' : 'class',
						'value' : 'icon-icomoon-image2',
						'draggable' : {
							dragObject : function() {
								return $('<div/>').pdWsItem({
									model : {
										type : 'image'
									}
								});
							}
						}
					}, {
						'type' : 'separator'
					}, {
						'name' : 'ls',
						'type' : 'text',
						'value' : 'LS',
						'draggable' : {
							dragObject : function() {
								return $('<div/>').pdWsItem({
									model : {
										type : 'ls'
									}
								});
							}
						}
					}, {
						'name' : 'ps',
						'type' : 'text',
						'value' : 'PS',
						'draggable' : {
							dragObject : function() {
								return $('<div/>').pdWsItem({
									model : {
										type : 'ps'
									}
								});
							}
						}
					}]
				});
				
				wsController.focus();
				wsController.setScale(0.8)
				propertyBrowser.set(wsControllerProperties);
				
				$(document.body).css({
					'visibility' : 'visible'
				});
			});
		})();
		
		return {
			getWsModel : function() {
				return wsModel;
			},
			getWsController : function() {
				return wsController;
			},
			getThemeManager : function() {
				return themeManager;
			},
			getNavigationManager : function() {
				return navigationManager;
			},
		};
	})();
});
