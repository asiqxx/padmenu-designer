jQuery(document).ready(function($) {
	app = (function(){
		var wsModel = null;
		var wsController = null;
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
				themeManager = new ThemeManager($('#ws-theme'), themes);
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
				var menuStoreEventTimerId = 0;
				var wsModelEventListener = {
					onStore : function(menu) {
						console.info('pd.app: Save menu...');
						clearTimeout(menuStoreEventTimerId);
						menuStoreEventTimerId = setTimeout(
							function() {
								var menu = wsModel.get();
								dpd.menu.put(menu.id, menu,
									function(menu, error) {
										if (error) {
											console.error('pd.app: Failed to '
												+ 'save menu. Cause:\n'
												+ error.message);
										} else {
											console.info('pd.app: '
												+ 'Model saved.');
										}
									}
								);
							},
							1000
						);
					}
				};
				//~ wsModel.addStoreEventListener(wsModelEventListener);
					
				var themeManagerEventListener = {
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
				themeManager.addThemeChangeEventListener(
					themeManagerEventListener);
				themeManager.setTheme(wsModel.get().theme);
				wsController = new WsController($('#ws'), wsModel,
					themeManager);
				propertyBrowser = new PropertyBrowser($('#ws-properties'));
				var wsControllerEventListener = {
					onSelect : function(selectedItem) {
						propertyBrowser.set(selectedItem,
							wsController.updateSelectedItem);
					}
				};
				wsController.addSelectEventListener(wsControllerEventListener);

				$('#panel-west').pdAccordion();
				var $toolbar = $('#panel-east').pdAccordion({
					mode : 'multi',
					collapsible : true
				});
				
				$('#ws-primitives').pdToolbar({
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
