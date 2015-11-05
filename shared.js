// JavaScript Document


var sfpdashboard_shared_functions = function() {
	"use strict";
	return {
		numberToDate: function(days) {
			var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
			var date = new Date(days*86400000);
			var month = date.getMonth();
			var day = date.getDate();
			return months[month] + " " + day;
		},
		formatData: function(attrs,quantity) {
			var roundMultiplier;
			if (quantity === "") {return "";}
			if (attrs.mode !== "text") {
				if (!isNaN(quantity)) {
					if (typeof(attrs.roundMultiplier) !== "undefined") {
						roundMultiplier = attrs.roundMultiplier;
					} else if (typeof(attrs.roundto)!=="undefined") {
						roundMultiplier = Math.pow(10,attrs.roundto*1);
					}
					if (typeof(roundMultiplier)!=="undefined") {
						quantity = Math.round(quantity*roundMultiplier)/roundMultiplier;
					}
				}
				if (attrs.mode === "date" && !isNaN(quantity)) {
					quantity = sfpdashboard_shared_functions.numberToDate(quantity);
				}
			}
			if (attrs.prepend) {quantity = attrs.prepend + quantity;}	
			if (attrs.append) {quantity = quantity + attrs.append;}
			if (quantity === "$NaN") {console.log(attrs);}
			return quantity;
		}
	};
}();