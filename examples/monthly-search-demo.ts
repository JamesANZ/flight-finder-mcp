#!/usr/bin/env ts-node

/**
 * Monthly Flight Search Demo
 * This demonstrates the new monthly flight search capabilities with cabin class analysis
 */

import { SkyscannerService } from "../src/services/skyscanner";
import { GoogleFlightsService } from "../src/services/google-flights";
import { FlightAnalyzerService } from "../src/services/flight-analyzer";
import { FlightSearchRequest } from "../src/types/flight";

async function main() {
  console.log("✈️  Monthly Flight Search Demo\n");

  // Initialize services
  const skyscannerService = new SkyscannerService();
  const googleFlightsService = new GoogleFlightsService();
  const analyzerService = new FlightAnalyzerService();

  // Example: Search for business class flights from LAX to JFK in November 2024
  const origin = "LAX";
  const destination = "JFK";
  const month = "2024-11";
  const passengers = { adults: 2 };

  console.log(
    `🔍 Searching for ${month} flights from ${origin} to ${destination}\n`,
  );

  try {
    // Generate all dates for November 2024
    const dates = generateMonthDates(month);
    console.log(`📅 Generated ${dates.length} dates for ${month}\n`);

    // Search for business class flights
    console.log("💼 Searching for Business Class flights...\n");

    const businessClassResults: Array<{
      date: string;
      source: string;
      results: any;
      cabinClass: string;
    }> = [];

    // Search Skyscanner
    for (const date of dates.slice(0, 10)) {
      // Limit to first 10 dates for demo
      try {
        const request: FlightSearchRequest = {
          origin,
          destination,
          departureDate: date,
          passengers,
          cabinClass: "business",
        };

        const results = await skyscannerService.searchFlights(request);
        if (results.itineraries.length > 0) {
          businessClassResults.push({
            date,
            source: "skyscanner",
            results,
            cabinClass: "business",
          });
        }
      } catch (error) {
        console.warn(`Failed to search Skyscanner for ${date}:`, error);
      }
    }

    // Search Google Flights
    for (const date of dates.slice(0, 10)) {
      // Limit to first 10 dates for demo
      try {
        const request: FlightSearchRequest = {
          origin,
          destination,
          departureDate: date,
          passengers,
          cabinClass: "business",
        };

        const results = await googleFlightsService.searchFlights(request);
        if (results.itineraries.length > 0) {
          businessClassResults.push({
            date,
            source: "google_flights",
            results,
            cabinClass: "business",
          });
        }
      } catch (error) {
        console.warn(`Failed to search Google Flights for ${date}:`, error);
      }
    }

    if (businessClassResults.length === 0) {
      console.log("❌ No business class flights found for the specified dates");
      return;
    }

    console.log(`✅ Found ${businessClassResults.length} search results\n`);

    // Analyze the monthly data
    console.log("📊 Analyzing monthly flight data...\n");
    const analysis = analyzerService.analyzeMonthlyFlightData(
      businessClassResults,
      true,
    );

    // Display comprehensive analysis
    displayMonthlyAnalysis(
      origin,
      destination,
      month,
      "business",
      analysis,
      businessClassResults,
    );

    // Compare with economy class
    console.log("\n" + "=".repeat(60) + "\n");
    console.log("💰 Comparing Business vs Economy Class...\n");

    const economyResults: Array<{
      date: string;
      source: string;
      results: any;
      cabinClass: string;
    }> = [];

    // Search for economy class on the same dates
    for (const date of dates.slice(0, 5)) {
      // Limit to first 5 dates for comparison
      try {
        const request: FlightSearchRequest = {
          origin,
          destination,
          departureDate: date,
          passengers,
          cabinClass: "economy",
        };

        const skyscannerResults =
          await skyscannerService.searchFlights(request);
        if (skyscannerResults.itineraries.length > 0) {
          economyResults.push({
            date,
            source: "skyscanner",
            results: skyscannerResults,
            cabinClass: "economy",
          });
        }

        const googleResults = await googleFlightsService.searchFlights(request);
        if (googleResults.itineraries.length > 0) {
          economyResults.push({
            date,
            source: "google_flights",
            results: googleResults,
            cabinClass: "economy",
          });
        }
      } catch (error) {
        console.warn(`Failed to search economy class for ${date}:`, error);
      }
    }

    if (economyResults.length > 0) {
      const economyAnalysis = analyzerService.analyzeMonthlyFlightData(
        economyResults,
        false,
      );

      console.log("📊 Business vs Economy Class Comparison:");
      console.log(`  • Business Class Average: $${analysis.averagePrice}`);
      console.log(
        `  • Economy Class Average: $${economyAnalysis.averagePrice}`,
      );
      console.log(
        `  • Business Class Premium: ${Math.round(((analysis.averagePrice - economyAnalysis.averagePrice) / economyAnalysis.averagePrice) * 100)}%`,
      );

      // Find the best value dates
      const bestValueDates = findBestValueDates(
        businessClassResults,
        economyResults,
      );
      if (bestValueDates.length > 0) {
        console.log(
          "\n💡 Best Value Business Class Dates (closest to economy pricing):",
        );
        bestValueDates.forEach((date, index) => {
          console.log(
            `  ${index + 1}. ${date.date}: Business $${date.businessPrice} vs Economy $${date.economyPrice}`,
          );
        });
      }
    }
  } catch (error) {
    console.error("❌ Error during monthly flight search:", error);
  }
}

/**
 * Generate all dates for a given month
 */
function generateMonthDates(month: string): string[] {
  const [year, monthNum] = month.split("-").map(Number);
  const dates: string[] = [];

  // Get the first day of the month
  const firstDay = new Date(year, monthNum - 1, 1);
  // Get the last day of the month
  const lastDay = new Date(year, monthNum, 0);

  // Generate all dates in the month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, monthNum - 1, day);
    dates.push(date.toISOString().split("T")[0]);
  }

  return dates;
}

/**
 * Display comprehensive monthly analysis
 */
function displayMonthlyAnalysis(
  origin: string,
  destination: string,
  month: string,
  cabinClass: string,
  analysis: any,
  allResults: Array<{
    date: string;
    source: string;
    results: any;
    cabinClass: string;
  }>,
) {
  console.log(`📅 Monthly Flight Analysis for ${month}`);
  console.log(`📍 Route: ${origin} → ${destination}`);
  console.log(
    `✈️  Cabin Class: ${cabinClass.charAt(0).toUpperCase() + cabinClass.slice(1)}`,
  );
  console.log(
    `🔍 Sources: ${allResults
      .map((r) => r.source)
      .filter((v, i, a) => a.indexOf(v) === i)
      .join(", ")}\n`,
  );

  console.log(`📊 Price Analysis:`);
  console.log(
    `  • Cheapest Date: ${analysis.cheapestDate} at $${analysis.cheapestPrice} on ${analysis.cheapestSource}`,
  );
  console.log(
    `  • Most Expensive Date: ${analysis.mostExpensiveDate} at $${analysis.mostExpensivePrice} on ${analysis.mostExpensiveSource}`,
  );
  console.log(`  • Average Price: $${analysis.averagePrice}`);
  console.log(`  • Price Range: $${analysis.priceRange}`);
  console.log(`  • Total Dates Searched: ${analysis.totalDates}\n`);

  if (analysis.weekendAnalysis) {
    console.log(`📅 Weekend vs Weekday Analysis:`);
    console.log(
      `  • Average Weekend Price: $${analysis.weekendAnalysis.avgWeekendPrice}`,
    );
    console.log(
      `  • Average Weekday Price: $${analysis.weekendAnalysis.avgWeekdayPrice}`,
    );
    console.log(
      `  • Weekend Premium: ${analysis.weekendAnalysis.weekendPremium}%\n`,
    );
  }

  console.log(`💡 Smart Recommendations:`);
  analysis.recommendations.forEach((rec: string) => {
    console.log(`  • ${rec}`);
  });

  console.log(`\n📈 Trend Analysis:`);
  console.log(`  • Price Trend: ${analysis.trendAnalysis.trendDirection}`);
  console.log(
    `  • Trend Strength: ${(analysis.trendAnalysis.trendStrength * 100).toFixed(1)}%`,
  );
  console.log(
    `  • Price Volatility: ${(analysis.trendAnalysis.volatility * 100).toFixed(1)}%`,
  );
}

/**
 * Find the best value business class dates (closest to economy pricing)
 */
function findBestValueDates(
  businessResults: Array<{
    date: string;
    source: string;
    results: any;
    cabinClass: string;
  }>,
  economyResults: Array<{
    date: string;
    source: string;
    results: any;
    cabinClass: string;
  }>,
): Array<{
  date: string;
  businessPrice: number;
  economyPrice: number;
  valueRatio: number;
}> {
  const valueDates: Array<{
    date: string;
    businessPrice: number;
    economyPrice: number;
    valueRatio: number;
  }> = [];

  // Group economy results by date
  const economyByDate = economyResults.reduce(
    (acc, result) => {
      if (!acc[result.date]) {
        acc[result.date] = [];
      }
      acc[result.date].push(result);
      return acc;
    },
    {} as Record<string, any[]>,
  );

  // Find matching dates and calculate value ratios
  businessResults.forEach((businessResult) => {
    const economyResultsForDate = economyByDate[businessResult.date];
    if (economyResultsForDate) {
      const businessPrice = Math.min(
        ...businessResult.results.itineraries.map((it: any) => it.price.amount),
      );
      const economyPrice = Math.min(
        ...economyResultsForDate.flatMap((r) =>
          r.results.itineraries.map((it: any) => it.price.amount),
        ),
      );

      valueDates.push({
        date: businessResult.date,
        businessPrice,
        economyPrice,
        valueRatio: businessPrice / economyPrice,
      });
    }
  });

  // Sort by value ratio (closest to 1.0 is best value)
  return valueDates
    .sort((a, b) => Math.abs(a.valueRatio - 1) - Math.abs(b.valueRatio - 1))
    .slice(0, 3);
}

// Run the demo
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
