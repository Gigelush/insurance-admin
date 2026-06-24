import { NextResponse } from 'next/server';
import { getClaims, updateClaim, getSystemSettings, getPolicies } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const claims = getClaims();
        const claim = claims.find((c: any) => c.id === id);

        if (!claim) {
            return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
        }

        // Return saved opinion if it exists
        return NextResponse.json(claim.details?.opinius || null);
    } catch (e) {
        console.error("GET opinia error:", e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const claims = getClaims();
        const claim = claims.find((c: any) => c.id === id);

        if (!claim) {
            return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
        }

        const policies = getPolicies();
        const policy = policies.find((p: any) => p.id === claim.policyId);

        const settings = getSystemSettings();
        const apiKey = settings.geminiApiKey;
        const policyPdf = settings.policyConditions; // { name, type, content: "data:application/pdf;base64,..." }

        let responseJson: any = null;

        const trimmedKey = apiKey ? apiKey.trim() : "";
        if (trimmedKey && (trimmedKey.startsWith("AIzaSy") || trimmedKey.startsWith("AQ."))) {
            // Real Gemini API Call!
            try {
                const parts: any[] = [];

                // 1. Add PDF policy conditions if present
                if (policyPdf && policyPdf.content) {
                    const base64Data = policyPdf.content.split(',')[1];
                    parts.push({
                        inlineData: {
                            mimeType: "application/pdf",
                            data: base64Data
                        }
                    });
                    parts.push({
                        text: `Fișierul atașat anterior reprezintă Condițiile de Asigurare oficiale (contractul).`
                    });
                }

                // 2. Add claim images (up to 3, max 1.5MB each, to avoid Gemini token overflow)
                const claimPhotos = claim.files?.filter((f: any) => f.category === 'photo' || (!f.category && f.type.startsWith('image/'))) || [];
                const claimDocs = claim.files?.filter((f: any) => f.category === 'document' || (!f.category && !f.type.startsWith('image/'))) || [];

                const MAX_IMAGE_SIZE_BYTES = 1.5 * 1024 * 1024; // 1.5MB per image
                let attachedPhotos = 0;
                for (const photo of claimPhotos) {
                    if (attachedPhotos >= 3) break;
                    if (photo.content && photo.content.startsWith("data:")) {
                        const mime = photo.type || "image/jpeg";
                        const base64 = photo.content.split(',')[1];
                        if (base64) {
                            // Check size before sending (base64 → bytes approximation)
                            const approxSizeBytes = (base64.length * 3) / 4;
                            if (approxSizeBytes > MAX_IMAGE_SIZE_BYTES) {
                                console.warn(`OPINIUS: Skipping large image "${photo.name}" (${(approxSizeBytes / 1024 / 1024).toFixed(1)}MB > 1.5MB limit)`);
                                continue;
                            }
                            parts.push({
                                inlineData: {
                                    mimeType: mime,
                                    data: base64
                                }
                            });
                            attachedPhotos++;
                        }
                    }
                }

                // 3. Add text instructions and claim details
                const claimTextContext = `
                Ești OPINIUS, un expert AI specialist în analiza dosarelor de daune pentru asigurări de locuințe.
                Sarcina ta este să evaluezi următorul dosar de daună și să compari evenimentul și pagubele cu Condițiile de Asigurare furnizate (în fișierul PDF atașat).

                 Detalii Dosar:
                - ID Dosar: ${claim.id}
                - Titular Poliță: ${claim.holderName}
                - Serie Poliță: ${claim.policyId}
                - Tip Daună: ${claim.type || "Daună Locuință"}
                - Data Producerii Daunei: ${claim.date || claim.submittedAt}
                - Descriere Daună: ${claim.description}
                - Valoare Rezervă: ${claim.reserve?.total || "0"} RON
                - Cauză declarată: ${claim.cause || "Necunoscută"}
                - Locație asigurată: ${claim.location || "Adresă din poliță"}

                Detalii Poliță Asigurat:
                - ID Poliță: ${policy ? policy.id : claim.policyId}
                - Tip Poliță: ${policy ? (policy.type || "Nespecificat") : "Nespecificat"}
                - Sumă Asigurată Clădire: ${policy?.details?.acoperiri_suma_asigurata || "Nespecificată"}
                - Sumă Asigurată Avarii Electronice/Electrocasnice (Riscuri Electrice): ${policy?.details?.acoperiri_avarii_suma || "0"}
                - Sumă Asigurată Conținut: ${policy?.details?.acoperiri_continut_suma || "0"}
                - Răspundere Civilă: ${policy?.details?.acoperiri_raspundere_suma || "0"}

                Fișiere atașate în dosar:
                - Fotografii trimise de asigurat: ${claimPhotos.length} poze
                - Documente trimise (declaratie, deviz etc): ${claimDocs.length} documente

                Te rog să analizezi tot acest context și să oferi un verdict clar. 
                Răspunde obligatoriu în limba română în următorul format JSON valid:
                {
                    "verdict": "DE PLATĂ" | "DE RESPINS" | "NECESITĂ INVESTIGAȚII",
                    "confidence": număr de la 0 la 100,
                    "summary": "Rezumat concis al argumentării deciziei (2-3 propoziții).",
                    "arguments": [
                        "Argumentul 1 referitor la cauza daunei raportat la poliță",
                        "Argumentul 2 referitor la pozele și dovezile vizuale din dosar",
                        "Argumentul 3 referitor la sumele estimate (rezerva)"
                    ],
                    "articles": [
                        "Articolul X Secțiunea Y din Condițiile de Asigurare (ex: riscul de inundație acoperit)",
                        "Articolul A Aliniatul B referitor la exclusivități (dacă se respinge)"
                    ],
                    "recommendations": [
                        "Recomandarea 1 pentru inspectorul de daune (ex: solicită raport asociație de proprietari)",
                        "Recomandarea 2 (ex: validarea plății sau trimiterea unui referat)"
                    ]
                }
                `;

                parts.push({ text: claimTextContext });

                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
                const geminiRes = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts }],
                        generationConfig: {
                            responseMimeType: "application/json"
                        }
                    })
                });

                if (geminiRes.ok) {
                    const geminiData = await geminiRes.json();
                    const textResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (textResponse) {
                        responseJson = JSON.parse(textResponse);
                    }
                } else {
                    const errText = await geminiRes.text();
                    console.error("Gemini API Error details:", errText);
                    throw new Error("Gemini API response failed: " + geminiRes.status);
                }
            } catch (apiErr) {
                console.error("API real Gemini a eșuat, trecem la fallback (demo):", apiErr);
            }
        }

        // Fallback or Demo Mode (Realistic simulation)
        if (!responseJson) {
            const desc = (claim.description || "").toLowerCase();
            const cause = (claim.cause || "").toLowerCase();

            let verdict = "DE PLATĂ";
            let confidence = 85;
            let summary = "";
            let argumentsList: string[] = [];
            let articles: string[] = [];
            let recommendations: string[] = [];

            if (desc.includes("inundatie") || desc.includes("inundație") || desc.includes("apă") || desc.includes("apa") || cause.includes("inundat")) {
                // Flood scenario
                if (desc.includes("vecin") || desc.includes("sus")) {
                    verdict = "NECESITĂ INVESTIGAȚII";
                    confidence = 75;
                    summary = "Dauna a fost provocată de o inundație provenită de la etajul superior (vecin). Evenimentul este acoperit, însă se impune deschiderea unui dosar de regres împotriva vecinului vinovat sau a asociației de proprietari.";
                    argumentsList = [
                        "Proprietatea asiguratului prezintă infiltrații masive de apă în plafonul băii și bucătăriei.",
                        "Fotografiile din dosar confirmă pete proaspete de umezeală și desprinderea vopselei lavabile.",
                        "Cauza inițială este o avarie la coloana comună sau la instalația vecinului de deasupra, nefiind o inundație naturală."
                    ];
                    articles = [
                        "Articolul 7.2 - Riscuri acoperite: Avarii ale instalațiilor de apă/canalizare din clădire.",
                        "Articolul 14.1 - Dreptul de Regres: Asigurătorul preia drepturile asiguratului împotriva terților responsabili de producerea daunei."
                    ];
                    recommendations = [
                        "Solicită asiguratului Procesul Verbal de Constatare semnat de Asociația de Proprietari.",
                        "Identifică datele de contact și polița de răspundere civilă (RCA/PAD/Facultativă) a vecinului de deasupra.",
                        "Generează dosarul de Regres din tab-ul dedicat după aprobarea plății inițiale."
                    ];
                } else {
                    verdict = "DE PLATĂ";
                    confidence = 90;
                    summary = "Avarie accidentală la instalația proprie de apă. Dauna este acoperită în totalitate conform clauzelor standard pentru daune la instalațiile interioare.";
                    argumentsList = [
                        "Conducta de alimentare cu apă de sub chiuvetă a cedat brusc (ruptură de racord flexibil).",
                        "Fotografiile arată parchetul umflat și deteriorarea mobilierului de bucătărie.",
                        "Nu sunt semne de neglijare sau uzură morală preexistentă gravă care să fi fost vizibilă anterior."
                    ];
                    articles = [
                        "Articolul 6.1 (c) - Avarii accidentale la instalațiile interioare de apă din proprietate."
                    ];
                    recommendations = [
                        "Aprobă devizul de reparații pentru refacerea parchetului și înlocuirea mobilierului afectat.",
                        "Valoarea propusă pentru rezervă (Materiale + Manoperă) este conformă cu prețurile pieței locale."
                    ];
                }
            } else if (desc.includes("uzura") || desc.includes("uzură") || desc.includes("vechime") || desc.includes("igrasie") || desc.includes("mucegai")) {
                // Wear and tear exclusions
                verdict = "DE RESPINS";
                confidence = 95;
                summary = "Evenimentul raportat nu reprezintă o daună accidentală acoperită, ci o degradare treptată în timp (uzură morală, lipsă de întreținere și igrasie cronică).";
                argumentsList = [
                    "Fotografiile indică prezența mucegaiului și a igrasiei pe colțurile pereților, fenomen apărut pe o perioadă lungă (luni/ani).",
                    "Nu s-a înregistrat niciun eveniment brusc și accidental (precum inundație sau spargere de conductă) care să declanșeze dauna.",
                    "Descrierea asiguratului menționează infiltrații lente din cauza izolației exterioare defectuoase a blocului."
                ];
                articles = [
                    "Articolul 12.4 (Excluderi) - Nu se acordă despăgubiri pentru pagube produse prin uzură normală, igrasie, condens, mucegai sau lipsă de întreținere a imobilului."
                ];
                recommendations = [
                    "Generează scrisoarea de respingere formală conform modelului din platformă.",
                    "Recomandă asiguratului să se adreseze asociației de proprietari pentru refacerea izolației exterioare a blocului."
                ];
            } else if (desc.includes("foc") || desc.includes("incendiu") || desc.includes("scurtcircuit")) {
                // Fire
                verdict = "DE PLATĂ";
                confidence = 92;
                summary = "Daună produsă de un scurtcircuit urmat de un început de incendiu la instalația electrică. Riscul este pe deplin acoperit de clauza de Incendiu/Explozie a poliței de asigurare.";
                argumentsList = [
                    "Cablajul electric din zona tabloului de siguranțe prezintă urme clare de carbonizare în imagini.",
                    "Peretele de rigips adiacent a fost distrus de fum și acțiunea focului.",
                    "Intervenția rapidă a asiguratului cu stingătorul a limitat extinderea daunei."
                ];
                articles = [
                    "Articolul 5.1 (a) - Riscuri de bază: Incendiu, trăsnet, explozie, căderea aparatelor de zbor.",
                    "Articolul 8.4 - Daune electrice generate de fenomene de inducție sau scurtcircuit."
                ];
                recommendations = [
                    "Solicită o copie după procesul verbal al pompierilor (ISU) dacă a fost cazul, sau o notă de constatare de la un electrician autorizat.",
                    "Aprobă refacerea rețelei electrice afectate și igienizarea camerei."
                ];
            } else if (desc.includes("prajitor") || desc.includes("pâine") || desc.includes("toaster") || desc.includes("electrocasnic") || desc.includes("televizor") || desc.includes("tv")) {
                // Check if policy has avarii electronice coverage
                const hasAvariiCoverage = policy && policy.details?.acoperiri_avarii_suma && parseFloat(policy.details.acoperiri_avarii_suma) > 0;
                
                if (hasAvariiCoverage) {
                    verdict = "NECESITĂ INVESTIGAȚII";
                    confidence = 80;
                    summary = `Defectarea aparatului electrocasnic este eligibilă pentru analiză sub clauza de 'Avarii Bunuri Electronice/Electrocasnice' activă pe polița clientului (Limita: ${policy.details.acoperiri_avarii_suma}). Este necesar să excludem defectele de uzură mecanică internă nesupusă riscurilor asigurate.`;
                    argumentsList = [
                        `Polița de asigurare activează opțiunea facultativă 'Avarii Bunuri Electronice' cu o sumă asigurată de ${policy.details.acoperiri_avarii_suma}.`,
                        "Raportul asiguratului descrie defectarea aparatului în condiții de uz casnic.",
                        "Dauna este acoperită doar dacă avaria provine dintr-un factor de supratensiune sau risc electric extern conform contractului."
                    ];
                    articles = [
                        "Articolul 8.4 - Daune electrice generate de fenomene de inducție, scurtcircuit sau supratensiune accidentală la aparatura electrocasnică."
                    ];
                    recommendations = [
                        "Solicită asiguratului dovada de diagnosticare de la un service autorizat care să certifice existența unui scurtcircuit / supratensiune.",
                        "Solicită devizul de reparație sau factura fiscală a bunului pentru calcularea corectă a despăgubirii."
                    ];
                } else {
                    verdict = "DE RESPINS";
                    confidence = 95;
                    summary = "Defectarea aparatului electrocasnic nu este acoperită. Polița de asigurare a clientului NU include clauza suplimentară pentru 'Avarii Bunuri Electronice/Electrocasnice' (suma asigurată pe această secțiune este zero sau absentă).";
                    argumentsList = [
                        "Aparatul electrocasnic nu este protejat prin polița actuală, nefiind contractată clauza facultativă de riscuri electrice.",
                        "Polițele obligatorii (PAD) sau facultative simple fără extra-opțiuni nu despăgubesc defectarea aparatelor casnice."
                    ];
                    articles = [
                        "Articolul 12.3 (Excluderi) - Sunt excluse daunele la aparate electronice/electrocasnice dacă nu s-a contractat în mod expres clauza adițională corespunzătoare."
                    ];
                    recommendations = [
                        "Pregătiți notificarea oficială de respingere a dosarului de daună.",
                        "Explicați clientului că riscurile electrice pentru aparatura electrocasnică necesită activarea clauzei suplimentare la emiterea poliței."
                    ];
                }
            } else {
                // Default generic fallback
                verdict = "NECESITĂ INVESTIGAȚII";
                confidence = 70;
                summary = "Sunt necesare detalii suplimentare pentru a determina cu certitudine dacă dauna este acoperită. Evenimentul raportat prezintă ambiguități contractuale.";
                argumentsList = [
                    "Descrierea daunei nu specifică în mod clar cauza exactă a producerii evenimentului.",
                    "Fotografiile arată avarii fizice, însă este neclar dacă acestea au fost provocate accidental sau provin dintr-o cauză exclusă.",
                    "Niciun deviz de reparație sau factură doveditoare nu a fost încărcată pentru analiză."
                ];
                articles = [
                    "Articolul 4 - Definiții contractuale privind accidentul și evenimentul asigurat."
                ];
                recommendations = [
                    "Solicită asiguratului o declarație suplimentară detaliată prin tabul de Chat.",
                    "Încurajează inspectorul să încarce fotografii de detaliu și/sau un deviz de estimare a pagubelor.",
                    "Nu aprobați rezervele de plată până când cauza nu este clarificată ca fiind un risc acoperit."
                ];
            }

            // Append warning that it is Demo Mode
            summary += " [Analiză locală efectuată de modulul expert OPINIUS - Mod Simulare]";

            responseJson = {
                verdict,
                confidence,
                summary,
                arguments: argumentsList,
                articles,
                recommendations,
                isDemo: true
            };
        }

        // 7. Save opinion to claim.details
        const currentDetails = claim.details || {};
        const updatedDetails = {
            ...currentDetails,
            opinius: {
                ...responseJson,
                analyzedAt: new Date().toISOString()
            }
        };

        const updatedClaim = updateClaim(id, { details: updatedDetails });

        return NextResponse.json(updatedDetails.opinius);
    } catch (e) {
        console.error("POST opinia error:", e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
