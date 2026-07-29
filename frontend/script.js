// ---------- filename label ----------
const fileInput = document.getElementById("pdf");
const fileLabel = document.getElementById("file-label");
fileInput.addEventListener("change", () => {
    fileLabel.textContent = fileInput.files[0] ? fileInput.files[0].name : "Choose PDF resume";
});

// ---------- tiny markdown -> HTML renderer (headings, bold, lists, tables, hr) ----------
function renderMarkdown(md) {
    if (!md) return "";

    const escapeHtml = (s) => s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const inline = (s) => escapeHtml(s)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/`([^`]+)`/g, "<code>$1</code>");

    const lines = md.replace(/\r\n/g, "\n").split("\n");
    let html = "";
    let i = 0;
    let inList = null; // 'ul' | 'ol'

    const closeList = () => {
        if (inList) { html += `</${inList}>`; inList = null; }
    };

    while (i < lines.length) {
        const line = lines[i];

        if (/^\s*$/.test(line)) { closeList(); i++; continue; }

        if (/^---+$/.test(line.trim())) { closeList(); html += "<hr>"; i++; continue; }

        const h = line.match(/^(#{1,3})\s+(.*)$/);
        if (h) {
            closeList();
            const level = h[1].length;
            html += `<h${level}>${inline(h[2])}</h${level}>`;
            i++; continue;
        }

        // table block
        if (line.trim().startsWith("|") && lines[i + 1] && /^\s*\|?[\s:-]+\|/.test(lines[i + 1])) {
            closeList();
            const headerCells = line.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim());
            let body = "";
            let j = i + 2;
            while (j < lines.length && lines[j].trim().startsWith("|")) {
                const cells = lines[j].trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim());
                body += "<tr>" + cells.map(c => `<td>${inline(c)}</td>`).join("") + "</tr>";
                j++;
            }
            html += `<table><thead><tr>${headerCells.map(c => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table>`;
            i = j; continue;
        }

        const ol = line.match(/^\s*\d+\.\s+(.*)$/);
        const ul = line.match(/^\s*[-*]\s+(.*)$/);
        if (ol) {
            if (inList !== "ol") { closeList(); html += "<ol>"; inList = "ol"; }
            html += `<li>${inline(ol[1])}</li>`;
            i++; continue;
        }
        if (ul) {
            if (inList !== "ul") { closeList(); html += "<ul>"; inList = "ul"; }
            html += `<li>${inline(ul[1])}</li>`;
            i++; continue;
        }

        closeList();
        html += `<p>${inline(line)}</p>`;
        i++;
    }
    closeList();
    return html;
}

// ---------- verdict copy based on score ----------
function verdictFor(score) {
    if (score >= 80) return ["Strong match", "Ready to submit for most roles"];
    if (score >= 60) return ["Solid foundation", "A few gaps to close before applying"];
    if (score >= 40) return ["Needs work", "Several keyword and structure gaps"];
    return ["Early stage", "Significant rework recommended"];
}

// ---------- main handler ----------
document.getElementById("btn").addEventListener("click", async () => {

    const file = fileInput.files[0];
    const output = document.getElementById("output");

    if (!file) {
        alert("Select PDF");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    output.innerHTML = `<p class="status-line">Analyzing… (0s)</p>`;
    let seconds = 0;
    const tickId = setInterval(() => {
        seconds++;
        output.innerHTML = `<p class="status-line">Analyzing… (${seconds}s) — AI response time varies, usually 5–40s</p>`;
    }, 1000);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 70000);

        const res = await fetch("http://127.0.0.1:8000/upload", {
            method: "POST",
            body: formData,
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        clearInterval(tickId);

        const data = await res.json();
        console.log(data);

        const analysis = data.analysis;

        if (!analysis || analysis.status === "error") {
            output.innerHTML = `
                <div class="error-card">
                    <strong>Analysis failed.</strong> ${analysis ? analysis.message : "Unknown error."}
                </div>`;
            return;
        }

        const [verdictTitle, verdictSub] = verdictFor(analysis.ats_score);

        output.innerHTML = `
            <div class="report">

                <div class="score-block">
                    <div class="seal" style="--pct:${analysis.ats_score}">
                        <div class="seal-num">${analysis.ats_score}<span>/ 100</span></div>
                    </div>
                    <div class="score-meta">
                        <div class="score-label">ATS SCORE</div>
                        <div class="score-verdict">${verdictTitle}</div>
                        <div class="score-sub">${verdictSub}</div>
                    </div>
                </div>

                <div class="tag-group">
                    <h3>Skills found</h3>
                    <div class="tags">
                        ${analysis.skills.map(s => `<span class="tag">${s}</span>`).join("")}
                    </div>
                </div>

                <div class="tag-group">
                    <h3>Missing skills</h3>
                    <div class="tags">
                        ${analysis.missing_skills.map(s => `<span class="tag gap">${s}</span>`).join("")}
                    </div>
                </div>

                <div class="tag-group">
                    <h3>Suggestions</h3>
                    <ul class="suggestions">
                        ${analysis.suggestions.map(s => `<li>${s}</li>`).join("")}
                    </ul>
                </div>

                <div class="report-doc">
                    ${renderMarkdown(analysis.analysis_raw)}
                </div>

            </div>
        `;

    } catch (err) {
        clearInterval(tickId);
        if (err.name === "AbortError") {
            output.innerHTML = `<div class="error-card"><strong>Timed out.</strong> Backend took too long to respond — check the backend terminal logs.</div>`;
        } else {
            output.innerHTML = `<div class="error-card"><strong>Could not reach the backend.</strong> ${err.message}</div>`;
        }
        console.error(err);
    }
});
