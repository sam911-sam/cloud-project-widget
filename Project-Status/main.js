var projectData = [];

(function () {

    function init() {

        if (typeof widget === "undefined") {
            setTimeout(init, 300);
            return;
        }

        widget.addEvent("onLoad", function () {

            widget.body.innerHTML =

                '<div class="header">Project Status</div>' +

                '<div id="container" class="container-full">' +

                    '<div id="leftPanel" class="left-panel-full">' +
                        '<div id="tableContainer">Loading projects...</div>' +
                    '</div>' +

                    '<div id="detailPanel" class="right-panel" style="display:none;"></div>' +

                '</div>';

            loadProjects();
        });
    }

    init();

})();

/* ================= LOAD PROJECTS ================= */

function loadProjects() {

    require(
        [
            "DS/WAFData/WAFData",
            "DS/i3DXCompassServices/i3DXCompassServices"
        ],
        function (
            WAFData,
            CompassServices
        ) {

            CompassServices.getPlatformServices({

                platformId:
                    widget.getValue("x3dPlatformId"),

                onComplete: function (services) {

                    var spaceUrl =
                        services["3DSpace"];

                    var url =
                        spaceUrl +
                        "/resources/v1/modeler/projects";

                    WAFData.authenticatedRequest(url, {

                        method: "GET",

                        type: "json",

                        headers: {
                            "Accept": "application/json"
                        },

                        onComplete: function (response) {

                            projectData =
                                response.data || [];

                            console.log("Projects:", projectData);

                            renderTable(projectData);
                        },

                        onFailure: function (error) {

                            console.log(error);

                            document.getElementById(
                                "tableContainer"
                            ).innerHTML =
                                "<span style='color:red'>Failed to load projects</span>";
                        }
                    });
                }
            });
        }
    );
}

/* ================= TABLE ================= */

function renderTable(data) {

    if (!data.length) {

        document.getElementById(
            "tableContainer"
        ).innerHTML =
            "No Projects Found";

        return;
    }

    var html =
        '<table class="table">' +
            '<tr>' +
                '<th>Project</th>' +
                '<th>Status</th>' +
            '</tr>';

    for (var i = 0; i < data.length; i++) {

        var p =
            data[i].dataelements || {};

        html +=

            '<tr>' +

                '<td>' +
                    '<a href="#" class="project-link" data-index="' + i + '">' +
                        (p.title || p.name || "Unnamed Project") +
                    '</a>' +
                '</td>' +

                '<td>' +
                    (p.state || "-") +
                '</td>' +

            '</tr>';
    }

    html += '</table>';

    document.getElementById(
        "tableContainer"
    ).innerHTML =
        html;

    attachClick();
}

/* ================= CLICK ================= */

function attachClick() {

    var links =
        document.getElementsByClassName(
            "project-link"
        );

    for (var i = 0; i < links.length; i++) {

        links[i].onclick = function (e) {

            e.preventDefault();

            var index =
                this.getAttribute(
                    "data-index"
                );

            showProjectDetails(index);
        };
    }
}

/* ================= DETAILS ================= */

function showProjectDetails(index) {

    var project =
        projectData[index];

    if (!project) {
        return;
    }

    var p =
        project.dataelements || {};

    document.getElementById(
        "container"
    ).className =
        "container-split";

    document.getElementById(
        "leftPanel"
    ).className =
        "left-panel";

    document.getElementById(
        "detailPanel"
    ).style.display =
        "block";

    document.getElementById(
        "detailPanel"
    ).innerHTML =

        '<div class="ootb-title">Details</div>' +

        '<div class="row">' +
            '<div class="label">Type</div>' +
            '<div class="value">' +
                (p.objType || project.type || "-") +
            '</div>' +
        '</div>' +

        '<div class="row">' +
            '<div class="label">Title</div>' +
            '<div class="value">' +
                (p.title || "-") +
            '</div>' +
        '</div>' +

        '<div class="row">' +
            '<div class="label">Name</div>' +
            '<div class="value">' +
                (p.name || "-") +
            '</div>' +
        '</div>' +

        '<div class="row">' +
            '<div class="label">Description</div>' +
            '<div class="value">' +
                (p.description || "-") +
            '</div>' +
        '</div>' +

        '<div class="row">' +
            '<div class="label">Maturity State</div>' +
            '<div class="value">' +
                (p.state || "-") +
            '</div>' +
        '</div>' +

        '<div class="footer">' +
            '<button onclick="closePanel()">Close</button>' +
        '</div>';
}

/* ================= CLOSE ================= */

function closePanel() {

    document.getElementById(
        "detailPanel"
    ).style.display =
        "none";

    document.getElementById(
        "container"
    ).className =
        "container-full";

    document.getElementById(
        "leftPanel"
    ).className =
        "left-panel-full";
}
