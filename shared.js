// JavaScript Document

var sfpdashboard_shared_functions = function() {
	return {
		numberToDate: function(days) {
			var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
			var date = new Date(days*86400000);
			var month = date.getMonth();
			var day = date.getDate();
			return months[month] + " " + day;
		},
		formatData: function(attrs,quantity) {
			if (attrs.mode != "text") {
				if (attrs.roundto && !isNaN(quantity)) {
					roundMultiplier = Math.pow(10,attrs.roundto*1);
					quantity = Math.round(quantity*roundMultiplier)/roundMultiplier;
				}
				if (attrs.mode == "date" && !isNaN(quantity)) {
					quantity = sfpdashboard_shared_functions.numberToDate(quantity);
				}
			}
			if (attrs.prepend) quantity = attrs.prepend + quantity;	
			if (attrs.append) quantity = quantity + attrs.append;
			return quantity;
		}
	}
}();