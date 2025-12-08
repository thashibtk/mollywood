"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SizeGuideModal({ isOpen, onClose }: SizeGuideModalProps) {
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70);
  const [suggestedSize, setSuggestedSize] = useState("M");

  // Simple logic to suggest size based on height and weight
  useEffect(() => {
    // This is a simplified logic for demonstration
    // BMI-ish calculation or just simple thresholds
    // Expanded logic for XS to 3XL
    let size = "M";
    
    if (weight < 50) size = "XS";
    else if (weight < 60) size = "S";
    else if (weight < 75) size = "M";
    else if (weight < 85) size = "L";
    else if (weight < 95) size = "XL";
    else if (weight < 105) size = "2XL";
    else size = "3XL";

    // Adjust based on height
    if (height > 185 && (size === "S" || size === "M")) size = "L";
    if (height > 190 && size === "L") size = "XL";
    if (height > 195 && size === "XL") size = "2XL";

    setSuggestedSize(size);
  }, [height, weight]);

  const sizeChart = [
    { size: "XS", bust: "32", waist: "24-25", hip: "33-34" },
    { size: "S", bust: "34-35", waist: "26-27", hip: "35-36" },
    { size: "M", bust: "36-37", waist: "28-29", hip: "38-40" },
    { size: "L", bust: "38-39", waist: "30-31", hip: "42-44" },
    { size: "XL", bust: "40-41", waist: "32-33", hip: "45-47" },
    { size: "2XL", bust: "42-43", waist: "34-35", hip: "48-50" },
    { size: "3XL", bust: "44-45", waist: "36-37", hip: "51-53" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-black text-white border border-gray-800 rounded-xl shadow-2xl z-[70] overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold tracking-tight">Size Guide</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Sliders Section */}
              <div className="space-y-8 mb-10">
                {/* Height Slider */}
                <div className="flex items-center gap-6">
                  <span className="w-16 font-medium text-gray-400">Height</span>
                  <div className="flex items-center gap-2 border border-gray-700 rounded px-3 py-1.5 w-24 bg-white/5">
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="w-full bg-transparent outline-none font-medium text-center text-white"
                    />
                    <span className="text-xs text-gray-500">Cm</span>
                  </div>
                  <input
                    type="range"
                    min="140"
                    max="220"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>

                {/* Weight Slider */}
                <div className="flex items-center gap-6">
                  <span className="w-16 font-medium text-gray-400">Weight</span>
                  <div className="flex items-center gap-2 border border-gray-700 rounded px-3 py-1.5 w-24 bg-white/5">
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="w-full bg-transparent outline-none font-medium text-center text-white"
                    />
                    <span className="text-xs text-gray-500">Kg</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="150"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>
              </div>

              {/* Suggestions */}
              <div className="mb-10">
                <h3 className="text-lg font-bold mb-4">Suggests For You:</h3>
                <div className="flex gap-3 flex-wrap">
                  {["XS", "S", "M", "L", "XL", "2XL", "3XL"].map((size) => (
                    <div
                      key={size}
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-medium transition-all duration-300 ${
                        suggestedSize === size
                          ? "bg-white text-black scale-110 shadow-lg shadow-white/20"
                          : "bg-white/10 text-gray-400"
                      }`}
                    >
                      {size}
                    </div>
                  ))}
                </div>
              </div>

              {/* Size Chart Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-400 uppercase bg-white/5 border-b border-gray-800">
                    <tr>
                      <th className="px-6 py-4 font-bold">Size</th>
                      <th className="px-6 py-4 font-bold">Bust</th>
                      <th className="px-6 py-4 font-bold">Waist</th>
                      <th className="px-6 py-4 font-bold">Low Hip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {sizeChart.map((row) => (
                      <tr
                        key={row.size}
                        className={`hover:bg-white/5 transition-colors ${
                          suggestedSize === row.size ? "bg-white/10 font-medium" : ""
                        }`}
                      >
                        <td className="px-6 py-4 text-white">{row.size}</td>
                        <td className="px-6 py-4 text-gray-400">{row.bust}</td>
                        <td className="px-6 py-4 text-gray-400">{row.waist}</td>
                        <td className="px-6 py-4 text-gray-400">{row.hip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
