define(function () {

    widget.addEvent("onLoad", function () {

        console.log("Widget Loaded");

        widget.body.innerHTML =
            "<h3>Widget Loaded Successfully</h3>";

    });

});
