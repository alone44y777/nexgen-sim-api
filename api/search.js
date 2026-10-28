export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const rawNumber = req.query.number || req.query.phone || req.query.num || req.query.query;

  if (!rawNumber) {
    return res.status(400).json({ status: "error", message: "Number missing" });
  }

  const number = encodeURIComponent(rawNumber.trim().replace(/[-\s]/g, ''));

  const endpoints = [
    `https://simtrueok-ten.vercel.app/api/search?query=${number}`,
    `https://wasifali-sim-info.netlify.app/api/search?phone=${number}`
  ];

  let debugLogs = [];

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
      
      debugLogs.push({
        api: url,
        http_status: response.status,
        response_preview: textData.substring(0, 150) // Sirf pehle 150 characters dekhne ke liye
      });

      // Agar data theek hai toh direct show kar do
      if (response.ok && textData.length > 15 && !textData.includes('"error":true')) {
        try {
          const jsonData = JSON.parse(textData);
          return res.status(200).json({
            status: "success",
            Developer: "NexGen-Tech-PK",
            query: number,
            result: jsonData
          });
        } catch (e) {
          // JSON parse na ho toh ignore karo aur aage badho
        }
      }
    } catch (error) {
      debugLogs.push({ api: url, error: error.message });
    }
  }

  // Agar sab fail ho jayen toh screen par error ki asli wajah dikhao
  return res.status(404).json({
    status: "failed",
    message: "Backend APIs are not returning valid data.",
    debug_info: debugLogs
  });
                                 }
        
