(function () {

    function init() {

        if (typeof widget === "undefined") {
            setTimeout(init, 300);
            return;
        }

        widget.addEvent("onLoad", function () {

            widget.body.innerHTML =
                '<div class="header">Project Status</div>' +
                '<div id="tableContainer">Loading projects...</div>';

            loadProjects();
        });
    }

    init();

})();

/* ---------------- LOAD PROJECTS ---------------- */

function loadProjects() {

    require(
        ["DS/WAFData/WAFData", "DS/i3DXCompassServices/i3DXCompassServices"],
        function (WAFData, CompassServices) {

            CompassServices.getPlatformServices({

                platformId: widget.getValue("x3dPlatformId"),

                onComplete: function (services) {

                    var spaceUrl = services["3DSpace"];

                    var url =
                        spaceUrl +
                        "/resources/v1/modeler/projects";

                    WAFData.authenticatedRequest(url, {

                        method: "GET",
                        type: "json",

                        onComplete: function (res) {

                            renderTable(res.data || [], spaceUrl);
                        },

                        onFailure: function () {

                            document.getElementById("tableContainer")
                                .innerHTML =
                                "<div style='color:red'>Failed to load projects</div>";
                        }
                    });
                }
            });
        }
    );
}

/* ---------------- RENDER TABLE ---------------- */

function renderTable(data, spaceUrl) {

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

        /* IMPORTANT: use physicalid/id */
        var projectId =
            data[i].physicalid ||
            data[i].id;

        var statusClass =
            (p.state === "Active")
                ? "status-active"
                : "status-inactive";

        html +=
            '<tr>' +

                /* CLICKABLE PROJECT NAME */
                '<td>' +
                    '<a href="#" class="project-link" data-id="' + projectId + '">' +
                        (p.title || "Unnamed Project") +
                    '</a>' +
                '</td>' +

                '<td>' + (p.description || "-") + '</td>' +

                '<td class="' + statusClass + '">' +
                    (p.state || "Unknown") +
                '</td>' +

            '</tr>';
    }

    html += '</table>';

    document.getElementById("tableContainer").innerHTML = html;

    attachClick(spaceUrl);
}

/* ---------------- CLICK HANDLER ---------------- */

function attachClick(spaceUrl) {

    var links = document.getElementsByClassName("project-link");

    for (var i = 0; i < links.length; i++) {

        links[i].onclick = function (e) {

            e.preventDefault();

            var projectId =
                this.getAttribute("data-id");

            openProject(projectId, spaceUrl);
        };
    }
}

/* ---------------- OPEN PROJECT ---------------- */

function openProject(projectId, spaceUrl) {

    /* CORRECT ENOVIA URL (based on your system) */
    var url =
        spaceUrl +
        "/enovia/common/emxNavigator.jsp" +
        "?appName=ENOBUPS_AP" +
        "&objectId=" + projectId;

    window.open(url, "_blank");
}
