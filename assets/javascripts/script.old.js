(function () {
	"use strict";

	console.log("Script injected");

	/**
	 * Define jQuery selectors
	 */
	// Contains divs for the four categories: "Tracks", "Artists", "Stations", "Albums"
	var likesDivSelector = "div#likes";
	// Contains the heading for the category
	var titleDivSelector = "div.title";
	// Contains the "Show more" button
	var showMoreSelector = "div.show_more";

	// Once initialized, represents the div with buttons "Show more" and "Show all"
	var $showMoreDivWrapper;

	/**
	 * Load and display all Tracks, Artists, Stations, or Albums which the user has liked
	 *
	 * @param jQuery.Event event
	 * @return undefined
	 */
	function showAllEntries(event) {
		console.log("Showing all likes");

		/**
		 * @param String category: "songs", "artists", "stations", or "albums"
		 * @param Number startIndex: the starting index from which to retrieve 5 or 10 entries
		 * @param String username: Pandora username
		 * @return String: the URL where Like entries can be retrieved
		 */
		function apiUrl(category, startIndex, username) {
			var categoryMap = {
				"songs": "tracklikes?thumbStartIndex=",
				"artists": "artistlikes?artistStartIndex=",
				"stations": "stationlikes?stationStartIndex=",
				"albums": "albumlikes?albumStartIndex="
			}
			return "http://www.pandora.com/content/" + categoryMap[category] + startIndex + "&webname=" + username;
		}

		var $likeSection = $(event.delegateTarget);
		var $likesContainer = $likeSection.children().eq(1);

		var likesShownCount = $likesContainer.children("div.section").length;

		var category = $likeSection.attr("id");
		var totalLikes = parseInt($likeSection.find("span.section_count").html().replace(/[()]/g, ""));
		var username = $("#user_info_header").text().trim();

		if (likesShownCount >= totalLikes) {
			return;
		}

		$showMoreDivWrapper.hide();

		var interval = 5;
		for (var i = 5; i <= totalLikes; i += interval) {
			$.ajax(apiUrl(category, i, username), { cache: false }).done(function (data) {
				$likesContainer.append($(data).filter(".section"));
			});
			interval = 10;
		}


		console.log("Showed all likes");
	}


	/**
	 * Indicate whether Pandora Likes has injected the DOM modifications.
	 *
	 * @return true iff Pandora Likes is initialized
	 */
    function initialized() {
		var $likesDiv = $(likesDivSelector);
		return ($likesDiv.length && $likesDiv.find("span#pl-initialized").length);
	}

	/**
	 * Inject DOM modifications into the page.
	 *
	 * @return undefined
	 */
	function initialize() {
		var $likesDiv = $(likesDivSelector),
			$titleDiv = $likesDiv.find(titleDivSelector);

		function initTitleDiv() {
			$titleDiv.wrapInner("<div class='pl-title' />");
			$titleDiv.append("<span class='pl-sort'>Sort by <div class='pl-sort-button'>Title<span class='pl-caret'></span></div></span>");
		}
		initTitleDiv();

		function initShowMoreDiv() {
			var $showMoreDiv = $likesDiv.find(showMoreSelector);

			$showMoreDivWrapper = $showMoreDiv.wrap("<div class='pl-show-more' />").parent();
			var $showAllButton = $("<div class='pl-show-all-button'>Show all<span class='pl-caret'></span></div>");
			$showMoreDivWrapper.append($showAllButton);
			$showMoreDivWrapper.closest(".like_section").on("click", ".pl-show-all-button", showAllEntries);

			$showMoreDiv.on("click", function () {
				/**
				 * Pandora creates a new div.show_more when the "Show more" button is clicked;
				 * indicate whether a new one has been created.
				 *
				 * @return true iff a new div.show_more exists.
				 */
				function newShowMoreDivCreated() {
					return $showMoreDivWrapper.siblings("div.show_more").length > 0;
				}

				// Pandora takes time to perform an animation when loading more entries;
				// first hide the existing div, then remove it once Pandora has loaded more entries.
				$showMoreDivWrapper.hide();
				var reinitializingShoreMoreDiv = setInterval(function () {
					if (newShowMoreDivCreated()) {
						$showMoreDivWrapper.remove();
						initShowMoreDiv();
						clearInterval(reinitializingShoreMoreDiv);
					}
				}, 500);
			});
		}
		initShowMoreDiv();

		$likesDiv.prepend("<span id='pl-initialized' />");
	}

	// Pandora takes a few seconds to load the page contents;
	// keep trying to initialize Pandora Likes on an interval.
	var initializing = setInterval(function () {
		console.log("Initializing Pandora Likes");
		if (!initialized()) {
			initialize();
		} else {
			clearInterval(initializing);
		}
	}, 1000);

}());