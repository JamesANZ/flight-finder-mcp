import { FlightSearchResponse } from "../types/flight.js";

export class RecommendationHelper {
  /**
   * Get top flight recommendations from search results
   */
  getTopFlightRecommendations(
    allResults: Array<{
      date: string;
      source: string;
      results: FlightSearchResponse;
      cabinClass: string;
    }>,
    analysis: any,
  ): Array<{ date: string; source: string; price: number; itinerary: any }> {
    const recommendations: Array<{
      date: string;
      source: string;
      price: number;
      itinerary: any;
    }> = [];

    for (const result of allResults) {
      if (result.results.itineraries.length > 0) {
        const cheapestItinerary = result.results.itineraries.reduce(
          (min, current) =>
            current.price.amount < min.price.amount ? current : current,
        );

        recommendations.push({
          date: result.date,
          source: result.source,
          price: cheapestItinerary.price.amount,
          itinerary: cheapestItinerary,
        });
      }
    }

    // Sort by price and return top 5
    return recommendations.sort((a, b) => a.price - b.price).slice(0, 5);
  }

  /**
   * Generate recommendations based on price analysis
   */
  generatePriceRecommendations(
    allPrices: number[],
    cheapest: number,
    mostExpensive: number,
    averagePrice: number,
    priceRange: number,
  ): string[] {
    const recommendations: string[] = [];

    // Price-based recommendations
    if (cheapest < averagePrice * 0.8) {
      recommendations.push(
        `🚀 Amazing deal found! ${cheapest} is ${Math.round(((averagePrice - cheapest) / averagePrice) * 100)}% below average price.`,
      );
    }

    if (mostExpensive > averagePrice * 1.3) {
      recommendations.push(
        `⚠️  ${mostExpensive} is ${Math.round(((mostExpensive - averagePrice) / averagePrice) * 100)}% above average - avoid this date if possible.`,
      );
    }

    if (priceRange > averagePrice * 0.5) {
      recommendations.push(
        `💰 High price variation detected. Flexibility with dates can save you significant money.`,
      );
    }

    return recommendations;
  }

  /**
   * Generate source-based recommendations
   */
  generateSourceRecommendations(
    allResults: Array<{
      date: string;
      source: string;
      results: FlightSearchResponse;
      cabinClass: string;
    }>,
    averagePrice: number,
  ): string[] {
    const recommendations: string[] = [];
    const sourcePrices = this.groupPricesBySource(allResults);

    for (const [source, prices] of Object.entries(sourcePrices)) {
      const avgSourcePrice =
        prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const priceDifference =
        ((avgSourcePrice - averagePrice) / averagePrice) * 100;

      if (priceDifference < -5) {
        recommendations.push(
          `💡 ${source} tends to have better prices for this route (${Math.abs(Math.round(priceDifference))}% below average).`,
        );
      } else if (priceDifference > 5) {
        recommendations.push(
          `⚠️  ${source} tends to have higher prices for this route (${Math.round(priceDifference)}% above average).`,
        );
      }
    }

    return recommendations;
  }

  /**
   * Generate weekend vs weekday recommendations
   */
  generateWeekendRecommendations(weekendAnalysis: any): string[] {
    const recommendations: string[] = [];

    if (weekendAnalysis.weekendPremium > 15) {
      recommendations.push(
        `📅 Weekend flights are ${weekendAnalysis.weekendPremium}% more expensive. Consider weekday travel for better prices.`,
      );
    } else if (weekendAnalysis.weekendPremium < -5) {
      recommendations.push(
        `📅 Weekend flights are ${Math.abs(weekendAnalysis.weekendPremium)}% cheaper. Great for weekend getaways!`,
      );
    }

    return recommendations;
  }

  /**
   * Generate date pattern recommendations
   */
  generateDatePatternRecommendations(
    allResults: Array<{
      date: string;
      source: string;
      results: FlightSearchResponse;
      cabinClass: string;
    }>,
  ): string[] {
    const recommendations: string[] = [];

    // Check for mid-week vs weekend patterns
    const weekdayPrices: number[] = [];
    const weekendPrices: number[] = [];

    allResults.forEach(({ date, results }) => {
      const dayOfWeek = new Date(date).getDay();
      const minPrice = Math.min(
        ...results.itineraries.map((it) => it.price.amount),
      );

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendPrices.push(minPrice);
      } else {
        weekdayPrices.push(minPrice);
      }
    });

    if (weekdayPrices.length > 0 && weekendPrices.length > 0) {
      const avgWeekday =
        weekdayPrices.reduce((sum, price) => sum + price, 0) /
        weekdayPrices.length;
      const avgWeekend =
        weekendPrices.reduce((sum, price) => sum + price, 0) /
        weekendPrices.length;

      if (avgWeekday < avgWeekend * 0.9) {
        recommendations.push(
          `📅 Mid-week flights (Tuesday-Thursday) tend to be cheaper than weekend flights.`,
        );
      }
    }

    return recommendations;
  }

  /**
   * Group prices by source for analysis
   */
  private groupPricesBySource(
    allResults: Array<{
      date: string;
      source: string;
      results: FlightSearchResponse;
      cabinClass: string;
    }>,
  ): Record<string, number[]> {
    const sourcePrices: Record<string, number[]> = {};

    allResults.forEach(({ source, results }) => {
      if (!sourcePrices[source]) {
        sourcePrices[source] = [];
      }

      const minPrice = Math.min(
        ...results.itineraries.map((it) => it.price.amount),
      );
      sourcePrices[source].push(minPrice);
    });

    return sourcePrices;
  }
}
