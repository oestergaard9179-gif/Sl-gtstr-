let currentEditingTrueId = null;
const modal = document.getElementById('modal-overlay');
let formIsDirty = false;

document.getElementById("upload-billede").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const MAX_WIDTH = 200; // Max bredde for profilbilledet
                const scaleFactor = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleFactor;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                document.getElementById("val-billede").value = canvas.toDataURL("image/jpeg", 0.7); // Gem som Base64 JPEG, kvalitet 70%
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

const formFields = [
    { id: 'navn', label: 'Navn', col: 1, textOnly: true }, { id: 'foedt', label: 'Født', col: 2, textOnly: true }, { id: 'sted', label: 'Fødested', col: 3, textOnly: true },
    { id: 'doebt', label: 'Døbt', col: 4 }, { id: 'konf', label: 'Konfirmeret', col: 5 }, { id: 'doed', label: 'Død', col: 6, textOnly: true },
    { id: 'begr_sted', label: 'Begravet', col: 7 }, { id: 'begr_dato', label: 'Dato Begravelse', col: 8, textOnly: true }, { id: 'laegd', label: 'Lægdsrulle', col: 9 },
    { id: 'soldat', label: 'Soldat', col: 10 }, { id: 'gift1', label: 'Vielse 1', col: 11 }, { id: 'gift2', label: 'Vielse 2', col: 12 },
    { id: 'gift3', label: 'Vielse 3', col: 13 }, { id: 'skoede', label: 'Skøde/Fæste', col: 14 }, { id: 'erhverv', label: 'Erhverv', col: 15 },
    { id: 'brand', label: 'Brandforsikring', col: 16 }, { id: 'borger', label: 'Borgerskab', col: 17 }, { id: 'kald', label: 'Udnævn/Kald', col: 18 },
    { id: 'aftaegt', label: 'Aftægt', col: 19 }, /* { id: 'bemaerk', label: 'Bemærkninger', col: 20 }, */ { id: 'billede', label: 'Profilbillede', col: 21, textOnly: true }
];
// Bemærkninger håndteres dynamisk, ikke via formFields arrayet

const censusYears = ['1940', '1930', '1925', '1921', '1916', '1911', '1906', '1901', '1895', '1890', '1880', '1870', '1860', '1855', '1850', '1845', '1840', '1835', '1834', '1801', '1787'];

function initCensusDOM() {
    const container = document.getElementById('census-grid');
    censusYears.forEach(aar => {
        const group = document.createElement('div');
        group.className = 'input-group';
        group.innerHTML = `<label>År ${aar}</label><div class="input-row"><input type="text" id="ft-val-${aar}"><input type="url" id="ft-link-${aar}" placeholder="🔗 Link"></div>`;
        container.appendChild(group);
    });
}
initCensusDOM();


function aabenModal(trueId, displayId, isNew = false) {
    currentEditingTrueId = trueId;
    document.getElementById('display-vid').innerText = displayId;
    document.getElementById('display-tid').innerText = `(Sandt ID i Sheets: ${trueId})`;

    const p = stamtraeData[trueId] || { ft: {} };

    formFields.forEach(f => {
        const data = p[f.id] || {text: "", link: ""};
        document.getElementById(`val-${f.id}`).value = data.text;
        if(!f.textOnly) document.getElementById(`link-${f.id}`).value = data.link;
    });
    censusYears.forEach(aar => {
        const data = p.ft[aar] || {text: "", link: ""};
        document.getElementById(`ft-val-${aar}`).value = data.text;
        document.getElementById(`ft-link-${aar}`).value = data.link;
    });

    document.getElementById('view-name').innerText = p.navn?.text || (isNew ? 'Ny Profil' : 'Navnløs');
    let avatarSrc = p.billede?.text ? `<img src="${p.billede.text}">` : `👤`;
    document.getElementById('view-avatar').innerHTML = avatarSrc;

    let dateString = "";
    if (p.foedt?.text || p.doed?.text) { dateString = `${p.foedt?.text || '?'} - ${p.doed?.text || '?'}`; }
    document.getElementById('view-dates').innerText = dateString;

    let listHTML = "";
    formFields.forEach(f => {
        if (f.id === 'navn' || f.id === 'billede') return;
        const data = p[f.id];
        if (data && (data.text || data.link)) {
            let val = data.text || '';
            let linkHtml = data.link ? `<a href="${data.link}" target="_blank">🔗 Kilde</a>` : '';
            listHTML += `<div class="data-row"><div class="data-label">${f.label}</div><div class="data-value"><span>${val}</span> ${linkHtml}</div></div>`;
        }
    });

    censusYears.forEach(aar => {
        const data = p.ft[aar];
        if (data && (data.text || data.link)) {
            let val = data.text || '';
            let linkHtml = data.link ? `<a href="${data.link}" target="_blank">🔗 Kilde</a>` : '';
            listHTML += `<div class="data-row"><div class="data-label">FT ${aar}</div><div class="data-value"><span>${val}</span> ${linkHtml}</div></div>`;
        }
    });

    if (listHTML === "") {
        listHTML = `<div style="padding: 15px; color: var(--text-muted); font-style: italic; border: 1px dashed var(--line-color); border-radius: 6px;">Der er endnu ikke registreret nogle oplysninger om denne person.</div>`;
    }
    document.getElementById("view-data-list").innerHTML = listHTML;

    if (isNew || displayId === 1) {
        document.getElementById("set-proband-btn").style.display = "none";
    } else {
        document.getElementById("set-proband-btn").style.display = "block";
    }

    if (isNew) { skiftTilEdit(); } else { skiftTilView(); }

    modal.style.display = "flex";
}

// Lyt til ændringer i alle inputfelter inden for formularen
document.getElementById("person-form").addEventListener("input", (event) => {
    // Filtrer events fra remove-bemaerk-btn, da de ikke gør formularen dirty
    if (!event.target.classList.contains("remove-bemaerk-btn")) {
        formIsDirty = true;
    }
});

// Opdater close-modal og skiftTilView for at tjekke for ugemte ændringer
document.getElementById("close-modal").onclick = () => {
    if (formIsDirty) {
        if (confirm("Du har ugemte ændringer. Er du sikker på, at du vil lukke?")) {
            modal.style.display = "none";
            formIsDirty = false; // Nulstil efter lukning
        }
    } else {
        modal.style.display = "none";
    }
};

function skiftTilEdit() {
    document.getElementById("view-mode").style.display = "none";
    document.getElementById("edit-mode").style.display = "block";
    formIsDirty = false; // Nulstil dirty state, når vi åbner i edit mode
}

function skiftTilView() {
    if (formIsDirty) {
        if (confirm("Du har ugemte ændringer. Er du sikker på, at du vil annullere?")) {
            document.getElementById("edit-mode").style.display = "none";
            document.getElementById("view-mode").style.display = "block";
            formIsDirty = false; // Nulstil efter annullering
        } else {
            // Hvis brugeren vælger ikke at annullere, forbliver vi i edit-mode
            return;
        }
    } else {
        document.getElementById("edit-mode").style.display = "none";
        document.getElementById("view-mode").style.display = "block";
    }
}

document.getElementById("save-btn").addEventListener("click", async () => {
    const btn = document.getElementById("save-btn");
    btn.innerText = "Gemmer...";
    btn.disabled = true; // Deaktiver knap under gemning
    
    const payload = { nr: currentEditingTrueId, ft: {} };

    formFields.forEach(f => {
        const text = document.getElementById(`val-${f.id}`).value;
        if (f.textOnly) { payload[f.id] = text; } else {
            const link = document.getElementById(`link-${f.id}`).value;
            payload[f.id] = (link !== "") ? `${text}||${link}` : text;
        }
    });

    // Håndtering af dynamiske bemærkninger ved gemning
    const bemaerkInputs = document.querySelectorAll("#bemaerk-list .input-row");
    let bemaerkninger = [];
    bemaerkInputs.forEach(row => {
        const textInput = row.querySelector("input[type=\"text\"]");
        const linkInput = row.querySelector("input[type=\"url\"]");
        const text = textInput ? textInput.value : "";
        const link = linkInput ? linkInput.value : "";
        if (text || link) {
            bemaerkninger.push(link ? `${text}||${link}` : text);
        }
    });
    payload.bemaerk = bemaerkninger.join(";;"); // Gemmer alle bemærkninger som en enkelt streng med separator

    censusYears.forEach(aar => {
        const text = document.getElementById(`ft-val-${aar}`).value;
        const link = document.getElementById(`ft-link-${aar}`).value;
        if(text || link) { payload.ft[aar] = (link !== "") ? `${text}||${link}` : text; }
    });

    try {
        await fetch(API_URL, { method: "POST", body: JSON.stringify(payload) });
        modal.style.display = "none";
        document.getElementById("loading").style.display = "block";
        document.getElementById("tree-container").style.display = "none";
        hentData();
    } catch (error) {
        alert("Fejl ved gemning!");
    } finally {
        btn.innerText = "💾 Gem ændringer";
        btn.disabled = false; // Genaktiver knap
    }
});

function addBemærkningInput(text = "", link = "") {
    const container = document.getElementById("bemaerk-list");
    const newBemDiv = document.createElement("div");
    newBemDiv.className = "input-group";
    newBemDiv.innerHTML = `
        <label>Bemærkning</label>
        <div class="input-row">
            <input type="text" value="${text}" placeholder="Generelle noter...">
            <input type="url" value="${link}" placeholder="🔗 Link">
            <button type="button" class="btn-secondary remove-bemaerk-btn" onclick="this.closest(\".input-group\").remove()" title="Fjern bemærkning" style="flex: 0 0 auto; width: 30px; padding: 0; margin-left: 5px;">&times;</button>
        </div>
    `;
    container.appendChild(newBemDiv);
}

// Tilføj styling til fjern bemærkning knappen
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
    .remove-bemaerk-btn {
        background: var(--btn-bg);
        color: var(--text-muted);
        border: 1px solid var(--card-border);
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.2s;
    }
    .remove-bemaerk-btn:hover {
        background: #ef4444;
        color: white;
        border-color: #dc2626;
    }
`, styleSheet.cssRules.length);


document.getElementById("search-input").addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.toLowerCase();
    const searchResultsContainer = document.getElementById("search-results");
    searchResultsContainer.innerHTML = "";

    if (query.length < 2) {
        searchResultsContainer.style.display = "none";
        return;
    }

    const matches = Object.values(stamtraeData).filter(p => p.navn.text.toLowerCase().includes(query));

    if (matches.length > 0) {
        matches.slice(0, 10).forEach(p => {
            const resultItem = document.createElement("div");
            resultItem.className = "search-result-item";
            resultItem.innerText = p.navn.text;
            resultItem.onclick = () => {
                currentViewRootTrueId = p.id;
                TegnTrae();
                searchResultsContainer.style.display = "none";
                document.getElementById("search-input").value = "";
            };
            searchResultsContainer.appendChild(resultItem);
        });
        searchResultsContainer.style.display = "block";
    } else {
        searchResultsContainer.style.display = "none";
    }
});

document.addEventListener("click", (e) => {
    if (!e.target.closest("#search-results") && !e.target.closest("#search-input")) {
        document.getElementById("search-results").style.display = "none";
    }
});

function setSomProband() {
    sessionProbandTrueId = currentEditingTrueId;
    currentViewRootTrueId = currentEditingTrueId;
    modal.style.display = "none";
    TegnTrae();
}

function fokusIbund(event, trueId) {
    event.stopPropagation();
    currentViewRootTrueId = trueId;
    TegnTrae();
}


