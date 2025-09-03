#!/usr/bin/env ts-node

/**
 * Basic usage example for the Flight Finder services
 * This demonstrates how to use the services directly without the MCP server
 */

import { SkyscannerService } from "../src/services/skyscanner";
import { GoogleFlightsService } from "../src/services/google-flights";
import { FlightAnalyzerService } from "../src/services/flight-analyzer";
import { FlightSearchRequest } from "../src/types/flight";

async function main() {
  console.log("✈️  Flight Finder Services Demo\n");

  // Initialize services
  const skyscannerService = new SkyscannerService();
  const googleFlightsService = new GoogleFlightsService();
  const analyzerService = new FlightAnalyzerService();

  // Example search request
  const searchRequest: FlightSearchRequest = {
    origin: "LAX",
    destination: "JFK",
    departureDate: "2024-12-01",
    returnDate: "2024-12-08",
    passengers: {
      adults: 2,
      children: 1,
    },
    cabinClass: "economy",
  };

  console.log("🔍 Searching for flights...\n");

  try {
    // Search Skyscanner
    console.log("📱 Searching Skyscanner...");
    const skyscannerResults =
      await skyscannerService.searchFlights(searchRequest);
    console.log(
      `Found ${skyscannerResults.itineraries.length} options on Skyscanner`,
    );

    // Search Google Flights
    console.log("🌐 Searching Google Flights...");
    const googleResults =
      await googleFlightsService.searchFlights(searchRequest);
    console.log(
      `Found ${googleResults.itineraries.length} options on Google Flights\n`,
    );

    // Analyze prices across multiple dates
    console.log("📊 Analyzing prices across multiple dates...");
    const dates = [
      "2024-12-01",
      "2024-12-02",
      "2024-12-03",
      "2024-12-04",
      "2024-12-05",
    ];

    const skyscannerBest = await skyscannerService.getBestPriceAcrossDates(
      searchRequest.origin,
      searchRequest.destination,
      dates,
      searchRequest.passengers,
    );

    const googleBest = await googleFlightsService.getBestPriceAcrossDates(
      searchRequest.origin,
      searchRequest.destination,
      dates,
      searchRequest.passengers,
    );

    console.log(
      `🏆 Best price on Skyscanner: $${skyscannerBest.bestPrice} on ${skyscannerBest.bestDate}`,
    );
    console.log(
      `🏆 Best price on Google Flights: $${googleBest.bestPrice} on ${googleBest.bestDate}`,
    );

    // Analyze flight details
    console.log("\n💡 Analyzing flight details...");
    const sampleItinerary = skyscannerResults.itineraries[0];
    const insights = analyzerService.analyzeFlightDetails(sampleItinerary);

    console.log("Flight Insights:");
    insights.forEach((insight) => {
      console.log(`  • ${insight}`);
    });

    // Show sample booking link
    console.log(`\n🔗 Sample booking link: ${sampleItinerary.bookingLink}`);
  } catch (error) {
    console.error("❌ Error during flight search:", error);
  }
}

// Run the demo
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
