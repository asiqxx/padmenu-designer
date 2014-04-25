(function($) {
	var members = {
		private : {
			create : function(options) {
				var $self = this;
				
				if (!$self.data('pdToolbar')) {
					options = $.extend(
						{
							source : []
						},
						options
					);
						
					$self.data('pdToolbar', {
						target : $self,
						options : options
					});
					
					var $dummyToolbar = $self.clone(true, true).css({
						'visibility': 'hidden'
					}).appendTo($(document.body));
					var $dummyItem = 
						$('<div class="pd-toolbar-item">&nbsp;</div>')
						.appendTo($dummyToolbar);
					members.private.separatorStyles = {
						'font-size' : $dummyItem.css('font-size'),
						'height' : parseInt($dummyItem.outerHeight()),
						'margin-top' : parseInt($dummyItem.css('margin-top')),
						'margin-left' : $dummyItem.css('margin-left'),
						'margin-bottom' : parseInt($dummyItem.css('margin-bottom')),
						'margin-right' : $dummyItem.css('margin-right'),
					};
					$dummyToolbar.remove();
					
					members.public.setSource.apply($self, [options.source]);
					
					$self.addClass('pd-toolbar');
				}
				
				return $self;
			}
		},
		public : {
			destroy : function() {
				var $self = this;
				
				$self.removeClass('pd-toolbar');
				$self.children('.pd-toolbar-item').remove();
				$self.removeData('pdToolbar');
					
				return $self;
			},
			setSource : function(source) {
				var $self = this;
				
				if (!$.isArray(source)) {
					$.error(
						'$.fn.pdToolbar: value of "source" must be an array');
				}
				
				$self.children('.pd-toolbar-item').remove();
				
			    for (var i = 0; i < source.length; ++i) {
					var $item = $('<div/>');
					$item.data('pdToolbarItem', source[i]);
					
					if (source[i].type == 'separator') {
						$item.addClass('pd-toolbar-item-separator');
						$item.css(members.private.separatorStyles);
					} else {
						$item.addClass('pd-toolbar-item');
						switch (source[i].type) {
						case 'class':
							$item.addClass(source[i].value);
							break;
						case 'text':
							$item.text(source[i].value);
							break;
						case 'html':
							$item.html(source[i].value);
							break;
						default:
							$item.text(source[i].name);
							break;
						}
					
						$item.on('click.pdToolbarItem', function() {
							var $item = $(this);
							if ($item.data('pdToolbarItem').mode == "option") {
								$self.find('.pd-toolbar-item-active')
									.removeClass('pd-toolbar-item-active');
								$item.addClass("pd-toolbar-item-active");
							} else if ($item.data('pdToolbarItem').mode
								== "checkbox") {
								$item.toggleClass("pd-toolbar-item-active");
							}
							return true;
						});
						
						if (typeof source[i].click == 'function') {
							$item.on('click.pdToolbarItem', source[i].click);
						}

						if (typeof source[i].draggable == 'object') {
							$item.pdDraggable(source[i].draggable);
						} else if (source[i].draggable === true) {
							$item.pdDraggable();
						}
					}

					$self.append($item);
			    }
			    
			    $self.data('pdToolbar').options.source = source;
			    
			    return $self;
			},
			getElement : function(name) {
			    return this.find('.pd-toolbar-item').filter(function() {
					return $(this).data('pdToolbarItem').name == name;
				});
			},
			getSelectedOption : function() {
			    return this.find('.pd-toolbar-item').filter(function() {
					var $item = $(this);
					return $item.data('pdToolbarItem').mode == 'option'
						&& $item.hasClass('pd-toolbar-item-active');
				});
			},
			selectOption : function(name) {
				var $item = members.public.getElement.apply(this, [name]);
				if ($item.length
					&& $item.data('pdToolbarItem').mode == 'option') {
					$item.trigger('click');
				}
				return this;
			}
		}
	};
	
	$.fn.pdToolbar = function(method) {
		if (members.public[method]) {
			return members.public[method].apply(this,
				Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return members.private.create.apply(this, arguments);
		} else {
			$.error('$.fn.pdToolbar: Method "' + method + '" not found.');
		} 
	};
})(jQuery);
