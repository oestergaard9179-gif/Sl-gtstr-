const viewport = document.getElementById("viewport");
const treeContainer = document.getElementById("tree-container");
let scale = 1, isDragging = false, startX, startY, translateX = 0, translateY = -100;

// Variabler til 2-finger zoom
let initialPinchDistance = null;
let initialScale = 1;

function updateTransform() { treeContainer.style.transform = `translate(calc(-50% + ${translateX}px), ${translateY}px) scale(${scale})`; }

// Hjælpefunktion til afstand mellem fingre
function getPinchDistance(touches) {
    return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
}

// Mus
viewport.addEventListener("mousedown", (e) => {
    if (e.target.closest(".person-card") || e.target.closest(".add-parent-btn") || e.target.closest("#ui-controls")) return;
    isDragging = true; startX = e.clientX - translateX; startY = e.clientY - translateY;
});
window.addEventListener("mousemove", (e) => {
    if (!isDragging) return; translateX = e.clientX - startX; translateY = e.clientY - translateY; updateTransform();
});
window.addEventListener("mouseup", () => isDragging = false);
window.addEventListener("mouseleave", () => isDragging = false);

// Touch (Mobil/Tablet)
viewport.addEventListener("touchstart", (e) => {
    if (e.target.closest(".person-card") || e.target.closest(".add-parent-btn") || e.target.closest("#ui-controls")) return;

    if (e.touches.length === 1) {
        // Én finger: Træk rundt i træet
        isDragging = true;
        startX = e.touches[0].clientX - translateX;
        startY = e.touches[0].clientY - translateY;
    } else if (e.touches.length === 2) {
        // To fingre: Start pinch-zoom
        isDragging = false;
        initialPinchDistance = getPinchDistance(e.touches);
        initialScale = scale;
    }
});

window.addEventListener("touchmove", (e) => {
    if (e.touches.length === 1 && isDragging) {
        // Én finger: Flyt træet
        translateX = e.touches[0].clientX - startX;
        translateY = e.touches[0].clientY - startY;
        updateTransform();
    } else if (e.touches.length === 2 && initialPinchDistance) {
        // To fingre: Zoom ud/ind
        e.preventDefault(); // Forhindrer at skærmen hakker
        const currentDistance = getPinchDistance(e.touches);
        const zoomFactor = currentDistance / initialPinchDistance;
        scale = Math.min(Math.max(0.1, initialScale * zoomFactor), 3); // Max zoom grænser
        updateTransform();
    }
}, {passive: false});

window.addEventListener("touchend", (e) => {
    if (e.touches.length < 2) { initialPinchDistance = null; }
    if (e.touches.length === 1) {
        // Hvis man slipper den ene finger, kan man fortsætte med at trække med den anden
        startX = e.touches[0].clientX - translateX;
        startY = e.touches[0].clientY - translateY;
        isDragging = true;
    } else {
        isDragging = false;
    }
});

// Scroll/Hjul (Mus/Touchpad)
viewport.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { translateX -= e.deltaX; } else {
        scale += (e.deltaY < 0) ? 0.05 : -0.05; scale = Math.min(Math.max(0.1, scale), 3);
    }
    updateTransform();
}, { passive: false });

document.getElementById("zoom-in").onclick = () => { scale = Math.min(scale + 0.15, 3); updateTransform(); };
document.getElementById("zoom-out").onclick = () => { scale = Math.max(scale - 0.15, 0.1); updateTransform(); };

document.getElementById("btn-reset-proband").onclick = () => {
    currentViewRootTrueId = sessionProbandTrueId;
    translateX = 0; translateY = -100; scale = 1; // Nulstiller også pan/zoom
    TegnTrae();
};

document.getElementById("btn-home").onclick = () => {
    sessionProbandTrueId = 1;
    currentViewRootTrueId = 1;
    translateX = 0; translateY = -100; scale = 1; // Nulstiller også pan/zoom
    TegnTrae();
};

const themeToggleBtn = document.getElementById('theme-toggle');
let currentTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);
opdaterTemaKnap();

themeToggleBtn.addEventListener('click', () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    opdaterTemaKnap();
});

function opdaterTemaKnap() { themeToggleBtn.innerText = currentTheme === 'light' ? '🌙 Nat' : '☀️ Dag'; }
