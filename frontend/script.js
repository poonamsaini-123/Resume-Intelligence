const fileInput = document.getElementById("pdf");
const fileLabel = document.getElementById("file-label");
const output = document.getElementById("output");

fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
        fileLabel.textContent = fileInput.files[0].name;
    } else {
        fileLabel.textContent = "Choose PDF resume";
    }
});

// -------------------- Markdown Renderer --------------------

function renderMarkdown(md) {

    if (!md) return "";

    const escape = (text) =>
        text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

    const inline = (text) =>
        escape(text)
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/`([^`]+)`/g, "<code>$1</code>");

    const lines = md.split("\n");

    let html = "";

    let inList = false;

    for (let line of lines) {

        if (/^### /.test(line)) {
            if (inList) {
                html += "</ul>";
                inList = false;
            }
            html += `<h3>${inline(line.replace(/^### /, ""))}</h3>`;
            continue;
        }

        if (/^## /.test(line)) {
            if (inList) {
                html += "</ul>";
                inList = false;
            }
            html += `<h2>${inline(line.replace(/^## /, ""))}</h2>`;
            continue;
        }

        if (/^# /.test(line)) {
            if (inList) {
                html += "</ul>";
                inList = false;
            }
            html += `<h1>${inline(line.replace(/^# /, ""))}</h1>`;
            continue;
        }

        if (/^- /.test(line)) {

            if (!inList) {
                html += "<ul>";
                inList = true;
            }

            html += `<li>${inline(line.replace(/^- /, ""))}</li>`;

            continue;
        }

        if (line.trim() === "") {

            if (inList) {
                html += "</ul>";
                inList = false;
            }

            continue;
        }

        html += `<p>${inline(line)}</p>`;
    }

    if (inList) html += "</ul>";

    return html;
}

// -------------------- Verdict --------------------

function verdict(score) {

    if (score >= 90)
        return {
            title: "Excellent ATS Match",
            sub: "Ready for AI/ML Internship",
            stars: "★★★★★"
        };

    if (score >= 75)
        return {
            title: "Strong Resume",
            sub: "Ready for most internship roles",
            stars: "★★★★☆"
        };

    if (score >= 60)
        return {
            title: "Good Resume",
            sub: "Needs a few improvements",
            stars: "★★★☆☆"
        };

    return {
        title: "Needs Improvement",
        sub: "Strengthen resume before applying",
        stars: "★★☆☆☆"
    };
}

// -------------------- Analyze --------------------

document.getElementById("btn").addEventListener("click", async () => {

    const file = fileInput.files[0];

    if (!file) {
        alert("Please choose a PDF.");
        return;
    }

    const formData = new FormData();

    formData.append("file", file);

    output.innerHTML =

        `<p class="status-line">
        Analyzing Resume...
        </p>`;

    try {

        const response = await fetch("http://127.0.0.1:8000/upload", {

            method: "POST",

            body: formData

        });

        const data = await response.json();

        const analysis = data.analysis;

        if (!analysis) {

            output.innerHTML =
                `<div class="error-card">
                    Analysis failed.
                </div>`;

            return;
        }

        const result = verdict(analysis.ats_score);

        output.innerHTML = `

<div class="report">

<div class="score-block">

<div class="seal" style="--pct:${analysis.ats_score}">
<div class="seal-num">
${analysis.ats_score}
<span>/100</span>
</div>
</div>

<div class="score-meta">

<div class="score-label">
ATS SCORE
</div>

<div class="score-verdict">
${result.title}
</div>

<div class="score-sub">
${result.sub}
</div>

</div>

</div>

<div class="stats-grid">

<div class="stat">
<h4>${analysis.skills.length}</h4>
<p>Skills</p>
</div>

<div class="stat">
<h4>${analysis.missing_skills.length}</h4>
<p>Missing</p>
</div>

<div class="stat">
<h4>${analysis.suggestions.length}</h4>
<p>Suggestions</p>
</div>

<div class="stat">
<h4>${analysis.ats_score}%</h4>
<p>ATS</p>
</div>

</div>

<div class="tag-group">

<h3>Skills Found</h3>

<div class="tags">

${analysis.skills.map(skill =>
`<span class="tag">${skill}</span>`).join("")}

</div>

</div>

<div class="tag-group">

<h3>Missing Skills</h3>

<div class="tags">

${analysis.missing_skills.map(skill =>
`<span class="tag gap">${skill}</span>`).join("")}

</div>

</div>

<div class="tag-group">

<h3>Suggestions</h3>

<ul class="suggestions">

${analysis.suggestions.map(item =>
`<li>${item}</li>`).join("")}

</ul>

</div>

<div class="report-actions">

<button id="downloadPDF" class="btn-primary">
Download Report
</button>

</div>

<details class="report-section" open>

<summary>
Detailed Resume Analysis
</summary>

<div class="report-doc">

${renderMarkdown(analysis.analysis_raw)}

</div>

</details>

<div class="summary-card">

<div class="summary-header">

<h2>
Overall Recommendation
</h2>

<div class="stars">
${result.stars}
</div>

</div>

<div class="summary-status">

<h3>
${result.title}
</h3>

<p>
${result.sub}
</p>

</div>

<div class="best-for">

<h4>
Best Suited For
</h4>

<div class="role-tags">

<span>AI/ML Intern</span>

<span>Backend Intern</span>

<span>Data Analyst</span>

</div>

</div>

</div>

</div>
`;

        document
            .getElementById("downloadPDF")
            .addEventListener("click", () => {

                window.print();

            });

    } catch (err) {

        output.innerHTML =

            `<div class="error-card">

Unable to connect to backend.

</div>`;

        console.error(err);
    }

});