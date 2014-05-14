var Logger = function(duration) {
	var self = this;
	if (typeof duration === 'undefined') {
		duration = 'normal';
	}
	var $container = $('#notification');
	if ($container.length === 0) {
		$container = $('<div id="notification" class="notification"/>')
			.appendTo($(document.body));
	}
	var classes = 'notification-info notification-warn notification-error';
	function notify(level, message) {
		var $view = $('<div class="notification-' + level + '">'
			+ message + '</div>').appendTo($container);
		//var $emoticon = $('<span class="icon-icomoon-smiley2"/>');
		//if (level === 'info') {
			//$emoticon = $('<span class="icon-icomoon-smiley2"/>');
		//} else if (level === 'warn') {
			//$emoticon = $('<span class="icon-icomoon-confused2"/>');
		//} else if (level === 'error') {
			//$emoticon = $('<span class="icon-icomoon-evil2"/>');
		//}
		//$view.prepend('&nbsp;&nbsp;&nbsp;&nbsp;');
		//$view.prepend($emoticon);
		$view.slideDown(duration);
		setTimeout(function() {
			$view.slideUp(duration, function() {
				$(this).remove();
			});
		}, 3000);
	}
	return {
		info : function(message) {
			notify('info', message);
			console.info(message);
		},
		warn : function(message) {
			notify('warn', message);
			console.warn(message);
		},
		error : function(message) {
			notify('error', message);
			console.error(message);
		},
		fatal : function(message) {
			notify('error', message);
			console.error(message);
			throw message;
		}
	};
};
jQuery(document).ready(function($) {
	app = (function(){
		var wsModel = null;
		var wsController = null;
		var wsTemplateController = null;
		var themeManager = null;
		var navigationManager = null;
		var propertyBrowser = null;
		var sessionManager = null;
		var priceService = null;
		
		function loadPrice(onLoad) {
			Logger(0).info('Loading price...');
			dpd.pricetree.get({
				'cafe' : wsModel.get().cafe,
				'object' : '1'
			},
			function(pricetree, error) {
				if (error) {
					Logger(0).fatal('Failed to load price. '
						+ 'Cause:\n' + error.message);
				}
				if (!pricetree[0].object) {
					Logger(0).fatal('Failed to load price. Cause:\n'
						+ 'Price is empty');
				}

				priceService = new PriceService($('#price'),
					pricetree[0].object);
				Logger(0).info('Price loaded.');
				onLoad();
			});
		}
		
		function loadThemes(onLoad) {
			Logger(0).info('Loading themes...');
			dpd.theme.get(function(themes, error) {
				if (error) {
					Logger(0).fatal('Failed to load themes. Cause:\n'
						+ error.message);
				}
				themeManager = new ThemeManager($('#theme'), themes);
				Logger(0).info('Themes loaded.');
				loadPrice(onLoad);
			});
		}
		
		function loadMenu(onLoad) {
			var menuId = window.location.hash.substr(1,
				window.location.hash.length - 1);
			if (!menuId) {
				Logger(0).fatal('Failed to load menu. Cause:\n'
					+ 'The id of menu must be provided as a hash part of URL');
			}
			Logger(0).info('Trying to restore previous session...');
			var menu = sessionManager.restore(0);
			if (menu && menu.id === menuId) {
				wsModel = new WsModel(menu);
				Logger(0).info('Previous session restored.');
				loadThemes(onLoad);
			} else {
				Logger(0).warn('Previous session not found.');
				Logger(0).info('Loading menu...');
				dpd.menu.get(menuId, function(menu, error) {
					if (error) {
						Logger(0).fatal('Failed to load menu. '
							+ 'Cause:\n' + error.message);
					}
					wsModel = new WsModel(menu);
					Logger(0).info('Menu loaded.');
					loadThemes(onLoad);
				});
			}
		}
		
		(function load() {
			var $notificationLoading = $('<div id="notification" class="notification notification-loading"/>')
				.appendTo($(document.body));
			sessionManager = new SessionManager();
			loadMenu(function() {
				navigationManager = new NavigationManager($('#navigation'));
				propertyBrowser = new PropertyBrowser($('#properties'));
				
				// Init ThemeManagerEventListener.
				// TODO add timeout
				function saveTheme() {
					Logger().info('Save theme...');
					dpd.theme.put(themeManager.getTheme(), function(theme, error) {
						if (error) {
							Logger().error('Failed to '
								+ 'save theme. Cause:\n'
								+ error.message);
						} else {
							Logger().info('Theme saved.');
						}
					});
				}
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
						wsTemplateController.focus();
						setWsTemplateControllerPropertyValues(template);
					},
					onTemplateRemove : function(template) {
						Logger().info('Remove template...');
						wsTemplateController.close(withoutSave = true);
						wsTemplateController.blur(true);
						if (template.id) {
							dpd.template.del(template.id, function(tpl, error) {
								if (error) {
									Logger().error('Failed to '
										+ 'remove template. Cause:\n'
										+ error.message);
								} else {
									Logger().info('Template removed.');
								}
							});
						} else {
							Logger().info('Template removed.');
						}
					},
					onTemplateSelect : function(template) {
						if (wsTemplateController.isFocused()) {
							if (template) {
								if (template
									!== wsTemplateController.getModel()) {
									wsTemplateController.open(template);
									wsTemplateController.focus();
									setWsTemplateControllerPropertyValues(template);
								}
							} else {
								wsTemplateController.close();
								wsTemplateController.blur(true);
							}
						} else {
							var selectedItem = wsController.getSelectedItem();
							if (template && selectedItem && selectedItem.type === 'template'
								&& selectedItem.config.template !== template.name) {
								wsController.updateSelectedItem({
									config : {
										template : template.name
									}
								});
							}
						}
					},
					onTemplateDblClick : function(template) {
						if (!wsTemplateController.isFocused() && template) {
							wsTemplateController.open(template);
							wsTemplateController.focus();
							setWsTemplateControllerPropertyValues(template);
						}
					},
					onThemeChange : function(theme, onLoad) {
						Logger(0).info('Loading theme templates...');
						dpd.template.get({
							'owner' : theme.id
						}, function(templates, error) {
							if (error) {
								Logger(0).fatal('Failed to load theme '
									+ 'templates. Cause:\n' + error.message);
							}		
							themeManager.setTemplates(templates);
							onLoad();
							Logger(0).info('Theme templates loaded.');
							Logger(0).info('');
							setTimeout(function() {
								$notificationLoading.remove();
							}, 1000);
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
				themeManager.setTheme(wsModel.get().theme, function() {
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
						} else if (update.bgImage) {
							themeManager.getTheme().bgImage = update.bgImage;
							wsController.setBgImage(update.bgImage);
							saveTheme();
						} else if (update.opacity) {
							themeManager.getTheme().opacity = update.opacity;
							wsController.setOpacity(update.opacity);
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
						.addStringProperty('bgImage', 'Bg Image',
							onWsControllerPropertyChange)
						.addStringProperty('opacity', 'Opacity',
							onWsControllerPropertyChange)
						.setPropertyValues({
							themeName : themeManager.getTheme().name,
							themeDescription : themeManager.getTheme().description,
							width : themeManager.getTheme().width,
							height : themeManager.getTheme().height,
							bgColor : themeManager.getTheme().bgColor,
							bgImage : themeManager.getTheme().bgImage,
							opacity : themeManager.getTheme().opacity,
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
							if (selectedItem && selectedItem.type === 'template') {
								var template = themeManager.getTemplate(
									selectedItem.config.template);
								if (template) {
									themeManager.selectTemplate(template);
								}
							} else {
								themeManager.selectTemplate();
							}
						}
					};
					wsController.addSelectEventListener(
						wsControllerEventListener);
					
					// Init NavigationManager.
					navigationManager.addPageSelectEventListener(wsController);
					
					wsController.focus();
					propertyBrowser.set(wsControllerProperties);
					wsController.setScale(
						wsModel.getWidth() > wsModel.getHeight()
							? wsController.getView().getWidth() / (wsModel.getWidth() + 20)
							: wsController.getView().getHeight() / (wsModel.getHeight() + 20));
					
					var menuStoreEventTimerId = 0;
					var $window = $(window);
					$window.on('message', function(e) {
						//console.log('message', e);
						if (e.id === 'store') {
							sessionManager.store(e.ns, e.state);
							if (e.ns === 'wscontroller') {
								// Init WsModel.
								clearTimeout(menuStoreEventTimerId);
								menuStoreEventTimerId = setTimeout(function() {
									Logger().info('Save menu...');
									dpd.menu.put(e.state, function(menu, error) {
										if (error) {
											Logger().error('Failed to '
												+ 'save menu. Cause:\n'
												+ error.message);
										} else {
											Logger().info('Menu saved.');
										}
									});
								}, 2000);
							}
							return;
						}
						if (e.id === 'restore') {
							e.state = sessionManager.restore(e.ns, e.index);
							return;
						}
						if (e.id === 'opentemplate') {
							var template = themeManager.getTemplate(e.template);
							wsTemplateController.open(template);
							wsTemplateController.focus();
							setWsTemplateControllerPropertyValues(template);
							return;
						}
						if (e.id === 'gettemplate') {
							e.template = themeManager.getTemplate(e.template);
							return;
						}
						if (e.id === 'getprice') {
							e.price = priceService.get(e.price);
							return;
						}
					});
					
					navigationManager.setPage(0);
				});
				
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
					createDetailsTimerId : 0,
					onChange : function(template) {
						Logger().info('Save template...');
						if (template.id) {
							dpd.template.put(template, function(tpl, error) {
								if (error) {
									Logger().error('Failed to '
										+ 'save template. Cause:\n'
										+ error.message);
								} else {
									template.id = tpl.id;
									Logger().info('Template saved.');
								}
							});
						} else {
							dpd.template.post(template, function(tpl, error) {
								if (error) {
									Logger().error('Failed to '
										+ 'save template. Cause:\n'
										+ error.message);
								} else {
									template.id = tpl.id;
									Logger().info('Template saved.');
								}
							});
						}
						if (template.name === 'detail') {
							Logger(0).info('Saving details...');
							wsTemplateControllerEventListener.createDetailsTimerId = setTimeout(function() {
								var detailTemplate = themeManager.getTemplate('detail');
								var price = priceService.get();
								var menu = wsModel.get();
								menu.details = {};
								function createDetails(destination, source) {
									for (var key in source) {
										if (typeof source[key] === 'object') {
											if (typeof source[key].media === 'undefined') {
												createDetails(destination, source[key]);
											} else {
												var model = {
													config : {
														template : 'detail',
														price : key
													}
												};
												var wsItemFactory = WsItemFactory.forType('template');
												var view = wsItemFactory.createView(model);
												wsItemFactory.render(view);
												destination[key] = model;
											}
										}
									}
								}
								createDetails(menu.details, price);
								Logger(0).info('Details saved.');
							}, 1000);
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
				
				$('#panel-west').pdAccordion({
					mode : 'multi'
				});
				$('#ws-toolbar').pdToolbar({
					source : [{
						'name' : 'zoomin',
						'type' : 'text',
						'value' : '+',
						'click' : function() {
							if (wsController.isFocused()) {
								wsController.setScale(wsController.getScale() + 0.1);
							} else if (wsTemplateController.isFocused()) {
								wsTemplateController.setScale(wsTemplateController.getScale() + 0.1);
							}
						}
					}, {
						'name' : 'zoomout',
						'type' : 'text',
						'value' : '-',
						'click' : function() {
							if (wsController.isFocused()) {
								if (wsController.getScale() > 0.2) {
									wsController.setScale(wsController.getScale() - 0.1);
								}
							} else if (wsTemplateController.isFocused()) {
								if (wsTemplateController.getScale() > 0.2) {
									wsTemplateController.setScale(wsTemplateController.getScale() - 0.1);
								}
							}
						}
					}, {
						'name' : 'zoom1',
						'type' : 'text',
						'value' : '1',
						'click' : function() {
							if (wsController.isFocused()) {
								wsController.setScale(1);
							} else if (wsTemplateController.isFocused()) {
								wsTemplateController.setScale(1);
							}
						}
					}, {
						'name' : 'zoomauto',
						'type' : 'text',
						'value' : '| - |',
						'click' : function() {
							if (wsController.isFocused()) {
								wsController.setScale(
									wsModel.getWidth() > wsModel.getHeight()
										? wsController.getView().getWidth() / (wsModel.getWidth() + 20)
										: wsController.getView().getHeight() / (wsModel.getHeight() + 20));
							} else if (wsTemplateController.isFocused()) {
								wsTemplateController.setScale(
									wsTemplateController.getModel().width > wsTemplateController.getModel().height
										? wsTemplateController.getView().getWidth() / (wsTemplateController.getModel().width + 20)
										: wsTemplateController.getView().getHeight() / (wsTemplateController.getModel().height + 20));
							}
						}
					}]
				});
				
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
						'name' : 'video',
						'type' : 'class',
						'value' : 'icon-icomoon-video',
						'draggable' : {
							dragObject : function() {
								return $('<div/>').pdWsItem({
									model : {
										type : 'video'
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
			getPriceService : function() {
				return priceService;
			},
		};
	})();
});
