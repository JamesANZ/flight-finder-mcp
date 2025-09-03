import {
  FlightItinerary,
  PriceAnalysis,
  FlightSearchResponse,
} from "../types/flight";

/**
 * Service for analyzing flight data and providing insights
 */
export class FlightAnalyzerService {
  /**
   * Analyze flight prices across multiple dates and provide recommendations
   * @param searchResults Array of flight search results for different dates
   * @returns Price analysis with recommendations
   */
  analyzePricesAcrossDates(
    searchResults: Array<{ date: string; results: FlightSearchResponse }>,
  ): PriceAnalysis {
    if (searchResults.length === 0) {
      throw new Error("No search results to analyze");
    }

    const prices = searchResults.map(({ date, results }) => {
      const minPrice = Math.min(
        ...results.itineraries.map((it) => it.price.amount),
      );
      return { date, price: minPrice };
    });

    const cheapest = prices.reduce((min, current) =>
      current.price < min.price ? current : min,
    );

    const mostExpensive = prices.reduce((max, current) =>
      current.price > max.price ? current : max,
    );

    const averagePrice =
      prices.reduce((sum, item) => sum + item.price, 0) / prices.length;
    const priceRange = mostExpensive.price - cheapest.price;

    const recommendations = this.generateRecommendations(
      prices,
      cheapest,
      mostExpensive,
      averagePrice,
      priceRange,
    );

    return {
      cheapestDate: cheapest.date,
      cheapestPrice: cheapest.price,
      mostExpensiveDate: mostExpensive.date,
      mostExpensivePrice: mostExpensive.price,
      averagePrice: Math.round(averagePrice),
      priceRange,
      recommendations,
    };
  }

  /**
   * Generate flight recommendations based on price analysis
   * @param prices Array of date-price pairs
   * @param cheapest Cheapest flight option
   * @param mostExpensive Most expensive flight option
   * @param averagePrice Average price across all dates
   * @returns Array of recommendations
   */
  private generateRecommendations(
    prices: Array<{ date: string; price: number }>,
    cheapest: { date: string; price: number },
    mostExpensive: { date: string; price: number },
    averagePrice: number,
    priceRange: number,
  ): string[] {
    const recommendations: string[] = [];

    // Price-based recommendations
    if (cheapest.price < averagePrice * 0.8) {
      recommendations.push(
        `🚀 Great deal found! ${cheapest.date} is ${Math.round((1 - cheapest.price / averagePrice) * 100)}% below average price.`,
      );
    }

    if (mostExpensive.price > averagePrice * 1.3) {
      recommendations.push(
        `⚠️  ${mostExpensive.date} is ${Math.round((mostExpensive.price / averagePrice - 1) * 100)}% above average - consider avoiding this date.`,
      );
    }

    // Date pattern recommendations
    const sortedPrices = [...prices].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const priceTrend = this.calculatePriceTrend(sortedPrices);

    if (priceTrend > 0.1) {
      recommendations.push(
        "📈 Prices are trending upward. Consider booking earlier dates for better deals.",
      );
    } else if (priceTrend < -0.1) {
      recommendations.push(
        "📉 Prices are trending downward. Waiting might get you a better deal.",
      );
    }

    // Weekend vs weekday analysis
    const weekendPrices = prices.filter((p) => this.isWeekend(p.date));
    const weekdayPrices = prices.filter((p) => !this.isWeekend(p.date));

    if (weekendPrices.length > 0 && weekdayPrices.length > 0) {
      const avgWeekendPrice =
        weekendPrices.reduce((sum, p) => sum + p.price, 0) /
        weekendPrices.length;
      const avgWeekdayPrice =
        weekdayPrices.reduce((sum, p) => sum + p.price, 0) /
        weekdayPrices.length;

      if (avgWeekendPrice > avgWeekdayPrice * 1.2) {
        recommendations.push(
          "💡 Weekend flights are significantly more expensive. Consider flying on weekdays for better prices.",
        );
      }
    }

    // General recommendations
    if (prices.length >= 7) {
      recommendations.push(
        "🔍 You've searched across many dates. This gives you a comprehensive view of pricing patterns.",
      );
    }

    if (priceRange > averagePrice * 0.5) {
      recommendations.push(
        "💰 Significant price variation detected. Flexibility with dates can save you money.",
      );
    }

    return recommendations;
  }

  /**
   * Calculate the price trend across dates
   * @param sortedPrices Prices sorted by date
   * @returns Trend coefficient (positive = increasing, negative = decreasing)
   */
  private calculatePriceTrend(
    sortedPrices: Array<{ date: string; price: number }>,
  ): number {
    if (sortedPrices.length < 2) return 0;

    const n = sortedPrices.length;
    const xValues = Array.from({ length: n }, (_, i) => i);
    const yValues = sortedPrices.map((p) => p.price);

    const sumX = xValues.reduce((sum, x) => sum + x, 0);
    const sumY = yValues.reduce((sum, y) => sum + y, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgPrice = sumY / n;

    return slope / avgPrice; // Normalized trend
  }

  /**
   * Check if a date falls on a weekend
   * @param dateString Date string in YYYY-MM-DD format
   * @returns True if the date is a weekend
   */
  private isWeekend(dateString: string): boolean {
    const date = new Date(dateString);
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
  }

  /**
   * Analyze monthly flight data and provide comprehensive insights
   * @param monthlyResults Array of flight search results for different dates
   * @param includeWeekendAnalysis Whether to include weekend vs weekday analysis
   * @returns Comprehensive monthly analysis
   */
  analyzeMonthlyFlightData(
    monthlyResults: Array<{
      date: string;
      source: string;
      results: FlightSearchResponse;
      cabinClass: string;
    }>,
    includeWeekendAnalysis: boolean = true,
  ): any {
    if (monthlyResults.length === 0) {
      throw new Error("No monthly results to analyze");
    }

    // Extract all prices across all dates and sources
    const allPrices: Array<{
      date: string;
      price: number;
      source: string;
      cabinClass: string;
    }> = [];

    monthlyResults.forEach(({ date, source, results, cabinClass }) => {
      if (results.itineraries.length > 0) {
        const minPrice = Math.min(
          ...results.itineraries.map((it) => it.price.amount),
        );
        allPrices.push({ date, price: minPrice, source, cabinClass });
      }
    });

    if (allPrices.length === 0) {
      throw new Error("No valid prices found in monthly results");
    }

    // Basic price analysis
    const cheapest = allPrices.reduce((min, current) =>
      current.price < min.price ? current : min,
    );

    const mostExpensive = allPrices.reduce((max, current) =>
      current.price > max.price ? current : max,
    );

    const averagePrice =
      allPrices.reduce((sum, item) => sum + item.price, 0) / allPrices.length;
    const priceRange = mostExpensive.price - cheapest.price;

    // Weekend vs weekday analysis
    let weekendAnalysis = null;
    if (includeWeekendAnalysis) {
      const weekendPrices = allPrices.filter((p) => this.isWeekend(p.date));
      const weekdayPrices = allPrices.filter((p) => !this.isWeekend(p.date));

      if (weekendPrices.length > 0 && weekdayPrices.length > 0) {
        const avgWeekendPrice =
          weekendPrices.reduce((sum, p) => sum + p.price, 0) /
          weekendPrices.length;
        const avgWeekdayPrice =
          weekdayPrices.reduce((sum, p) => sum + p.price, 0) /
          weekdayPrices.length;
        const weekendPremium = Math.round(
          ((avgWeekendPrice - avgWeekdayPrice) / avgWeekdayPrice) * 100,
        );

        weekendAnalysis = {
          avgWeekendPrice: Math.round(avgWeekendPrice),
          avgWeekdayPrice: Math.round(avgWeekdayPrice),
          weekendPremium,
          weekendDates: weekendPrices.map((p) => p.date),
          weekdayDates: weekdayPrices.map((p) => p.date),
        };
      }
    }

    // Generate smart recommendations
    const recommendations = this.generateMonthlyRecommendations(
      allPrices,
      cheapest,
      mostExpensive,
      averagePrice,
      priceRange,
      weekendAnalysis,
    );

    return {
      cheapestDate: cheapest.date,
      cheapestPrice: cheapest.price,
      cheapestSource: cheapest.source,
      mostExpensiveDate: mostExpensive.date,
      mostExpensivePrice: mostExpensive.price,
      mostExpensiveSource: mostExpensive.source,
      averagePrice: Math.round(averagePrice),
      priceRange,
      totalDates: allPrices.length,
      weekendAnalysis,
      recommendations,
      priceDistribution: this.calculatePriceDistribution(allPrices),
      trendAnalysis: this.calculateMonthlyTrend(allPrices),
    };
  }

  /**
   * Generate monthly flight recommendations
   */
  private generateMonthlyRecommendations(
    allPrices: Array<{
      date: string;
      price: number;
      source: string;
      cabinClass: string;
    }>,
    cheapest: {
      date: string;
      price: number;
      source: string;
      cabinClass: string;
    },
    mostExpensive: {
      date: string;
      price: number;
      source: string;
      cabinClass: string;
    },
    averagePrice: number,
    priceRange: number,
    weekendAnalysis: any,
  ): string[] {
    const recommendations: string[] = [];

    // Price-based recommendations
    if (cheapest.price < averagePrice * 0.8) {
      recommendations.push(
        `🚀 Amazing deal found! ${cheapest.date} is ${Math.round((1 - cheapest.price / averagePrice) * 100)}% below average price on ${cheapest.source}.`,
      );
    }

    if (mostExpensive.price > averagePrice * 1.3) {
      recommendations.push(
        `⚠️  ${mostExpensive.date} is ${Math.round((mostExpensive.price / averagePrice - 1) * 100)}% above average - avoid this date if possible.`,
      );
    }

    // Source-based recommendations
    const sourcePrices = this.groupPricesBySource(allPrices);
    const bestSource = Object.entries(sourcePrices).reduce(
      (best, [source, prices]) => {
        const avgPrice =
          prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
        return avgPrice < best.avgPrice ? { source, avgPrice } : best;
      },
      { source: "", avgPrice: Infinity },
    );

    if (bestSource.source && bestSource.avgPrice < averagePrice * 0.95) {
      recommendations.push(
        `💡 ${bestSource.source} tends to have better prices for this route (${Math.round((1 - bestSource.avgPrice / averagePrice) * 100)}% below average).`,
      );
    }

    // Weekend recommendations
    if (weekendAnalysis) {
      if (weekendAnalysis.weekendPremium > 20) {
        recommendations.push(
          `💡 Weekend flights are ${weekendAnalysis.weekendPremium}% more expensive. Consider flying on weekdays to save money.`,
        );
      } else if (weekendAnalysis.weekendPremium < -10) {
        recommendations.push(
          `🎉 Weekend flights are actually ${Math.abs(weekendAnalysis.weekendPremium)}% cheaper! Great time to travel.`,
        );
      }
    }

    // Date pattern recommendations
    const sortedPrices = [...allPrices].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const priceTrend = this.calculatePriceTrend(sortedPrices);

    if (priceTrend > 0.15) {
      recommendations.push(
        "📈 Prices are trending significantly upward. Book earlier in the month for better deals.",
      );
    } else if (priceTrend < -0.15) {
      recommendations.push(
        "📉 Prices are trending downward. Waiting might get you an even better deal.",
      );
    }

    // General recommendations
    if (allPrices.length >= 20) {
      recommendations.push(
        "🔍 Comprehensive month analysis complete. You have excellent visibility into pricing patterns.",
      );
    }

    if (priceRange > averagePrice * 0.6) {
      recommendations.push(
        "💰 High price variation detected. Flexibility with dates can save you significant money.",
      );
    }

    return recommendations;
  }

  /**
   * Group prices by source
   */
  private groupPricesBySource(
    allPrices: Array<{
      date: string;
      price: number;
      source: string;
      cabinClass: string;
    }>,
  ): Record<
    string,
    Array<{ date: string; price: number; source: string; cabinClass: string }>
  > {
    return allPrices.reduce(
      (groups, price) => {
        if (!groups[price.source]) {
          groups[price.source] = [];
        }
        groups[price.source].push(price);
        return groups;
      },
      {} as Record<
        string,
        Array<{
          date: string;
          price: number;
          source: string;
          cabinClass: string;
        }>
      >,
    );
  }

  /**
   * Calculate price distribution
   */
  private calculatePriceDistribution(
    allPrices: Array<{
      date: string;
      price: number;
      source: string;
      cabinClass: string;
    }>,
  ): any {
    const prices = allPrices.map((p) => p.price).sort((a, b) => a - b);
    const q25 = prices[Math.floor(prices.length * 0.25)];
    const q50 = prices[Math.floor(prices.length * 0.5)];
    const q75 = prices[Math.floor(prices.length * 0.75)];

    return {
      min: prices[0],
      q25,
      median: q50,
      q75,
      max: prices[prices.length - 1],
      standardDeviation: this.calculateStandardDeviation(prices),
    };
  }

  /**
   * Calculate standard deviation
   */
  private calculateStandardDeviation(prices: number[]): number {
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const squaredDiffs = prices.map((price) => Math.pow(price - mean, 2));
    const avgSquaredDiff =
      squaredDiffs.reduce((sum, diff) => sum + diff, 0) / prices.length;
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Calculate monthly trend
   */
  private calculateMonthlyTrend(
    allPrices: Array<{
      date: string;
      price: number;
      source: string;
      cabinClass: string;
    }>,
  ): any {
    const sortedPrices = [...allPrices].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const trend = this.calculatePriceTrend(sortedPrices);

    return {
      trend,
      trendStrength: Math.abs(trend),
      trendDirection:
        trend > 0 ? "increasing" : trend < 0 ? "decreasing" : "stable",
      volatility: this.calculatePriceVolatility(sortedPrices),
    };
  }

  /**
   * Calculate price volatility
   */
  private calculatePriceVolatility(
    sortedPrices: Array<{
      date: string;
      price: number;
      source: string;
      cabinClass: string;
    }>,
  ): number {
    if (sortedPrices.length < 2) return 0;

    const priceChanges = [];
    for (let i = 1; i < sortedPrices.length; i++) {
      const change = Math.abs(
        sortedPrices[i].price - sortedPrices[i - 1].price,
      );
      priceChanges.push(change);
    }

    const avgChange =
      priceChanges.reduce((sum, change) => sum + change, 0) /
      priceChanges.length;
    const avgPrice =
      sortedPrices.reduce((sum, p) => sum + p.price, 0) / sortedPrices.length;

    return avgChange / avgPrice; // Normalized volatility
  }

  /**
   * Analyze flight details and provide insights
   * @param itinerary Flight itinerary to analyze
   * @returns Array of insights about the flight
   */
  analyzeFlightDetails(itinerary: FlightItinerary): string[] {
    const insights: string[] = [];

    // Duration analysis
    const totalMinutes = this.parseDurationToMinutes(itinerary.totalDuration);
    if (totalMinutes > 480) {
      // 8 hours
      insights.push(
        "⏰ This is a long flight. Consider bringing entertainment and comfort items.",
      );
    } else if (totalMinutes < 120) {
      // 2 hours
      insights.push("⚡ Short flight - perfect for quick trips!");
    }

    // Stop analysis
    if (itinerary.stops === 0) {
      insights.push("✈️ Direct flight - no layovers to worry about.");
    } else if (itinerary.stops === 1) {
      insights.push(
        "🔄 One stop - reasonable compromise between price and convenience.",
      );
    } else {
      insights.push("🔄 Multiple stops - this route has several layovers.");
    }

    // Price analysis
    if (itinerary.price.amount < 300) {
      insights.push("💰 Excellent price for this route!");
    } else if (itinerary.price.amount > 800) {
      insights.push(
        "💸 Higher price point - consider if the convenience is worth the cost.",
      );
    }

    // Airline insights
    const airline = itinerary.segments[0]?.airline;
    if (airline) {
      insights.push(
        `🏢 Flying with ${airline} - check their baggage and meal policies.`,
      );
    }

    return insights;
  }

  /**
   * Parse duration string to minutes
   * @param duration Duration string (e.g., "2h 30m")
   * @returns Duration in minutes
   */
  private parseDurationToMinutes(duration: string): number {
    const hoursMatch = duration.match(/(\d+)h/);
    const minutesMatch = duration.match(/(\d+)m/);

    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;

    return hours * 60 + minutes;
  }
}
