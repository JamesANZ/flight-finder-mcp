import {
  FlightSearchResponse,
  FlightItinerary,
  PriceAnalysis,
} from "../types/flight.js";

export class FlightFormatter {
  /**
   * Format flight search results for display
   */
  formatFlightSearchResults(
    results: FlightSearchResponse,
    source: string,
  ): string {
    let output = `🔍 Flight Search Results from ${source}\n`;
    output += `📍 ${results.searchMetadata.origin} → ${results.searchMetadata.destination}\n`;
    output += `📅 Dates: ${results.searchMetadata.dates.join(", ")}\n`;
    output += `⏰ Search Time: ${new Date(results.searchMetadata.searchTime).toLocaleString()}\n`;
    output += `📊 Found ${results.searchMetadata.totalResults} options\n\n`;

    results.itineraries.forEach((itinerary, index) => {
      output += `**Option ${index + 1}**\n`;
      output += `💰 Price: $${itinerary.price.amount}\n`;
      output += `⏱️  Duration: ${itinerary.totalDuration}\n`;
      output += `🛫 Stops: ${itinerary.stops}\n`;

      itinerary.segments.forEach((segment, segIndex) => {
        output += `  ${segIndex + 1}. ${segment.airline} ${segment.flightNumber}\n`;
        output += `     ${segment.origin} → ${segment.destination}\n`;
        output += `     ${segment.departureTime} - ${segment.arrivalTime}\n`;
        output += `     Duration: ${segment.duration}\n`;
      });

      output += `🔗 Book: ${itinerary.bookingLink}\n\n`;
    });

    return output;
  }

  /**
   * Format multiple date results
   */
  formatMultipleDateResults(
    allResults: Array<{ date: string; results: FlightSearchResponse }>,
    analysis: PriceAnalysis,
  ): string {
    let output = `📊 Multi-Date Flight Analysis\n\n`;

    output += `📅 Results by Date:\n`;
    allResults.forEach(({ date, results }) => {
      const minPrice = Math.min(
        ...results.itineraries.map((it) => it.price.amount),
      );
      output += `  • ${date}: $${minPrice}\n`;
    });

    output += `\n📊 Price Analysis:\n`;
    output += `  • Cheapest Date: ${analysis.cheapestDate} at $${analysis.cheapestPrice}\n`;
    output += `  • Most Expensive Date: ${analysis.mostExpensiveDate} at $${analysis.mostExpensivePrice}\n`;
    output += `  • Average Price: $${analysis.averagePrice}\n`;
    output += `  • Price Range: $${analysis.priceRange}\n`;

    output += `\n💡 Recommendations:\n`;
    analysis.recommendations.forEach((rec) => {
      output += `  • ${rec}\n`;
    });

    return output;
  }

  /**
   * Format flight insights
   */
  formatFlightInsights(itinerary: FlightItinerary, insights: string[]): string {
    let output = `✈️  Flight Analysis for ${itinerary.id}\n\n`;

    output += `📋 Flight Details:\n`;
    output += `  • Route: ${itinerary.segments[0]?.origin} → ${itinerary.segments[0]?.destination}\n`;
    output += `  • Duration: ${itinerary.totalDuration}\n`;
    output += `  • Stops: ${itinerary.stops}\n`;
    output += `  • Price: $${itinerary.price.amount}\n`;

    output += `\n💡 Insights:\n`;
    insights.forEach((insight) => {
      output += `  • ${insight}\n`;
    });

    return output;
  }

  /**
   * Format best price recommendation
   */
  formatBestPriceRecommendation(
    origin: string,
    destination: string,
    overallBest: any,
    bestSource: string,
    skyscannerBest: any,
    googleBest: any,
  ): string {
    let output = `🏆 Best Price Recommendation\n\n`;
    output += `📍 Route: ${origin} → ${destination}\n`;
    output += `🏆 Best Overall: $${overallBest.bestPrice} on ${overallBest.bestDate} via ${bestSource}\n\n`;

    output += `📊 Source Comparison:\n`;
    output += `  • Skyscanner: $${skyscannerBest.bestPrice} on ${skyscannerBest.bestDate}\n`;
    output += `  • Google Flights: $${googleBest.bestPrice} on ${googleBest.bestDate}\n`;

    output += `\n💡 Recommendation:\n`;
    output += `  • Book on ${overallBest.bestDate} for the best price\n`;
    output += `  • ${bestSource} offers the lowest price for this route\n`;
    output += `  • Consider flexibility with dates to find even better deals\n`;

    return output;
  }

  /**
   * Format monthly flight results
   */
  formatMonthlyFlightResults(
    origin: string,
    destination: string,
    month: string,
    cabinClass: string,
    analysis: any,
    topRecommendations: Array<{
      date: string;
      source: string;
      price: number;
      itinerary: any;
    }>,
    allResults: Array<{
      date: string;
      source: string;
      results: FlightSearchResponse;
      cabinClass: string;
    }>,
  ): string {
    let output = `📅 Monthly Flight Analysis for ${month}\n`;
    output += `📍 Route: ${origin} → ${destination}\n`;
    output += `✈️  Cabin Class: ${cabinClass.charAt(0).toUpperCase() + cabinClass.slice(1)}\n`;
    output += `🔍 Sources: ${allResults
      .map((r) => r.source)
      .filter((v, i, a) => a.indexOf(v) === i)
      .join(", ")}\n\n`;

    output += `🏆 Top 5 Best Deals:\n`;
    topRecommendations.forEach((rec, index) => {
      const date = new Date(rec.date);
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
      output += `  ${index + 1}. ${rec.date} (${dayName}) - $${rec.price} on ${rec.source}\n`;
    });

    output += `\n📊 Price Analysis:\n`;
    output += `  • Cheapest Date: ${analysis.cheapestDate} at $${analysis.cheapestPrice} on ${analysis.cheapestSource}\n`;
    output += `  • Most Expensive Date: ${analysis.mostExpensiveDate} at $${analysis.mostExpensivePrice} on ${analysis.mostExpensiveSource}\n`;
    output += `  • Average Price: $${analysis.averagePrice}\n`;
    output += `  • Price Range: $${analysis.priceRange}\n`;
    output += `  • Total Dates Searched: ${analysis.totalDatesSearched}\n`;

    if (analysis.weekendAnalysis) {
      output += `\n📅 Weekend vs Weekday Analysis:\n`;
      output += `  • Average Weekend Price: $${analysis.weekendAnalysis.avgWeekendPrice}\n`;
      output += `  • Average Weekday Price: $${analysis.weekendAnalysis.avgWeekdayPrice}\n`;
      output += `  • Weekend Premium: ${analysis.weekendAnalysis.weekendPremium}%\n`;
    }

    output += `\n💡 Smart Recommendations:\n`;
    analysis.recommendations.forEach((rec: string) => {
      output += `  • ${rec}\n`;
    });

    output += `\n📈 Trend Analysis:\n`;
    output += `  • Price Trend: ${analysis.trendAnalysis.trendDirection}\n`;
    output += `  • Trend Strength: ${(analysis.trendAnalysis.trendStrength * 100).toFixed(1)}%\n`;
    output += `  • Price Volatility: ${(analysis.trendAnalysis.volatility * 100).toFixed(1)}%\n`;

    return output;
  }
}
