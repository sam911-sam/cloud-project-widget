(function () {

    function init() {

        if (typeof widget === "undefined") {
            setTimeout(init, 300);
            return;
        }

        widget.addEvent("onLoad", function () {

            widget.body.innerHTML =
                '<div class="header">Project Status</div>' +
                '<div class="container">' +

                    '<div class="left-panel">' +
                        '<div id="tableContainer">Loading projects...</div>' +
                    '</div>' +

                    '<div class="right-panel" id="detailPanel">' +
                        'Select a project to view details' +
                    '</div>' +

                '</div>';

            loadProjects();
        });
    }

    init();

})();

/* ================= LOAD PROJECTS ================= */

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
                            renderTable(res.data || [], spaceUrl);
                        },

                        onFailure: function () {
                            document.getElementById("tableContainer").innerHTML =
                                "<span style='color:red'>Failed to load projects</span>";
                        }
                    });
                }
            });
        }
    );
}

/* ================= RENDER TABLE ================= */

function renderTable(data, spaceUrl) {

    if (!data.length) {
        document.getElementById("tableContainer").innerHTML = "No projects found";
        return;
    }

    var html =
        '<table class="table">' +
        '<tr>' +
            '<th>Project</th>' +
            '<th>Description</th>' +
            '<th>Status</th>' +
        '</tr>';

    for (var i = 0; i < data.length; i++) {

        var p = data[i].dataelements || {};

        var projectId = data[i].physicalid || data[i].id;

        var statusClass =
            (p.state === "Active") ? "status-active" : "status-inactive";

        html +=
            '<tr>' +

                '<td>' +
                    '<a href="#" class="project-link" data-id="' + projectId + '">' +
                        (p.title || "Unnamed") +
                    '</a>' +
                '</td>' +

                '<td>' + (p.description || "-") + '</td>' +

                '<td class="' + statusClass + '">' +
                    (p.state || "-") +
                '</td>' +

            '</tr>';
    }

    html += '</table>';

    document.getElementById("tableContainer").innerHTML = html;

    attachClick(spaceUrl);
}

/* ================= CLICK HANDLER ================= */

function attachClick(spaceUrl) {

    var links = document.getElementsByClassName("project-link");

    for (var i = 0; i < links.length; i++) {

        links[i].onclick = function (e) {

            e.preventDefault();

            var projectId = this.getAttribute("data-id");

            openProject(projectId, spaceUrl);
        };
    }
}

/* ================= DETAILS PANEL ================= */

function openProject(projectId, spaceUrl) {

    var url =
        spaceUrl +
        "/resources/v1/modeler/projects/" +
        projectId;

    require(["DS/WAFData/WAFData"], function (WAFData) {

        WAFData.authenticatedRequest(url, {

            method: "GET",
            type: "json",

            onComplete: function (res) {

                var p = res.data || res;

                document.getElementById("detailPanel").innerHTML =
                    '<div class="detail-title">' + (p.title || "-") + '</div>' +

                    '<div class="detail-row"><b>Description:</b> ' + (p.description || "-") + '</div>' +
                    '<div class="detail-row"><b>Status:</b> ' + (p.state || "-") + '</div>' +
                    '<div class="detail-row"><b>Owner:</b> ' + (p.owner || "-") + '</div>' +
                    '<div class="detail-row"><b>Created:</b> ' + (p.created || "-") + '</div>';
            },

            onFailure: function () {
                document.getElementById("detailPanel").innerHTML =
                    "<span style='color:red'>Failed to load details</span>";
            }
        });
    });
}
