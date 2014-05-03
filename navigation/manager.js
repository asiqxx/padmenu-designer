var NavigationManager = function($container) {
	var self = this;
	
	var page = 1;
	
	function onPageClick(e) {
		self.setPage(parseInt($(e.target).text(), 10) - 1);
	}
	function onLeftArrowClick(e) {
		self.setPage(page - 2);
	}
	function onRightArrowClick(e) {
		self.setPage(page);
	}
	function onPageSelect(e) {
		self.setPage(
			parseInt($(e.target).children('option:selected').val(), 10) - 1);
	}
	
	$container.addClass('pd-navigation-manager');
	var $pages = $('<div class="pd-navigation-pages"/>');
	var $previousPreviousPage =
		$('<div class="pd-navigation-page pd-navigation-page-previous-previous">'
			+ page + '</div>').on('click', onPageClick);
	var $nextNextPage =
		$('<div class="pd-navigation-page pd-navigation-page-next-next">'
			+ page + '</div>').on('click', onPageClick);;
	var $previousPage =
		$('<div class="pd-navigation-page pd-navigation-page-previous">'
			+ page + '</div>').on('click', onPageClick);;
	var $nextPage =
		$('<div class="pd-navigation-page pd-navigation-page-next">'
			+ page + '</div>').on('click', onPageClick);;
	var $currentPage =
		$('<div class="pd-navigation-page pd-navigation-page-current">'
			+ page + '</div>');
	$pages.append($previousPreviousPage);
	$pages.append($nextNextPage);
	$pages.append($previousPage);
	$pages.append($nextPage);
	$pages.append($currentPage);
	var $leftArrow =
		$('<div class="pd-navigation-arrow pd-navigation-arrow-left' 
		+ ' icon-icomoon-arrow-left4"/>').on('click', onLeftArrowClick);
	$pages.append($leftArrow);
	var $rightArrow =
		$('<div class="pd-navigation-arrow pd-navigation-arrow-right' 
		+ ' icon-icomoon-arrow-right4"/>').on('click', onRightArrowClick);
	$pages.append($rightArrow);
    $container.append($pages);
    $container.append($('<div class="pd-navigation-arrow ' 
		+ 'pd-navigation-arrow-up icon-icomoon-arrow-up3"/>').css({
			'text-align' : 'center'
		}));
	$container.append($('<hr/>'));
	var $controls = $('<div class="pd-navigation-controls"/>');
	var $pageSelect =
		$('<select class="pd-navigation-page-select pd-navigation-control"/>')
			.on('click', onPageSelect);
	$controls.append($pageSelect);
	$pageCounter =
		$('<span class="pd-navigation-page-counter pd-navigation-control"/>');
	$controls.append($pageCounter);
	$container.append($controls);
	
	self.setPage = function(page) {
		self.firePageSelectEvent(page);
	};
	
	self.onPagesChange = function(newPage, pages) {
		page = newPage + 1;
		$currentPage.text(page);
		if (page > 3) {
			$leftArrow.show();
		} else {
			$leftArrow.hide();
		}
		if (page > 2) {
			$previousPreviousPage.text(page - 2);
			$previousPreviousPage.show();
		} else {
			$previousPreviousPage.hide();
		}
		if (page > 1) {
			$previousPage.text(page - 1);
			$previousPage.show();
		} else {
			$previousPage.hide();
		}
		if (page < pages) {
			$nextPage.text(page + 1);
			$nextPage.show();
		} else {
			$nextPage.hide();
		}
		if (page < pages - 1) {
			$nextNextPage.text(page + 2);
			$nextNextPage.show();
		} else {
			$nextNextPage.hide();
		}
		if (page < pages - 2) {
			$rightArrow.show();
		} else {
			$rightArrow.hide();
		}
		$pageSelect.empty();
		for (i = 1; i <= pages; ++i) {
			$pageSelect.append(new Option(i, i));
		}
		$pageSelect.children('option[value="' + page + '"]')
			.attr("selected", "selected");
		$pageCounter.text('Total: ' + pages);
	};
	
	var pageSelectEventListeners = [];
    self.firePageSelectEvent = function(page) {
		for (var i in pageSelectEventListeners) {
			pageSelectEventListeners[i].onPageSelect(page);
		}
    };
	self.addPageSelectEventListener = function(listener) {
		pageSelectEventListeners.push(listener);
	};
	self.removePageSelectEventListener = function(listener) {
		var index = pageSelectEventListeners.indexOf(listener);
		if (index == -1) {
			return;
		}
		pageSelectEventListeners.splice(index, 1);
	};
};
