var SessionManager = function() {
	var self = this;
	
	var stateIndexMap = {};
	var stateMap = {};
	
	var storeTimerId = 0;
	self.store = function(ns, state) {
		clearTimeout(storeTimerId);
		storeTimerId = setTimeout(function() {
			var stateIndex = stateIndexMap[ns];
			var states = stateMap[ns];
			if (typeof stateIndex === 'undefined'
				|| typeof states === 'undefined') {
				stateIndex = 0;
				stateIndexMap[ns] = stateIndex;
				states = [];
				stateMap[ns] = states;
			}
			if (stateIndex < states.length - 1) {
				states.splice(stateIndex + 1, states.length - stateIndex - 1);
			}
			
			stateIndex = states.push($.extend(true, {}, state)) - 1;
			stateIndexMap[ns]  = stateIndex;
			
			sessionStorage.setItem('pd.session.index.' + ns,
				JSON.stringify(stateIndex));
			sessionStorage.setItem('pd.session.states.' + ns,
				JSON.stringify(states));
		}, 250);
	};
	self.restore = function(ns, offset) {
		var stateIndex = stateIndexMap[ns];
		var states = stateMap[ns];
		if (typeof stateIndex === 'undefined'
			|| typeof states === 'undefined') {
			stateIndex = parseInt(
				sessionStorage.getItem('pd.session.index.' + ns));
			if (stateIndex === null) {
				return null;
			}
			states = JSON.parse(
				sessionStorage.getItem('pd.session.states.' + ns));
			if (states === null) {
				return null;
			}
			stateIndexMap[ns] = stateIndex;
			stateMap[ns] = states;
		}
		
		if (typeof offset === 'undefined') {
			offset = -1;
		}
		
		stateIndex += offset;
		if (stateIndex < 0) {
			stateIndex = 0;
		}
		if (stateIndex >= states.length) {
			stateIndex = states.length - 1;
		}
		stateIndexMap[ns]  = stateIndex;

		var state = $.extend(true, {}, states[stateIndex]);
		
		sessionStorage.setItem('pd.session.index.' + ns, stateIndex);
		
		return state;
	};
};
