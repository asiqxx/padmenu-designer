(function($) {
	var members = {
		private : {
			create : function(options) {
				var $self = $(this);
				
				if (!$self.data('pdAccordion')) {
					options = $.extend(
						{
							mode : 'single',
							collapsible : false,
							active : true
						},
						options
					);
					
					$self.children().each(function(i, element) {
						var $element = $(element);
						if (i % 2 == 0) {
						    $element.addClass('pd-header pd-accordion-header');
						    $element.on('click.pdAccordion',
								options.mode == 'multi'
								? members.private.multiModeHandler
								: members.private.singleModeHandler);
						} else {
						    $element
								.addClass('pd-content pd-accordion-content');
						}
					});
					
					var $contents = $self.children(
						'.pd-accordion-content');
					if (typeof options.active == 'number') {
						// Show the appropriate content.
						$contents.hide();
						$contents.eq(options.active).show();
					} else if (typeof options.active == 'boolean') {
						// Show or hide all contents.
						if (!options.active
							|| options.mode == 'single') {
							$contents.hide();
							if (options.collapsible == false) {
								$contents.eq(0).show();
							}
						}
					} else {
						$contents.hide();
					}
					
					$self.addClass('pd-panel pd-accordion');
					
					$self.data('pdAccordion', {
						target : $self,
						options : options
					});
				}
				
				return $self;
			},
			singleModeHandler : function() {
			    var $header = $(this);
			    var $content = $header.next();
			    if ($content.is(":visible")
					&& $header.parent().data('pdAccordion')
						.options.collapsible == true) {
					$header.parent().children(
						'.pd-accordion-content:visible')
						.slideUp('normal');
			    } else {
					$header.parent().children(
						'.pd-accordion-content:visible')
						.filter(function() {
							if ($content.get(0) === $(this).get(0)) {
								return false;
							}
							return true;
						}).slideUp('normal');
					$content.slideDown('normal');
			    }
			},
			multiModeHandler : function() {
			    var $header = $(this);
			    var $content = $header.next();
			    if ($content.is(":visible")) {
					if ($header.parent().children(
						'.pd-accordion-content:visible').length != 1
						|| $header.parent().data('pdAccordion')
							.options.collapsible != false) {
						$content.slideUp('normal');
					}
			    } else {
					$content.slideDown('normal');
			    }
			}
		},
		public : {
			destroy : function() {
				var $self = $(this);
				
				$self.removeClass('pd-panel pd-accordion');
				$self.children('.pd-accordion-header')
					.removeClass('pd-header pd-accordion-header')
					.off('.pdAccordion');
				$self.children('.pd-accordion-content')
					.removeClass('pd-content pd-accordion-content');
					
				$self.removeData('pdAccordion');
					
				return $self;
			}
		}
	};
	
	$.fn.pdAccordion = function(method) {
		if (members.public[method]) {
			return members.public[method].apply(this,
				Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return members.private.create.apply(this, arguments);
		} else {
			$.error('$.fn.pdAccordion: Method "' + method + '" not found.');
		} 
	};
})(jQuery);
