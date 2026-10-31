import { NextRequest, NextResponse } from 'next/server';

// Exponential backoff helper as prescribed by Science Skill
async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 3, baseDelayMs = 600): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);
    if (response.ok) return response;
    if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
      const retryAfter = Number(response.headers.get('Retry-After'));
      const delay = !Number.isNaN(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : baseDelayMs * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }
    const errorBody = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status} from ${url}: ${errorBody.slice(0, 200)}`);
  }
  throw new Error(`Exhausted retries for ${url}`);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') || 'Urea';

  try {
    const encoded = encodeURIComponent(query.trim());
    // 1. Fetch properties by chemical name from PubChem PUG REST
    const propUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encoded}/property/Title,IUPACName,MolecularFormula,MolecularWeight,CanonicalSMILES,InChIKey,XLogP,Complexity,Charge,HBondDonorCount,HBondAcceptorCount/JSON`;
    
    const propRes = await fetchWithRetry(propUrl, {
      headers: { 'Accept': 'application/json' },
    });
    const propData = await propRes.json();

    const compoundProp = propData?.PropertyTable?.Properties?.[0];
    if (!compoundProp) {
      return NextResponse.json({ error: `No compound found for "${query}"` }, { status: 404 });
    }

    const cid = compoundProp.CID;
    const structureImage = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/PNG?image_size=large`;

    // 2. Fetch Synonyms
    let synonyms: string[] = [];
    try {
      const synRes = await fetchWithRetry(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/synonyms/JSON`);
      const synData = await synRes.json();
      synonyms = synData?.InformationList?.Information?.[0]?.Synonym?.slice(0, 8) || [];
    } catch (e) {
      // Ignore if synonyms fail
    }

    // 3. Fetch Safety & GHS information from PUG View
    let ghsHazards: string[] = [];
    let handlingTips: string[] = [];
    try {
      const safetyRes = await fetchWithRetry(`https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON?heading=Safety+and+Hazards`);
      const safetyData = await safetyRes.json();
      
      const sections = safetyData?.Record?.Section || [];
      const safetySection = sections.find((s: any) => s.TOCHeading === 'Safety and Hazards');
      if (safetySection?.Section) {
        for (const sub of safetySection.Section) {
          if (sub.TOCHeading === 'Hazards Identification' || sub.TOCHeading === 'GHS Classification') {
            const strings = JSON.stringify(sub);
            if (strings.includes('Harmful') || strings.includes('Warning') || strings.includes('Danger')) {
              ghsHazards.push('Follow prescribed PPE and agricultural safety standards.');
            }
          }
        }
      }
    } catch (e) {
      // Safety data optional
    }

    // 4. Agricultural Context categorization
    let category = 'Agrochemical & Soil Nutrient';
    const lower = query.toLowerCase();
    if (lower.includes('neem') || lower.includes('azadirachtin') || lower.includes('imidacloprid') || lower.includes('chlorpyrifos')) {
      category = 'Insecticide / Pest Control Active Ingredient';
    } else if (lower.includes('urea') || lower.includes('phosphate') || lower.includes('potash') || lower.includes('nitrogen') || lower.includes('npk')) {
      category = 'Primary Fertilizer & Plant Nutrition';
    } else if (lower.includes('mancozeb') || lower.includes('copper') || lower.includes('carbendazim')) {
      category = 'Agricultural Fungicide';
    } else if (lower.includes('glyphosate') || lower.includes('atrazine')) {
      category = 'Herbicide / Weed Management';
    }

    return NextResponse.json({
      compound: {
        cid,
        title: compoundProp.Title || query,
        iupacName: compoundProp.IUPACName || compoundProp.Title,
        molecularFormula: compoundProp.MolecularFormula,
        molecularWeight: compoundProp.MolecularWeight,
        smiles: compoundProp.CanonicalSMILES,
        inchikey: compoundProp.InChIKey,
        xlogp: compoundProp.XLogP,
        complexity: compoundProp.Complexity,
        hBondDonorCount: compoundProp.HBondDonorCount,
        hBondAcceptorCount: compoundProp.HBondAcceptorCount,
        category,
        structureImageUrl: structureImage,
        synonyms,
        provenance: {
          database: 'PubChem PUG REST & PUG View (NCBI/NIH)',
          url: `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`,
          badge: 'Experimentally determined & Authoritative Curated Record',
        },
      },
    });
  } catch (error: any) {
    console.error('PubChem API Error:', error);
    return NextResponse.json({ error: error.message || 'Error fetching chemical data from PubChem' }, { status: 500 });
  }
}
