import { FlightSearchRequest, FlightSearchResponse } from "../types/flight.js";
import { SkyscannerService } from "../services/skyscanner.js";
import { GoogleFlightsService } from "../services/google-flights.js";

export class FlightSearchHelper {
  constructor(
    private skyscannerService: SkyscannerService,
    private googleFlightsService: GoogleFlightsService,
  ) {}

  /**
   * Search for flights from a specific source
   */
  async searchFlights(
    request: FlightSearchRequest,
  ): Promise<FlightSearchResponse> {
    const { source } = request;

    switch (source) {
      case "skyscanner":
        return await this.skyscannerService.searchFlights(request);
      case "google_flights":
        return await this.googleFlightsService.searchFlights(request);
      default:
        throw new Error(`Unsupported source: ${source}`);
    }
  }

  /**
   * Search for flights across multiple dates
   */
  async searchMultipleDates(args: any): Promise<any> {
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
            source,
            origin,
            destination,
            departureDate: date,
            passengers,
            cabinClass: "economy",
          };

          let results: FlightSearchResponse;
          if (source === "skyscanner") {
            results = await this.skyscannerService.searchFlights(request);
          } else {
            results = await this.googleFlightsService.searchFlights(request);
          }

          if (results.itineraries.length > 0) {
            allResults.push({ date, results });
          }
        } catch (error) {
          console.warn(`Failed to search ${source} for date ${date}:`, error);
        }
      }
    }

    if (allResults.length === 0) {
      throw new Error("No flights found for any of the specified dates");
    }

    return allResults;
  }

  /**
   * Get best price recommendation across multiple dates
   */
  async getBestPriceRecommendation(args: any): Promise<any> {
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
      overallBest,
      bestSource,
      skyscannerBest,
      googleBest,
    };
  }

  /**
   * Find best monthly flights
   */
  async findBestMonthlyFlights(args: any): Promise<any> {
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
              source,
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
              allResults.push({
                date,
                source,
                results,
                cabinClass,
              });
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

      return allResults;
    } catch (error) {
      throw new Error(
        `Monthly flight search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
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
}
