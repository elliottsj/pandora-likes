$(document).ready(function () {

  function addDataToTable(likes) {
    var $likesTableBody = $("#likes");

    function tableCellWithLink(href, text) {
      return $("<td></td>").append($("<a></a>").attr("href", href).text(text));
    }

    function tableCellWithText(text) {
      return $("<td></td>").text(text);
    }

    $(likes).each(function () {
      var $row = $("<tr></tr>");
      $row.append(tableCellWithLink(this.song.href, this.song.text));
      $row.append(tableCellWithLink(this.artist.href, this.artist.text));
      $row.append(tableCellWithText(this.station.text));
      $likesTableBody.append($row);
    });
  }

  var port = chrome.runtime.connect();
  port.postMessage({ type: "likes", category: "songs" });
  port.onMessage.addListener(function (message) {
    if (message.type == "progress") {
      console.log(message.value);
    }
    else if (message.type == "result") {
      addDataToTable(message.value);
    }
  });

});
