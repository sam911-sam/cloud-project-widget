require([
    "DS/WAFData/WAFData"
], function (WAFData) {

    document.getElementById("createBtn").addEventListener("click", function () {

        const projectName = document.getElementById("projectName").value;
        const description = document.getElementById("description").value;

        // 🔴 IMPORTANT: Get platform context
        const securityContext = widget.getValue("ctx"); // sometimes "ctx" or "SecurityContext"
        const csrfToken = widget.getValue("ENO_CSRF_TOKEN");

        // 🔵 API URL (replace with your real endpoint)
        const url = "/resources/v1/modeler/samples";

        // 🔵 Payload as per your API spec
        const payload = {
            data: [
                {
                    type: "string",
                    dataelements: {
                        name: projectName,
                        description: description
                    }
                }
            ]
        };

        WAFData.authenticatedRequest(url, {
            method: "POST",
            type: "json",

            headers: {
                "SecurityContext": securityContext,
                "ENO_CSRF_TOKEN": csrfToken,
                "Accept-Language": "en"
            },

            data: JSON.stringify(payload),

            onComplete: function (response) {
                console.log("SUCCESS:", response);

                document.getElementById("result").style.display = "block";
                document.getElementById("result").innerHTML =
                    "<b>Project Created Successfully</b><br>" +
                    "Name: " + projectName + "<br>" +
                    "Description: " + description;
            },

            onFailure: function (error) {
                console.error("FAILED:", error);
            }
        });

    });

});
