'use client';
import { useEffect, useState } from 'react';
import '../globals.css';
import { useRouter } from 'next/navigation';

export default function Shipping() {
  const [parsedResult, setParsedResult] = useState(null);
  const [bfsOutput, setBfsOutput] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const rawData = localStorage.getItem("geminiResponse");
    if (rawData) {
      try {
        const parsedData = JSON.parse(rawData);
        setParsedResult(parsedData);
        console.log("Parsed Result:", parsedData); // Debugging line
      } catch (error) {
        console.error("Error parsing data from localStorage:", error);
      }
    }
  }, []);

  const extractTariffRows = () => {
    if (!parsedResult) return [];

    const countryValue = parsedResult["country of origin"];
    const countries =
      typeof countryValue === "string"
        ? countryValue.split(",").map(s => s.trim())
        : Array.isArray(countryValue)
          ? countryValue
          : [];
    const tariffs = parsedResult["tariff percentage from country of origin"]

    return countries.map((country, index) => ({
      country: country.trim(),
      tariff: tariffs[index] || 'N/A'
    }));
  };

  const runBFS = async () => {
    try {
      const response = await fetch("http://localhost:5050/api/run-bfs", {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ BFS failed:", errorData);
        setBfsOutput("Error: " + (errorData?.stderr || "Unknown error"));
      }

      const data = await response.json();
      console.log("✅ BFS Result:", data.stdout);
      localStorage.setItem("bfsOutput", data.stdout); // Optional: pass to next page
      router.push("/loading"); // 🔁 Navigate to animation page
        
    } catch (error) {
      console.error("❌ Error calling BFS:", error);
      setBfsOutput("Error: " + error.message);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white border-2 border-black shadow-xl p-8 rounded-md w-full max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-8 tracking-wide">Import Calculation Results</h1>
  
        {parsedResult ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-white border border-black shadow text-lg font-medium">
                <strong>Total import cost (USD):</strong> ${parsedResult["total price of importing(USD)"]}
              </div>
            </div>
  
            <h2 className="text-2xl font-semibold mb-4 text-center">Tariff Breakdown</h2>
            <table className="w-full table-auto border-collapse border border-gray-300 text-center">
              <thead className="bg-gray-200 text-lg">
                <tr>
                  <th className="border border-gray-400 px-4 py-2">Country</th>
                  <th className="border border-gray-400 px-4 py-2">Tariff (%)</th>
                </tr>
              </thead>
              <tbody>
                {extractTariffRows().map((item, index) => (
                  <tr key={index} className="text-lg">
                    <td className="border border-gray-400 px-4 py-2">{item.country}</td>
                    <td className="border border-gray-400 px-4 py-2">{item.tariff}</td>
                  </tr>
                ))}
              </tbody>
            </table>


            <div className="flex justify-center mt-8">
              <button
                onClick={runBFS}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold text-lg"
              >
                Run Optimized Route (BFS)
              </button>
            </div>

            {bfsOutput && (
              <div className="mt-6 bg-gray-100 border border-black p-4 rounded text-sm whitespace-pre-wrap">
                <strong>BFS Output:</strong>
                <br />
                {bfsOutput}
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-gray-600">Loading results...</p>
        )}
      </div>
    </div>
  );
}