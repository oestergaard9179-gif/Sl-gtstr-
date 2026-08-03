const API_URL = "https://script.google.com/macros/s/AKfycbywgVzZU2eg6lxAP7-EIDQPGBbJp-Jl9CdpFMpVMuf7fRApj9r1WI55YnTbPkbn6e0yig/exec";

let MAX_GEN = parseInt(document.getElementById("gen-select").value);
let stamtraeData = {};
let headersRow = [];
let sessionProbandTrueId = 1;
let currentViewRootTrueId = 1;
let searchTimeout = null; // Defined here for global access

document.getElementById("gen-select").addEventListener("change", (e) => {
    MAX_GEN = parseInt(e.target.value);
    TegnTrae();
});

function opdaterProbandLabel() {
    let navn = "Fælles Børn";
    if (stamtraeData[sessionProbandTrueId] && stamtraeData[sessionProbandTrueId].navn.text) {
        navn = stamtraeData[sessionProbandTrueId].navn.text;
    }
    document.getElementById("proband-label").innerHTML = `Udgangspunkt: <strong style="color:var(--accent-gold);">${navn}</strong>`;
    document.getElementById("title-name").innerText = navn;
}

async function hentData() {
    try {
        const response = await fetch(API_URL);
        const json = await response.json();

        headersRow = json.headers;
        stamtraeData = {};

        json.personer.forEach(p => {
            let id = parseInt(p.row[0]);
            if (!isNaN(id)) {
                let personObj = { id: id, rawRow: p.row, ft: {} };
                formFields.forEach(f => { personObj[f.id] = ParseData(p.row[f.col]); });
                censusYears.forEach(aar => { personObj.ft[aar] = ParseData(p.ft[aar]); });
                stamtraeData[id] = personObj;
            }
        });

        document.getElementById("loading").style.display = "none";
        document.getElementById("tree-container").style.display = "flex";
        TegnTrae();
    } catch (error) {
        document.getElementById("loading").innerText = "Fejl: Forbindelse til databasen fejlede.";
    }
}

function TegnTrae() {
    opdaterProbandLabel();
    const container = document.getElementById("tree-container");
    container.innerHTML = "";
    container.appendChild(SkabGren(currentViewRootTrueId, 1));
    translateX = 0; translateY = -100; scale = 1; updateTransform();
}

function SkabGren(trueId, currentGen) {
    const wrapper = document.createElement("div");
    wrapper.className = "node-wrapper";

    const person = stamtraeData[trueId];
    const displayId = getDisplayId(trueId, sessionProbandTrueId);

    const harNavn = person && person.navn && person.navn.text && person.navn.text.trim() !== "";

    if (harNavn) {
        const card = document.createElement("div");
        card.className = `person-card ${(displayId === 1 || displayId % 2 === 0) ? 'male' : 'female'}`;

        let avatarHTML = person.billede.text ? `<div class="avatar-circle"><img src="${person.billede.text}"></div>` : `<div class="avatar-circle">👤</div>`;

        let dateString = "";
        if (person.foedt.text || person.doed.text) {
            let fAar = person.foedt.text.includes("/") ? person.foedt.text.split("/")[2] : person.foedt.text;
            let dAar = person.doed.text.includes("/") ? person.doed.text.split("/")[2] : person.doed.text;
            dateString = `${fAar || "?"} - ${dAar || "?"}`;
        }

        let focusBtnHTML = `<button class="focus-btn" onclick="fokusIbund(event, ${trueId})" title="Sæt denne person i bunden af skærmen for at dykke ned i forfædrene">👇 Sæt i bund</button>`;

        card.innerHTML = `
            <div class="id-badge" title="Sandt ID i Sheets: ${trueId}">${displayId}</div>
            ${avatarHTML}
            <div class="card-info">
                <div class="name">${person.navn.text}</div>
                <div class="dates">${dateString}</div>
            </div>
            ${focusBtnHTML}
        `;
        card.onclick = () => aabenModal(trueId, displayId, false);
        wrapper.appendChild(card);
    } else {
        const addBtn = document.createElement("button");
        addBtn.className = "add-parent-btn";
        addBtn.innerHTML = `+ Tilføj ${displayId % 2 === 0 ? 'Far' : 'Mor'} (Nr. ${displayId})`;
        addBtn.onclick = () => aabenModal(trueId, displayId, true);
        wrapper.appendChild(addBtn);
        return wrapper;
    }

    if (currentGen < MAX_GEN) {
        const parentsContainer = document.createElement("div");
        parentsContainer.className = "parents-container";

        const leftBranch = document.createElement("div");
        leftBranch.className = "parent-branch left-branch";
        leftBranch.appendChild(SkabGren(trueId * 2, currentGen + 1));

        const rightBranch = document.createElement("div");
        rightBranch.className = "parent-branch right-branch";
        rightBranch.appendChild(SkabGren(trueId * 2 + 1, currentGen + 1));

        parentsContainer.appendChild(leftBranch);
        parentsContainer.appendChild(rightBranch);
        wrapper.appendChild(parentsContainer);
    }
    return wrapper;
}

hentData();
