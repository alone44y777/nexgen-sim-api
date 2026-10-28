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

  // Yeh function dusri API ka naam aur links delete kar dega
  function cleanBranding(obj) {
    if (Array.isArray(obj)) {
      return obj.map(cleanBranding);
    } else if (obj !== null && typeof obj === 'object') {
      const cleaned = {};
      // 'group' aur 'success' ko bhi block list mein daal diya hai taake extra text na aaye
      const blockedKeys = ['developer', 'dev', 'owner', 'api_owner', 'credit', 'credits', 'author', 'powered_by', 'channel', 'telegram', 'by', 'group', 'success', 'query_type', 'total_numbers_found'];
      
      for (const [key, value] of Object.entries(obj)) {
        if (!blockedKeys.includes(key.toLowerCase())) {
          cleaned[key] = cleanBranding(value);
        }
      }
      return cleaned;
    }
    return obj;
  }

  for (let url of endpoints) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*'
        }
      });

      const textData = await response.text();
      
      const isInvalid = textData.includes('"error":true') || textData.includes('"data":[]') || textData.includes('"status":"error"');

      if (response.ok && textData.length > 15 && !isInvalid) {
        try {
          const jsonData = JSON.parse(textData);
          const finalData = cleanBranding(jsonData); // Data ko saaf kiya gaya hai
          
          return res.status(200).json({
            status: "success",
            Developer: "NexGen-Tech-PK",
            query: cleanInput,
            result: finalData
          });
        } catch (e) {
          // JSON parse fail ho toh ignore karo
        }
      }
    } catch (error) {
      // Fetch fail ho toh aage badho
    }
  }

  return res.status(404).json({
    status: "failed",
    Developer: "NexGen-Tech-PK",
    query: cleanInput,
    message: "Data not found in any of the backend servers."
  });
      }
                           
