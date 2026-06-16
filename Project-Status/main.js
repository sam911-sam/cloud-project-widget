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
                        '<div class="empty">Select a project</div>' +
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

/* ================= TABLE ================= */

function renderTable(data, spaceUrl) {

    if (!data.length) {
        document.getElementById("tableContainer").innerHTML = "No projects found";
        return;
    }

    var html =
        '<table class="table">' +
        '<tr><th>Project</th><th>Status</th></tr>';

    for (var i = 0; i < data.length; i++) {

        var p = data[i].dataelements || {};
        var id = data[i].physicalid || data[i].id;

        html +=
            '<tr>' +
                '<td>' +
                    '<a href="#" class="project-link" data-id="' + id + '">' +
                        (p.title || "Unnamed") +
                    '</a>' +
                '</td>' +
                '<td class="' + (p.state === "Active" ? "status-active" : "status-inactive") + '">' +
                    (p.state || "-") +
                '</td>' +
            '</tr>';
    }

    html += '</table>';

    document.getElementById("tableContainer").innerHTML = html;

    attachClick(spaceUrl);
}

/* ================= CLICK ================= */

function attachClick(spaceUrl) {

    var links = document.getElementsByClassName("project-link");

    for (var i = 0; i < links.length; i++) {

        links[i].onclick = function (e) {

            e.preventDefault();

            var id = this.getAttribute("data-id");

            openProject(id, spaceUrl);
        };
    }
}

/* ================= DETAILS PANEL (OOTB STYLE) ================= */

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

                var p = res.data || {};

                document.getElementById("detailPanel").innerHTML =

                    '<div class="ootb-title">Details</div>' +

                    '<div class="row"><div class="label">Type</div><div class="value">Project</div></div>' +
                    '<div class="row"><div class="label">Title</div><div class="value">' + (p.title || "-") + '</div></div>' +
                    '<div class="row"><div class="label">Description</div><div class="value">' + (p.description || "-") + '</div></div>' +
                    '<div class="row"><div class="label">Maturity State</div><div class="value">' + (p.state || "-") + '</div></div>' +
                    '<div class="row"><div class="label">Owner</div><div class="value">' + (p.owner || "-") + '</div></div>' +

                    '<div class="footer">' +
                        '<button onclick="closePanel()">Close</button>' +
                    '</div>';
            },

            onFailure: function () {
                document.getElementById("detailPanel").innerHTML =
                    "<span style='color:red'>Failed to load details</span>";
            }
        });
    });
}

/* ================= CLOSE ================= */

function closePanel() {
    document.getElementById("detailPanel").innerHTML =
        '<div class="empty">Select a project</div>';
}
