function getDisplayId(trueId, probandTrueId) {
    let t_bin = trueId.toString(2);
    let p_bin = probandTrueId.toString(2);
    if (t_bin.startsWith(p_bin)) { return parseInt("1" + t_bin.substring(p_bin.length), 2); }
    return null;
}

function getTrueId(displayId, probandTrueId) {
    let d_bin = displayId.toString(2);
    let p_bin = probandTrueId.toString(2);
    return parseInt(p_bin + d_bin.substring(1), 2);
}

function ParseData(rawStr) {
    if(!rawStr) return { text: "", link: "" };
    const parts = rawStr.split("||");
    return { text: parts[0] || "", link: parts[1] || "" };
}

function genererCSV() {
    let exportData = [];

    for (let t_id in stamtraeData) {
        let d_id = getDisplayId(parseInt(t_id), sessionProbandTrueId);

        if (d_id !== null) {
            let person = stamtraeData[t_id];
            let rowCopy = [...person.rawRow];
            rowCopy[0] = d_id;
            exportData.push(rowCopy);
        }
    }

    exportData.sort((a, b) => parseInt(a[0]) - parseInt(b[0]));

    let csvContent = headersRow.join(",") + "\n";
    exportData.forEach(rowArray => {
        let row = rowArray.map(col => {
            let str = String(col || "");
            str = str.replace(/"/g, '""');
            if (str.search(/(\"|,|\n)/g) >= 0) str = `\"${str}\"`;
            return str;
        });
        csvContent += row.join(",") + "\n";
    });

    let blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    let pNavn = stamtraeData[sessionProbandTrueId]?.navn.text.split(" ")[0] || "Ukendt";
    link.download = `Slaegtsgren_Fra_${pNavn}.csv`;
    link.click();
}