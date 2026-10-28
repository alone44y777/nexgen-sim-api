export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  const rawNumber = req.query.number || req.query.phone || req.query.num || req.query.query;

  if (!rawNumber) {
    return res.status(400).json({ 
      status: "error", 
      Developer: "NexGen-Tech-PK", 
      message: "Number parameter missing! Use: /api/search?number=03xxxxxxxxx" 
    });
  }

  const cleanInput = rawNumber.trim().replace(/[-\s]/g, '');
  const number = encodeURIComponent(cleanInput);

  const endpoints = [
    `https://simtrueok-ten.vercel.app/api/search?query=${number}`,
    `https://wasifali-sim-info.netlify.app/api/search?phone=${number}`
  ];

  for (let url of endpoints) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      });

      const textData = await response.text();
      
      const isInvalid = textData.includes('"error":true') || textData.includes('"data":[]') || textData.includes('"status":"error"');

      if (response.ok && textData.length > 15 && !isInvalid) {
        try {
          let jsonData = JSON.parse(textData);

          // 1. WhatsApp link ko CNIC se replace karne ki logic
          if (jsonData.sim_data && Array.isArray(jsonData.sim_data)) {
            jsonData.sim_data = jsonData.sim_data.map(item => {
              if (item.cnic && item.cnic.includes("http")) {
                item.cnic = jsonData.extracted_cnic || "";
              }
              return item;
            });
          }

          // 2. Extra branding keys ko delete karne ki logic
          const blockedKeys = ['developer', 'dev', 'owner', 'api_owner', 'credit', 'credits', 'author', 'powered_by', 'channel', 'telegram', 'by', 'group', 'success', 'query_type', 'total_numbers_found'];
          
          function deepClean(obj) {
            if (Array.isArray(obj)) return obj.map(deepClean);
            if (obj !== null && typeof obj === 'object') {
              const cleaned = {};
              for (const [k, v] of Object.entries(obj)) {
                if (!blockedKeys.includes(k.toLowerCase())) {
                  cleaned[k] = deepClean(v);
                }
              }
              return cleaned;
            }
            return obj;
          }

          const finalData = deepClean(jsonData);

          return res.status(200).json({
            status: "success",
            Developer: "NexGen-Tech-PK",
            query: cleanInput,
            result: finalData
          });
        } catch (e) {
          // JSON parse fail hone par agle endpoint par jaye
        }
      }
    } catch (error) {
      // Fetch fail hone par agle endpoint par jaye
    }
  }

  return res.status(404).json({
    status: "failed",
    Developer: "NexGen-Tech-PK",
    query: cleanInput,
    message: "Data not found in any of the backend servers."
  });
              }
        
