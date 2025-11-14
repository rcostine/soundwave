import React from "react";

export default function ResultsScreen({ history }) {
  const totalProfit = history.reduce((acc, h) => acc + h.profit, 0);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Game Summary</h2>
      <p className="mb-2">Total Profit: ${totalProfit}</p>
      <table className="border-collapse border w-full">
        <thead>
          <tr className="border-b">
            <th className="border px-2 py-1">Round</th>
            <th className="border px-2 py-1">Option</th>
            <th className="border px-2 py-1">Profit</th>
            <th className="border px-2 py-1">Demand</th>
            <th className="border px-2 py-1">News
