import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0';

let translator;

self.onmessage = async (e) => {
    const { pages, src, target } = e.data;

    try {
        if (!translator) {
            self.postMessage({ type: 'status', msg: 'Loading AI Model (Approx 600MB)...' });
            translator = await pipeline('translation', 'Xenova/nllb-200-distilled-600M');
        }

        let finalResults = [];
        for (let pageData of pages) {
            self.postMessage({ type: 'status', msg: `Translating Page ${pageData.num}...` });

            // Line by line translation to keep paragraphs intact
            const lines = pageData.text.split('\n');
            let translatedLines = [];

            for (let line of lines) {
                if (line.trim().length > 3) {
                    const output = await translator(line, {
                        tgt_lang: target,
                        src_lang: src
                    });
                    translatedLines.push(output[0].translation_text);
                } else {
                    translatedLines.push(line); // Keep empty lines or short marks
                }
            }

            finalResults.push({
                originalImg: pageData.img,
                translatedText: translatedLines.join('\n')
            });
        }

        self.postMessage({ type: 'done', results: finalResults });

    } catch (err) {
        self.postMessage({ type: 'status', msg: 'Worker Error: ' + err.message });
    }
};
