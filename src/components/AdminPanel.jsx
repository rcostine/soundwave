import React, { useState } from "react";
import { defaultOptions } from "../data/defaultOptions";

export default function AdminPanel({ setOptions, resetGame }) {
  const [options, setLocalOptions] = useState(defaultOptions);

  const handleAddOption = () => {
    const newOption = {
      id: `O${options.length + 1}`,
      name: "New Option",
      price: 100,
      cost: 50,
      fanEffect: 0,
      description: "Description"
    };
    const newOptions = [...options, newOption];
    setLocalOptions(newOptions);
    setOptions(newOptions);
  };

  const handleReset = () => {
    resetGame();
  };

  return (
    <div className="p-4 border rounded bg-gray-50">
      <h2 className="font-bold text-lg mb-2">Instructor Admin Panel</h2>
      <button
        onClick={handleAddOption}
        className="bg-blue-500 text-white px-3 py-1 rounded mr-2"
      >
        Add Option
      </button>
      <button
        onClick={handleReset}
        className="bg-red-500 text-white px-3 py-1 rounded"
      >
        Reset Game
      </button>
      <ul className="mt-2">
        {options.map((o) => (
          <li key={o.id}>
            {o.id}: {o.name} (${o.price})
          </li>
        ))}
      </ul>
    </div>
  );
}
