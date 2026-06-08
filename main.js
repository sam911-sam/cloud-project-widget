console.log("SCRIPT RUNNING");

document
    .getElementById("createBtn")
    .addEventListener("click", function () {

        const projectName =
            document.getElementById("projectName").value;

        const description =
            document.getElementById("description").value;

        const result =
            document.getElementById("result");

        result.style.display = "block";

        result.innerHTML = `
            <h3>Project Created</h3>
            <p><strong>Project Name:</strong> ${projectName}</p>
            <p><strong>Description:</strong> ${description}</p>
        `;
    });
