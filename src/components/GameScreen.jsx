import React, { useState } from "react";
import { calculateProfit, calculateNextDemand, getRandomNews } from "../utils";

export default function GameScreen({ options, initialDemand, onComplete }) {
  const [round, setRound] = useState(1);
  const [currentDemand, setCurrentDemand] = useState(initialDemand);
  const [history, setHistory] = useState([]);
  const [news, setNews] = useState(getRandomNews());

  const handleChoice = (option) => {
    const profit = calculateProfit(option.price, option.cost, currentDemand);
    const nextDemand = calculateNextDemand(currentDemand, option.fanEffect);
    const newEntry = {
      round,
      option: option.name,
      profit,
      demand: currentDemand,
      news
    };
    setHistory([...history, newEntry]);
    if (round === 4) {
      onComplete([...history, newEntry]);
    } else {
      setRound(round + 1);
      setCurrentDemand(nextDemand);
      setNews(getRandomNews());
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Round {round}</h2>
      <p className="mb-2 font-semibold">Current Demand: {currentDemand}</p>
      <p className="mb-4 italic">News: {news}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => handleChoice(o)}
            className="border p-2 rounded hover:bg-blue-100"
          >
            <strong>{o.name}</strong>
            <p>Price: ${o.price}, Cost: ${o.cost}</p>
            <p>{o.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
