$(document).ready(function () {
  "use strict";  

  chrome.runtime.sendMessage({ type: "likes", category: "songs" }, function(likes) {
    var $likesTableBody = $("#likes");
    console.log(likes);

    function tableCellWithLink(href, text) {
      return $("<td></td>").append($("<a></a>").attr("href", href).text(text));
    }

    $(likes).each(function () {
      var $row = $("<tr></tr>");
      $row.append(tableCellWithLink(this.song.href, this.song.text));
      $row.append(tableCellWithLink(this.artist.href, this.artist.text));
      $row.append(tableCellWithLink(this.station.href, this.station.text));
      $likesTableBody.append($row);
    });
  });

});
