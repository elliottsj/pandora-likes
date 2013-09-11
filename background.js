/**
 * Page Action
 */

function checkForValidUrl(tabId, changeInfo, tab) {
  if (tab.url.search(/https?:\/\/www\.pandora\.com\/.*/) > -1) {
    chrome.pageAction.show(tabId);
  }
}

// Listen for any changes to the URL of any tab.
chrome.tabs.onUpdated.addListener(checkForValidUrl);


/**
 * Retrieve Pandora username
 */

function getUsernameFromUrl(url) {
  var deferred = $.Deferred();

  var jsonpCallback = "plCallback";
  var jsonpUrl = url.replace(/[?&]callback=[^&#]*/i, "") + "&callback=" + jsonpCallback;

  $.ajax(jsonpUrl, { dataType: "text" }).done(function (data, textStatus, jqXHR) {
    var xml = JSON.parse(data.replace(jsonpCallback, "").slice(1, -1)).rpcResult;
    var username = $($.parseXML(xml)).find("name:contains('webName')").siblings("value").text();
    username ? deferred.resolve(username) : deferred.reject();
  });

  return deferred.promise();
}

function getUsernameFromStorage() {
  var deferred = $.Deferred();
  chrome.storage.local.get("username", function (items) {
    deferred.resolve(items.username);
  });
  return deferred.promise();
}

function storeUsername(requestDetails) {
  getUsernameFromUrl(requestDetails.url).done(function (username) {
    chrome.storage.local.set({ username: username });
  }).fail(function () {
    console.log("Failed to retrieve username");
  });
}

// Listen for completed web requests to the Pandora JSONP URL
chrome.webRequest.onCompleted.addListener(storeUsername, {urls: ["https://www.pandora.com/radio/jsonp/*"]});


/**
 * Retrive likes
 */

/**
 * @param String category: "songs", "artists", "stations", or "albums"
 * @param Number startIndex: the starting index from which to retrieve 5 or 10 entries
 * @param String username: Pandora username
 * @return String: the URL where Like entries can be retrieved
 */
function likesApiUrl(category, startIndex, username) {
  var categoryMap = {
    "songs": "tracklikes?thumbStartIndex=",
    "artists": "artistlikes?artistStartIndex=",
    "stations": "stationlikes?stationStartIndex=",
    "albums": "albumlikes?albumStartIndex="
  }
  return "http://www.pandora.com/content/" + categoryMap[category] + startIndex + "&webname=" + username;
}

/**
 * @param String category: "songs", "artists", "stations", or "albums"
 * @param String username: Pandora username
 * @return Array of Object: all items in the category that the user has liked
 */
function getLikes(category, username) {
  var deferred = $.Deferred();

  var likes = [];

  function fetchData(index) {
    console.log("Fetching data from " + likesApiUrl(category, index, username));
    $.ajax(likesApiUrl(category, index, username), { cache: false }).done(function (data) {
      var $infobox = $($.parseHTML(data)).filter(".section").find(".infobox-body");

      $infobox.each(function () {
        var info = $.map(this.children, function (element) {
          var $a = $(element).find("a");
          return {
            text: $a.text(),
            href: "http://www.pandora.com" + $a.attr("href")
          }
        });

        if (category == "songs") {
          likes.push({
            song: info[0],
            artist: info[1],
            station: info[2]
          });
        } else if (category == "artists") {
          likes.push({
            artist: info[0]
          });
        } else if (category == "stations") {
          likes.push({
            station: info[0]
          });
        } else if (category == "albums" ) {
          likes.push({
            album: info[0],
            artist: info[1]
          });
        }
      });

      // Notify progress by passing the number of likes fetched
      deferred.notify(likes.length);

      if (index < 10 && $infobox.length == 5) {
        fetchData(index + 5);
      } else if (index >= 10 && $infobox.length == 10) {
        fetchData(index + 10);
      } else {
        deferred.resolve(likes);
      }

    });
  }

  // Fetch 'like' data, starting at index 0
  fetchData(0);

  return deferred.promise();
}


/**
 * Respond to requests for username and likes
 */

// One-time requests; progress for loading likes is not messaged
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.type == "username") {
    getUsernameFromStorage().done(function (username) {
      sendResponse(username);
    });
    return true;
  } else if (request.type == "likes") {
    getUsernameFromStorage().then(function (username) {
      return getLikes(request.category, username);
    }).then(function (likes) {
      sendResponse(likes);
    });
    return true;
  }
});

// Persistent requests; progress for likes is messaged
chrome.runtime.onConnect.addListener(function (port) {
  port.onMessage.addListener(function (message) {
    if (message.type == "likes") {
      getUsernameFromStorage().then(function (username) {
        return getLikes(message.category, username);
      }).progress(function (likesLoaded) {
        port.postMessage({ type: "progress", value: likesLoaded });
      }).then(function (likes) {
        port.postMessage({ type: "result", value: likes });
      });
    }
  });

});