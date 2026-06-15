(function () {

    function init() {

        if (typeof widget === "undefined") {
            setTimeout(init, 300);
            return;
        }

        widget.addEvent("onLoad", function () {

            widget.body.innerHTML =
                '<div class="header">Project Dashboard</div>' +
                '<div id="tableContainer">Loading projects...</div>';

            loadProjects();
        });
    }

    init();

})();

function loadProjects() {

    require(
        ["DS/WAFData/WAFData", "DS/i3DXCompassServices/i3DXCompassServices"],
        function (WAFData, CompassServices) {

            CompassServices.getPlatformServices({

                platformId: widget.getValue("x3dPlatformId"),

                onComplete: function (services) {

                    var spaceUrl = services["3DSpace"];

                    var url = spaceUrl + "/resources/v1/modeler/projects";

                    WAFData.authenticatedRequest(url, {
                        method: "GET",
                        type: "json",

                        onComplete: function (res) {

                            renderTable(res.data || []);
                        },

                        onFailure: function () {
                            document.getElementById("tableContainer")
                                .innerHTML = "Failed to load projects";
                        }
                    });
                }
            });
        }
    );
}

function renderTable(data) {

    if (!data.length) {
        document.getElementById("tableContainer").innerHTML =
            "No projects found";
        return;
    }

    var html =
        '<table class="table">' +
        '<tr>' +
            '<th>Title</th>' +
            '<th>Description</th>' +
            '<th>Status</th>' +
        '</tr>';

    for (var i = 0; i < data.length; i++) {

        var p = data[i].dataelements;

        var statusClass =
            (p.state === "Active")
                ? "status-active"
                : "status-inactive";

        html +=
            '<tr>' +
                '<td>' + (p.title || "") + '</td>' +
                '<td>' + (p.description || "") + '</td>' +
                '<td class="' + statusClass + '">' +
                    (p.state || "Unknown") +
                '</td>' +
            '</tr>';
    }

    html += '</table>';

    document.getElementById("tableContainer").innerHTML = html;
}
