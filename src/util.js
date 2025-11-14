export function calculateProfit(price, cost, demand) {
    return (price - cost) * demand;
  }
  
  export function calculateNextDemand(currentDemand, fanEffect) {
    const randomShock = (Math.random() - 0.5) * 0.1; // ±5%
    return Math.max(0, Math.round(currentDemand * (1 + fanEffect + randomShock)));
  }
  
  export function getRandomNews() {
    const newsList = [
      "Fans rave about early reviews!",
      "Social media buzz increases interest.",
      "A competitor opens a new venue nearby.",
      "Local news critic praises the band’s performance.",
      "Unexpected weather affects ticket demand slightly."
    ];
    return newsList[Math.floor(Math.random() * newsList.length)];
  }
  