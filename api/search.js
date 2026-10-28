export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawNumber = req.query.number || req.query.phone || req.query.num || req.query.query;

  if (!rawNumber) {
    return res.status(400).json({
      status: "error",
      Developer: "NexGen-Tech-PK",
      message: "Number parameter missing! Use: /api/search?number=03xxxxxxxxx"
    });
  }

  // Advance Fix: Spaces aur dashes khud remove karega
  const cleanInput = rawNumber.trim().replace(/[-\s]/g, '');
  const number = encodeURIComponent(cleanInput);

  const endpoints = [
    `https://simtrueok-ten.vercel.app/api/search?query=${number}`,
    `https://wasifali-sim-info.netlify.app/api/search?phone=${number}`,
    `https://ft-simdb.ftshehryar10044.workers.dev/ft/api?num=${number}`,
    `https://famofc.site/api/database.php?number=${number}`
  ];

  function cleanBranding(obj) {
    if (Array.isArray(obj)) {
      return obj.map(cleanBranding);
    } else if (obj !== null && typeof obj === 'object') {
      const cleaned = {};
      const blockedKeys = ['developer', 'dev', 'owner', 'api_owner', 'credit', 'credits', 'author', 'powered_by', 'channel', 'telegram', 'by'];
      
      for (const [key, value] of Object.entries(obj)) {
        if (!blockedKeys.includes(key.toLowerCase())) {
          cleaned[key] = cleanBranding(value);
        }
      }
      return cleaned;
    }
    return obj;
  }

  const fetchApi = async (url) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // Perfect timing for Vercel Free Tier

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error("HTTP Error");

      const textData = await response.text();
      if (!textData || textData.trim() === "") throw new Error("Empty Data");

      try {
        const jsonData = JSON.parse(textData);
        
        // Proper JSON Validation Fix
        const isEmptyData = 
          jsonData.status === "error" || 
          jsonData.error === true || 
          (Array.isArray(jsonData.data) && jsonData.data.length === 0) ||
          (Array.isArray(jsonData.result) && jsonData.result.length === 0) ||
          (Array.isArray(jsonData) && jsonData.length === 0) ||
          jsonData.message === "No Record Found" || 
          jsonData.message === "not found";

        if (jsonData && Object.keys(jsonData).length > 0 && !isEmptyData) {
          return cleanBranding(jsonData);
        } else {
          throw new Error("Empty or Error Response from API");
        }
      } catch (err) {
        throw new Error("Invalid JSON format");
      }
    } catch (error) {
      throw error;
    }
  };

  try {
    const results = await Promise.allSettled(endpoints.map(fetchApi));
    
    const validResults = results
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value);

    if (validResults.length > 0) {
      return res.status(200).json({
        status: "success",
        Developer: "NexGen-Tech-PK",
        query: cleanInput,
        result: validResults[0]
      });
    } else {
      throw new Error("All APIs failed to return data");
    }

  } catch (error) {
    return res.status(404).json({
      status: "failed",
      Developer: "NexGen-Tech-PK",
      query: cleanInput,
      message: "Data not found in any of the backend servers."
    });
  }
}
  
