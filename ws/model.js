var WsModel = function() {
	var data = null;
	var states = [];
	var stateIndex = -1;
	var storeTimerId = 0;

    function getPreferredIndex(page, item) {
		var index = -1;

		var i = 0;
		while (i < data.pages[page].length && index == -1) {
			var otherItem = data.pages[page][i];
			if (item.x < (otherItem.x + otherItem.w / 2)
				&& otherItem.x < (item.x + item.w)
				&& item.y < (otherItem.y + otherItem.h)
				&& otherItem.y < (item.y + item.h)) {
				index = i;
			}
			i++;
		}

		if (index == -1) {
			return data.pages[page].length;
		}
		return index;
    }

    function getRowHeight(page, index) {
		var height = 0;
		var y = data.pages[page][index].y;
		var i = index;
		while (i >= 0) {
			var item = data.pages[page][i];
			if (item.y != y) {
				break;
			}
			if (item.h > height
				&& (item.type != 'ls' && item.type != 'ps')) {
				height = item.h;
			}
			i--;
		}
		return height;
    }

    function alignItem(page, index, item) {
		if (index == 0) {
			item.x = 0;
			item.y = 0;
		} else {
			var prevItem = data.pages[page][index - 1];
			if (prevItem.type == 'ps'/* && item.type != 'ps' */) {
				return null;
			}
			if ((prevItem.type == 'ls'
				|| (prevItem.x + prevItem.w + item.w) > data.width)
				&& (item.type != 'ls' && item.type != 'ps')) {
				item.x = 0;
				item.y = prevItem.y + getRowHeight(page, index - 1);
			} else {
				item.x = prevItem.x + prevItem.w;
				item.y = prevItem.y;
			}
		}
		if ((item.y
			+ (item.type == 'ls' || item.type == 'ps' ? 0 : item.h))
			> data.height) {
			return null;
		}
		item.p = page;
		item.i = index;
		
		return item;
    }

    function alignedItem(page, index, item) {
		return alignItem(page, index, $.extend(true, {}, item));
    }

    function update(page, index) {
		if (data.pages[page].length == 0) {
			if (page > 0) {
				data.pages.splice(page, 1);
				if (page < data.pages.length) {
					return update(page, 0);
				}
				return [
					data.pages[page - 1][data.pages[page - 1].length - 1],
					data.pages[page - 1][data.pages[page - 1].length - 1] ];
			}
		} else if (index == 0
			&& page > 0
			&& alignedItem(page - 1, data.pages[page - 1].length,
				data.pages[page][index]) !== null) {
			return update(page - 1, data.pages[page - 1].length);
		}

		var length = data.pages[page].length;

		var i = index;
		while (i < data.pages[page].length
			&& length == data.pages[page].length) {
			if ((lastItem = alignItem(page, i, data.pages[page][i])) === null) {
				var extraItems = data.pages[page].splice(i,
					data.pages[page].length - i);
				if (page + 1 == data.pages.length) {
					data.pages.push(extraItems);
				} else {
					data.pages[page + 1] = extraItems
						.concat(data.pages[page + 1]);
				}
			}
			i++;
		}
		while (page + 1 < data.pages.length
			&& i == data.pages[page].length
			&& data.pages[page + 1].length != 0) {
			var missingItem = alignedItem(page, i, data.pages[page + 1][0]);
			if (missingItem === null) {
				var p = page + 1;
				if (data.pages[page + 1][0].p != p) {
					while (p < data.pages.length) {
						for ( var j = 0; j < data.pages[p].length; j++) {
							data.pages[p][j].p = p;
						}
						p++;
					}
					lastItem = data.pages[data.pages.length - 1]
						[data.pages[data.pages.length - 1].length - 1];
				}
			} else {
				data.pages[page].push(data.pages[page + 1].shift());

				data.pages[page][i].p = page;
				data.pages[page][i].i = i;
				data.pages[page][i].x = missingItem.x;
				data.pages[page][i].y = missingItem.y;
			}
			i++;
		}

		var firstItem = index < data.pages[page].length
			? data.pages[page][index]
			: data.pages[page][data.pages[page].length - 1];
		if (!firstItem) {
			firstItem = {
				p : page,
				i : 0
			};
		}
		var lastItem = data.pages[page][data.pages[page].length - 1];
		if (!lastItem) {
			lastItem = {
				p : page,
				i : 0
			};
		}
		var range = [ firstItem, lastItem ];
		if (length != data.pages[page].length
			&& page + 1 < data.pages.length) {
			range[1] = update(page + 1, 0)[1];
		}

		return range;
    }

    var pagesChangeEventListeners = [];
    function firePagesChangeEvent() {
		for (var i in pagesChangeEventListeners) {
			pagesChangeEventListeners[i]
				.onPagesChange(data.pages.length);
		}
    }
    var changeEventListeners = [];
    function fireChangeEvent(range) {
		for (var i in changeEventListeners) {
			changeEventListeners[i].onChange(range);
		}
    }
    var storeEventListeners = [];
    function fireStoreEvent() {
		for (var i in storeEventListeners) {
			storeEventListeners[i].onStore(data);
		}
    }
    
    var self = this;

	this.getWidth = function() {
		return data.width;
	};
	this.getHeight = function() {
		return data.height;
	};
	
	this.get = function(page, index) {
		if (typeof page == 'number') {
			if (typeof index == 'number') {
				return data.pages[page][index];
			}
			return data.pages[page];
		}
		return data;
	};
	this.add = function(page, item) {
		var index = getPreferredIndex(page, item);
		if (!alignedItem(page, index, item)) {
			item.p = -1;
			item.i = -1;
			return false;
		}
		data.pages[page].splice(index, 0, item);
		return this.update(page, index);
	};
	this.insert = function(page, index, item) {
		if (!alignedItem(page, index, item)) {
			return false;
		}
		data.pages[page].splice(index, 0, item);
		return this.update(page, index);
	};
	this.remove = function(page, index) {
		var item = data.pages[page].splice(index, 1)[0];
		item.p = -1;
		item.i = -1;
		return this.update(page, index);
	};
	this.realign = function(page, index) {
		var pageCount = data.pages.length;

		var item = data.pages[page].splice(index, 1)[0];
		item.p = -1;
		item.i = -1;

		var range = update(page, index);

		if (page >= data.pages.length) {
			alignItem(page, 0, item);
			data.pages.push([ item ]);
		} else {
			index = getPreferredIndex(page, item);
			if (alignedItem(page, index, item)) {
				data.pages[page].splice(index, 0, item);
				var range2 = update(page, index);
				if (range) {
					if (range2[0].p < range[0].p
						|| range2[0].p == range[0].p
						&& range2[0].i < range[0].i) {
						range[0] = range2[0];
					}
					if (range2[1].p > range[1].p
						|| range2[1].p == range[1].p
						&& range2[1].i > range[1].i) {
						range[1] = range2[1];
					}
				} else {
					range = range2;
				}
			}
		}

		if (range) {
			fireChangeEvent(range);
		}

		if (pageCount != data.pages.length) {
			firePagesChangeEvent();
		}

		return index;
	};
	this.update = function(page, index) {
		var pageCount = data.pages.length;

		var range = update(page, index);

		if (range) {
			fireChangeEvent(range);
		}

		if (pageCount != data.pages.length) {
			firePagesChangeEvent();
		}

		return range;
	};

	this.store = function(state) {
		clearTimeout(storeTimerId);
		storeTimerId = setTimeout(function() {
			if (state) {
				states = [];
				data = $.extend(true, {}, state);
			} else {
				if (stateIndex < states.length - 1) {
					states.splice(stateIndex + 1, states.length - stateIndex - 1);
				}
				state = $.extend(true, {}, data);
			}
			
			stateIndex = states.push(state) - 1;

			fireStoreEvent();
			
			sessionStorage.setItem('wsmodel.states', JSON.stringify(states));
			sessionStorage.setItem('wsmodel.state.index', stateIndex);
		}, 250);
	};
	this.restore = function(offset) {
		if (stateIndex < 0) {			
			var i = sessionStorage.getItem('wsmodel.state.index');
			if (i == null) {
				return;
			}
			var s = sessionStorage.getItem('wsmodel.states');
			if (s == null) {
				return;
			}
			stateIndex = parseInt(i);
			states = JSON.parse(s);
		}
		
		if (typeof offset == 'undefined') {
			offset = -1;
		}
		
		stateIndex += offset;
		if (stateIndex < 0) {
			stateIndex = 0;
		}
		if (stateIndex >= states.length) {
			stateIndex = states.length - 1;
		}

		data = $.extend(true, {}, states[stateIndex]);

		fireStoreEvent();
		
		sessionStorage.setItem('wsmodel.state.index', stateIndex);
	};

	this.addPagesChangeEventListener = function(listener) {
		pagesChangeEventListeners.push(listener);
	};
	this.removePagesChangeEventListener = function(listener) {
		var index = pagesChangeEventListeners.indexOf(listener);
		if (index == -1) {
			return;
		}
		pagesChangeEventListeners.splice(index, 1);
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
	this.addStoreEventListener = function(listener) {
		storeEventListeners.push(listener);
	};
	this.removeStoreEventListeners = function(listener) {
		var index = storeEventListeners.indexOf(listener);
		if (index == -1) {
			return;
		}
		storeEventListeners.splice(index, 1);
	};
};
