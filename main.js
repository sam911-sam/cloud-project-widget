function initializeWidget() {
console.log("Widget initialized");

var createBtn = document.getElementById("createBtn");

if (!createBtn) {
    console.error("Create button not found");
    return;
}

createBtn.addEventListener("click", function () {

    var projectName =
        document.getElementById("projectName").value;

    var description =
        document.getElementById("description").value;

    var result =
        document.getElementById("result");

    if (!projectName) {

        result.style.display = "block";
        result.className = "result error";

        result.innerHTML =
            "<strong>Error:</strong> Project Name is required.";

        return;
    }

    result.style.display = "block";
    result.className = "result success";

    result.innerHTML =
        "<h3>Project Created</h3>" +
        "<p><strong>Project Name:</strong> " +
        projectName +
        "</p>" +
        "<p><strong>Description:</strong> " +
        description +
        "</p>";

    if (typeof widget !== "undefined") {
        widget.setTitle(projectName);
    }
});

}
