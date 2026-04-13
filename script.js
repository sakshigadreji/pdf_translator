pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

const translateBtn = document.getElementById('translateBtn');
const readBtn = document.getElementById('readBtn');
const status = document.getElementById('status');
const loader = document.getElementById('loaderContainer');
const previewSection = document.getElementById('previewSection');
const textPreview = document.getElementById('textPreview');

let currentMode = '';
const worker = new Worker('translator-worker.js', { type: 'module' });

async function handleAction(mode) {
    const fileInput = document.getElementById('pdfFile');
    if (!fileInput.files[0]) return alert("Please select a PDF!");

    currentMode = mode;
    translateBtn.disabled = true;
    readBtn.disabled = true;
    loader.style.display = 'block';
    previewSection.style.display = 'none';
    status.innerText = "Analyzing PDF layout and formatting...";

    try {
        const arrayBuffer = await fileInput.files[0].arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        let pagesData = [];
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            
            // Background Image capture (for Layout preservation)
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext: context, viewport }).promise;
            const bgImg = canvas.toDataURL('image/jpeg', 0.7);

            const textContent = await page.getTextContent();
            let structuredText = "";
            let lastY = null;

            // Proper Line & Paragraph Detection
            for (const item of textContent.items) {
                let currentY = item.transform[5];
                if (lastY !== null) {
                    let yDiff = Math.abs(currentY - lastY);
                    if (yDiff > 12) structuredText += "\n"; // New Line
                    if (yDiff > 25) structuredText += "\n"; // New Paragraph
                }
                structuredText += item.str + " ";
                lastY = currentY;
            }

            pagesData.push({
                img: bgImg,
                text: structuredText,
                num: i
            });
            
            canvas.width = 0; canvas.height = 0; // RAM Cleanup
        }

        worker.postMessage({
            pages: pagesData,
            src: document.getElementById('srcLang').value,
            target: document.getElementById('targetLang').value
        });

    } catch (err) {
        status.innerText = "Error: " + err.message;
        translateBtn.disabled = false;
        readBtn.disabled = false;
        loader.style.display = 'none';
    }
}

translateBtn.addEventListener('click', () => handleAction('download'));
readBtn.addEventListener('click', () => handleAction('read'));

worker.onmessage = (e) => {
    if (e.data.type === 'status') {
        status.innerText = e.data.msg;
    } else if (e.data.type === 'done') {
        const results = e.data.results;

        if (currentMode === 'download') {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            results.forEach((res, i) => {
                if (i > 0) doc.addPage();
                doc.addImage(res.originalImg, 'JPEG', 0, 0, 210, 297);
                doc.setFontSize(9);
                doc.setTextColor(30, 30, 30);
                const splitLines = doc.splitTextToSize(res.translatedText, 180);
                doc.text(splitLines, 15, 25);
            });
            doc.save("Translated_Layout_Fixed.pdf");
        } else {
            textPreview.innerText = results.map(r => r.translatedText).join("\n\n--- Page Break ---\n\n");
            previewSection.style.display = 'block';
            previewSection.scrollIntoView({ behavior: 'smooth' });
        }

        status.innerText = "Success! Processing Complete.";
        translateBtn.disabled = false;
        readBtn.disabled = false;
        loader.style.display = 'none';
    }
};