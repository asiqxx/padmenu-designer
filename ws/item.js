(function($) {
	var members = {
		private : {
			create : function(options) {
				var $self = this;
				
				if (!$self.data('pdWsItem')) {
					var wsItemFactory = WsItemFactory.forType(
						options.model.type);
					var view = wsItemFactory.createView(options.model);
					$self.css({
						'width' : options.model.w,
						'height' : options.model.h,
					});
					view.on('render.pdWsItem', function() {
						$self.css({
							'width' : view.getWidth(),
							'height' : view.getHeight(),
						});
						var stage = new Kinetic.Stage({
							container : $self.get(0),
							width : view.getWidth(),
							height : view.getHeight()
						});
						var layer = new Kinetic.Layer();
						layer.add(view);
						stage.add(layer);
						stage.draw();
					});
					wsItemFactory.render(view);
					
					$self.addClass('pd-ws-item');
					
					$self.data('pdWsItem', {
						target : $self,
						view : view,
						options : options
					});
				}
				
				return $self;
			}
		},
		public : {
			destroy : function() {
				var $self = $(this);
				
				$self.removeClass('pd-ws-item');
				$self.data('pdWsItem').view.off('.pdWsItem');
				$self.removeData('pdWsItem');
					
				return $self;
			}
		}
	};
	
	$.fn.pdWsItem = function(method) {
		if (members.public[method]) {
			return members.public[method].apply(this,
				Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return members.private.create.apply(this, arguments);
		} else {
			$.error('$.fn.pdWsItem: Method "' + method + '" not found.');
		}
	};
})(jQuery);
