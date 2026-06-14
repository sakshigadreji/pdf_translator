import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0';

let translator;

// Language mapping
function mapLang(lang) {
    const map = {
        en: "eng_Latn",
        hi: "hin_Deva"
    };

    return map[lang] || lang;
}

// Stable Hindi cleanup (SAFE)
function cleanHindi(text) {
    return text
        .normalize("NFC")

        // zero width chars remove
        .replace(/[\u200B-\u200D\uFEFF]/g, "")

        // punctuation spacing
        .replace(/\s+([।,:;!?])/g, "$1")

        // multiple spaces
        .replace(/[ \t]{2,}/g, " ")

        .trim();
}

// Hindi word fixes
function fixHindiWords(text) {

    const fixes = {

        // real errors seen
        "जसिका": "जिसका",
        "जिसिका": "जिसका",
        "jasika": "जिसका",

        "नकिले": "निकाले",
        "निकले": "निकाले",
        "nkile": "निकाले",

        "तलिका": "तालिका",

        "कारयो": "कार्यों",

        "परविष्टी": "परविष्टि",
        "परविष्टी": "परविष्टि",

        "डेटाबेस मे": "डेटाबेस में",
        "संकेतको": "संकेतकों",

        "पराथमिक": "प्राथमिक",
        "गैर-पराथमिक": "गैर-प्राथमिक",

        "हैशी": "हैशिंग",
        "फंक्शन": "फ़ंक्शन",

        "कार्यो": "कार्यों",

        "जरीका": "जिसका",
        "जसके": "जिसके",
        "जसमें": "जिसमें",

        "निकलने": "निकालने",
        "निकलने के कार्यो": "निकालने के कार्यों",

        "तालकी": "तालिका",

        "कुंजी": "कुंजी",

        "वास्तविक डेटा के संकेतको": "वास्तविक डेटा के संकेतकों",

        "कार्यो": "कार्यों"
    };

    for (const wrong in fixes) {
        text = text.replaceAll(
            wrong,
            fixes[wrong]
        );
    }

    return text;
}

// Remove garbage text
function removeGarbage(text) {

    return text

        // ppppp
        .replace(/(?:p\s*){5,}/gi, "")

        // kkkkk
        .replace(/(?:k\s*){5,}/gi, "")

        // प प प प प
        .replace(/(?:प\s*){8,}/g, "")

        // repeated chars
        .replace(/(.)\1{12,}/g, "")

        .trim();
}

self.onmessage = async (e) => {

    const { pages, src, target } = e.data;

    try {

        if (!translator) {

            self.postMessage({
                type: "status",
                msg: "Loading AI Model..."
            });

            translator = await pipeline(
                "translation",
                "Xenova/nllb-200-distilled-600M",
                {
                    quantized: true
                }
            );
        }

        let finalResults = [];

        for (let pageData of pages) {

            self.postMessage({
                type: "status",
                msg: `Translating Page ${pageData.num}...`
            });

            // preserve original layout
            const lines = pageData.text.split('\n');

            const filteredLines =
                lines.filter(line => line.trim());

            let outputs = [];

            if (filteredLines.length > 0) {

                outputs = await translator(
                    filteredLines,
                    {
                        src_lang: mapLang(src),
                        tgt_lang: mapLang(target)
                    }
                );
            }

            let translatedLines = [];
            let index = 0;

            for (const line of lines) {

                if (!line.trim()) {

                    translatedLines.push("");
                    continue;
                }

                let translated =
                    outputs[index]?.translation_text || "";

                index++;

                translated =
                    cleanHindi(translated);

                translated =
                    fixHindiWords(translated);

                translated =
                    removeGarbage(translated);

                translatedLines.push(
                    translated
                );
            }

            // paragraph spacing control
            let finalText =
                translatedLines
                    .join('\n')
                    .replace(/\n{3,}/g, '\n\n');

            finalResults.push({
                num: pageData.num,
                translatedText: finalText
            });
        }

        self.postMessage({
            type: "done",
            results: finalResults
        });

    } catch (err) {

        self.postMessage({
            type: "status",
            msg: "Error: " + err.message
        });
    }
};
