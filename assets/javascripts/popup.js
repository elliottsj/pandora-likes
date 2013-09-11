var MAIN_PAGE = "/views/display.html"

$(document).ready(function () {
	// When button is clicked, open MAIN_PAGE where likes will be displayed
	$("#show-likes").click(function () {
		chrome.tabs.query({
			active: true,
			currentWindow: true
		}, function (tabs) {
			chrome.tabs.create({
				url: MAIN_PAGE,
				index: tabs[0].index + 1,
				openerTabId: tabs[0].id
			});
		});
	});
});