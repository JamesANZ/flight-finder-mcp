import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { SkyscannerService } from "./services/skyscanner.js";
import { GoogleFlightsService } from "./services/google-flights.js";
import { FlightAnalyzerService } from "./services/flight-analyzer.js";
import {
  FlightSearchRequest,
  FlightSearchResponse,
  PriceAnalysis,
} from "./types/flight.js";

/**
 * Flight Finder MCP Server
 *
 * This server provides tools for searching flights across multiple sources,
 * analyzing prices across different dates, and providing booking recommendations.
 */
class FlightFinderMCPServer {
  private server: Server;
  private skyscannerService: SkyscannerService;
  private googleFlightsService: GoogleFlightsService;
  private analyzerService: FlightAnalyzerService;

  constructor() {
    this.skyscannerService = new SkyscannerService();
    this.googleFlightsService = new GoogleFlightsService();
    this.analyzerService = new FlightAnalyzerService();

    this.server = new Server({
      name: "flight-finder-mcp",
      version: "1.0.0",
    });

    this.setupToolHandlers();
  }

  /**
   * Set up MCP tool handlers
   */
  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "search_flights",
            description:
              "Search for flights from a specific source (Skyscanner or Google Flights)",
            inputSchema: {
              type: "object",
              properties: {
                source: {
                  type: "string",
                  enum: ["skyscanner", "google_flights"],
                  description: "Flight search source to use",
                },
                origin: {
                  type: "string",
                  description: "Origin airport code (e.g., LAX, JFK)",
                },
                destination: {
                  type: "string",
                  description: "Destination airport code (e.g., SFO, LHR)",
                },
                departureDate: {
                  type: "string",
                  description: "Departure date in YYYY-MM-DD format",
                },
                returnDate: {
                  type: "string",
                  description:
                    "Return date in YYYY-MM-DD format (optional for one-way flights)",
                },
                passengers: {
                  type: "object",
                  properties: {
                    adults: { type: "number", minimum: 1 },
                    children: { type: "number", minimum: 0 },
                    infants: { type: "number", minimum: 0 },
                  },
                  required: ["adults"],
                },
                cabinClass: {
                  type: "string",
                  enum: ["economy", "premium_economy", "business", "first"],
                  default: "economy",
                },
              },
              required: [
                "source",
                "origin",
                "destination",
                "departureDate",
                "passengers",
              ],
            },
          },
          {
            name: "search_multiple_dates",
            description:
              "Search for flights across multiple dates to find the best prices",
            inputSchema: {
              type: "object",
              properties: {
                origin: {
                  type: "string",
                  description: "Origin airport code (e.g., LAX, JFK)",
                },
                destination: {
                  type: "string",
                  description: "Destination airport code (e.g., SFO, LHR)",
                },
                dates: {
                  type: "array",
                  items: { type: "string" },
                  description: "Array of dates to search in YYYY-MM-DD format",
                },
                passengers: {
                  type: "object",
                  properties: {
                    adults: { type: "number", minimum: 1 },
                    children: { type: "number", minimum: 0 },
                    infants: { type: "number", minimum: 0 },
                  },
                  required: ["adults"],
                },
                sources: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: ["skyscanner", "google_flights"],
                  },
                  default: ["skyscanner", "google_flights"],
                  description: "Flight search sources to use",
                },
              },
              required: ["origin", "destination", "dates", "passengers"],
            },
          },
          {
            name: "analyze_flight_details",
            description:
              "Analyze flight details and provide insights and recommendations",
            inputSchema: {
              type: "object",
              properties: {
                itinerary: {
                  type: "object",
                  description: "Flight itinerary object to analyze",
                },
              },
              required: ["itinerary"],
            },
          },
          {
            name: "get_best_price_recommendation",
            description:
              "Get the best price recommendation across multiple dates with analysis",
            inputSchema: {
              type: "object",
              properties: {
                origin: {
                  type: "string",
                  description: "Origin airport code (e.g., LAX, JFK)",
                },
                destination: {
                  type: "string",
                  description: "Destination airport code (e.g., SFO, LHR)",
                },
                dates: {
                  type: "array",
                  items: { type: "string" },
                  description: "Array of dates to search in YYYY-MM-DD format",
                },
                passengers: {
                  type: "object",
                  properties: {
                    adults: { type: "number", minimum: 1 },
                    children: { type: "number", minimum: 0 },
                    infants: { type: "number", minimum: 0 },
                  },
                  required: ["adults"],
                },
              },
              required: ["origin", "destination", "dates", "passengers"],
            },
          },
          {
            name: "find_best_monthly_flights",
            description:
              "Find the best flights for a specific month, analyzing prices across all dates to identify optimal travel dates",
            inputSchema: {
              type: "object",
              properties: {
                origin: {
                  type: "string",
                  description: "Origin airport code (e.g., LAX, JFK)",
                },
                destination: {
                  type: "string",
                  description: "Destination airport code (e.g., SFO, LHR)",
                },
                month: {
                  type: "string",
                  description:
                    "Month to search in YYYY-MM format (e.g., 2024-11)",
                },
                passengers: {
                  type: "object",
                  properties: {
                    adults: { type: "number", minimum: 1 },
                    children: { type: "number", minimum: 0 },
                    infants: { type: "number", minimum: 0 },
                  },
                  required: ["adults"],
                },
                cabinClass: {
                  type: "string",
                  enum: ["economy", "premium_economy", "business", "first"],
                  default: "economy",
                  description: "Cabin class preference",
                },
                sources: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: ["skyscanner", "google_flights"],
                  },
                  default: ["skyscanner", "google_flights"],
                  description: "Flight search sources to use",
                },
                includeWeekendAnalysis: {
                  type: "boolean",
                  default: true,
                  description:
                    "Whether to include weekend vs weekday price analysis",
                },
              },
              required: ["origin", "destination", "month", "passengers"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "search_flights":
            return await this.handleSearchFlights(args as any);

          case "search_multiple_dates":
            return await this.handleSearchMultipleDates(args as any);

          case "analyze_flight_details":
            return await this.handleAnalyzeFlightDetails(args as any);

          case "get_best_price_recommendation":
            return await this.handleGetBestPriceRecommendation(args as any);

          case "find_best_monthly_flights":
            return await this.handleFindBestMonthlyFlights(args as any);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
            },
          ],
        };
      }
    });
  }

  /**
   * Handle flight search request
   */
  private async handleSearchFlights(args: any): Promise<any> {
    const { source, ...searchParams } = args;
    const request: FlightSearchRequest = searchParams;

    let results: FlightSearchResponse;

    switch (source) {
      case "skyscanner":
        results = await this.skyscannerService.searchFlights(request);
        break;
      case "google_flights":
        results = await this.googleFlightsService.searchFlights(request);
        break;
      default:
        throw new Error(`Unsupported source: ${source}`);
    }

    return {
      content: [
        {
          type: "text",
          text: this.formatFlightSearchResults(results, source),
        },
      ],
    };
  }

  /**
   * Handle multiple date search request
   */
  private async handleSearchMultipleDates(args: any): Promise<any> {
    const {
      origin,
      destination,
      dates,
      passengers,
      sources = ["skyscanner", "google_flights"],
    } = args;

    const allResults: Array<{ date: string; results: FlightSearchResponse }> =
      [];

    for (const date of dates) {
      for (const source of sources) {
        try {
          const request: FlightSearchRequest = {
            origin,
            destination,
            departureDate: date,
            passengers,
          };

          let results: FlightSearchResponse;
          if (source === "skyscanner") {
            results = await this.skyscannerService.searchFlights(request);
          } else {
            results = await this.googleFlightsService.searchFlights(request);
          }

          allResults.push({ date, results });
        } catch (error) {
          console.warn(`Failed to search ${source} for date ${date}:`, error);
        }
      }
    }

    if (allResults.length === 0) {
      throw new Error("No flights found for any of the specified dates");
    }

    const analysis = this.analyzerService.analyzePricesAcrossDates(allResults);

    return {
      content: [
        {
          type: "text",
          text: this.formatMultipleDateResults(allResults, analysis),
        },
      ],
    };
  }

  /**
   * Handle flight details analysis request
   */
  private async handleAnalyzeFlightDetails(args: any): Promise<any> {
    const { itinerary } = args;
    const insights = this.analyzerService.analyzeFlightDetails(itinerary);

    return {
      content: [
        {
          type: "text",
          text: this.formatFlightInsights(itinerary, insights),
        },
      ],
    };
  }

  /**
   * Handle best price recommendation request
   */
  private async handleGetBestPriceRecommendation(args: any): Promise<any> {
    const { origin, destination, dates, passengers } = args;

    // Get best prices from both sources
    const skyscannerBest = await this.skyscannerService.getBestPriceAcrossDates(
      origin,
      destination,
      dates,
      passengers,
    );
    const googleBest = await this.googleFlightsService.getBestPriceAcrossDates(
      origin,
      destination,
      dates,
      passengers,
    );

    // Determine overall best
    const overallBest =
      skyscannerBest.bestPrice < googleBest.bestPrice
        ? skyscannerBest
        : googleBest;
    const bestSource =
      skyscannerBest.bestPrice < googleBest.bestPrice
        ? "Skyscanner"
        : "Google Flights";

    return {
      content: [
        {
          type: "text",
          text: this.formatBestPriceRecommendation(
            origin,
            destination,
            overallBest,
            bestSource,
            skyscannerBest,
            googleBest,
          ),
        },
      ],
    };
  }

  /**
   * Handle monthly flight search request
   */
  private async handleFindBestMonthlyFlights(args: any): Promise<any> {
    const {
      origin,
      destination,
      month,
      passengers,
      cabinClass = "economy",
      sources = ["skyscanner", "google_flights"],
      includeWeekendAnalysis = true,
    } = args;

    try {
      // Generate all dates for the month
      const dates = this.generateMonthDates(month);

      // Search across all dates and sources
      const allResults: Array<{
        date: string;
        source: string;
        results: FlightSearchResponse;
        cabinClass: string;
      }> = [];

      for (const date of dates) {
        for (const source of sources) {
          try {
            const request: FlightSearchRequest = {
              origin,
              destination,
              departureDate: date,
              passengers,
              cabinClass,
            };

            let results: FlightSearchResponse;
            if (source === "skyscanner") {
              results = await this.skyscannerService.searchFlights(request);
            } else {
              results = await this.googleFlightsService.searchFlights(request);
            }

            if (results.itineraries.length > 0) {
              allResults.push({ date, source, results, cabinClass });
            }
          } catch (error) {
            console.warn(`Failed to search ${source} for date ${date}:`, error);
          }
        }
      }

      if (allResults.length === 0) {
        throw new Error(
          `No flights found for ${month} from ${origin} to ${destination} in ${cabinClass} class`,
        );
      }

      // Analyze the results
      const analysis = this.analyzerService.analyzeMonthlyFlightData(
        allResults,
        includeWeekendAnalysis,
      );

      // Get top recommendations
      const topRecommendations = this.getTopFlightRecommendations(
        allResults,
        analysis,
      );

      return {
        content: [
          {
            type: "text",
            text: this.formatMonthlyFlightResults(
              origin,
              destination,
              month,
              cabinClass,
              analysis,
              topRecommendations,
              allResults,
            ),
          },
        ],
      };
    } catch (error) {
      throw new Error(
        `Monthly flight search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Format flight search results for display
   */
  private formatFlightSearchResults(
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
      output += `💰 Price: ${itinerary.price.formatted}\n`;
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
   * Format multiple date search results
   */
  private formatMultipleDateResults(
    allResults: Array<{ date: string; results: FlightSearchResponse }>,
    analysis: PriceAnalysis,
  ): string {
    let output = `📊 Multi-Date Flight Analysis\n\n`;
    output += `💰 Price Summary:\n`;
    output += `  • Cheapest: ${analysis.cheapestDate} at $${analysis.cheapestPrice}\n`;
    output += `  • Most Expensive: ${analysis.mostExpensiveDate} at $${analysis.mostExpensivePrice}\n`;
    output += `  • Average: $${analysis.averagePrice}\n`;
    output += `  • Price Range: $${analysis.priceRange}\n\n`;

    output += `💡 Recommendations:\n`;
    analysis.recommendations.forEach((rec) => {
      output += `  • ${rec}\n`;
    });

    return output;
  }

  /**
   * Format flight insights
   */
  private formatFlightInsights(itinerary: any, insights: string[]): string {
    let output = `✈️ Flight Analysis\n\n`;
    output += `💰 Price: ${itinerary.price.formatted}\n`;
    output += `⏱️  Duration: ${itinerary.totalDuration}\n`;
    output += `🛫 Stops: ${itinerary.stops}\n\n`;

    output += `💡 Insights:\n`;
    insights.forEach((insight) => {
      output += `  • ${insight}\n`;
    });

    return output;
  }

  /**
   * Format best price recommendation
   */
  private formatBestPriceRecommendation(
    origin: string,
    destination: string,
    overallBest: any,
    bestSource: string,
    skyscannerBest: any,
    googleBest: any,
  ): string {
    let output = `🏆 Best Price Recommendation\n\n`;
    output += `📍 Route: ${origin} → ${destination}\n`;
    output += `💰 Best Overall: ${bestSource} on ${overallBest.bestDate} at $${overallBest.bestPrice}\n\n`;

    output += `📊 Price Comparison:\n`;
    output += `  • Skyscanner: ${skyscannerBest.bestDate} at $${skyscannerBest.bestPrice}\n`;
    output += `  • Google Flights: ${googleBest.bestDate} at $${googleBest.bestPrice}\n\n`;

    output += `📅 All Prices by Date:\n`;
    [...skyscannerBest.allPrices, ...googleBest.allPrices]
      .sort((a, b) => a.price - b.price)
      .slice(0, 10)
      .forEach((price, index) => {
        output += `  ${index + 1}. ${price.date}: $${price.price}\n`;
      });

    return output;
  }

  /**
   * Generate all dates for a given month
   */
  private generateMonthDates(month: string): string[] {
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
   * Get top flight recommendations based on price and analysis
   */
  private getTopFlightRecommendations(
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
            current.price.amount < min.price.amount ? current : min,
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
   * Format monthly flight results
   */
  private formatMonthlyFlightResults(
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
    output += `  • Cheapest Date: ${analysis.cheapestDate} at $${analysis.cheapestPrice}\n`;
    output += `  • Most Expensive Date: ${analysis.mostExpensiveDate} at $${analysis.mostExpensivePrice}\n`;
    output += `  • Average Price: $${analysis.averagePrice}\n`;
    output += `  • Price Range: $${analysis.priceRange}\n`;
    output += `  • Total Dates Searched: ${allResults.length}\n\n`;

    if (analysis.weekendAnalysis) {
      output += `📅 Weekend vs Weekday Analysis:\n`;
      output += `  • Average Weekend Price: $${analysis.weekendAnalysis.avgWeekendPrice}\n`;
      output += `  • Average Weekday Price: $${analysis.weekendAnalysis.avgWeekdayPrice}\n`;
      output += `  • Weekend Premium: ${analysis.weekendAnalysis.weekendPremium}%\n\n`;
    }

    output += `💡 Smart Recommendations:\n`;
    analysis.recommendations.forEach((rec: string) => {
      output += `  • ${rec}\n`;
    });

    output += `\n🔗 Booking Links:\n`;
    topRecommendations.slice(0, 3).forEach((rec, index) => {
      output += `  ${index + 1}. ${rec.date}: ${rec.itinerary.bookingLink}\n`;
    });

    return output;
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Flight Finder MCP Server started");
  }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new FlightFinderMCPServer();
  server.start().catch(console.error);
}
