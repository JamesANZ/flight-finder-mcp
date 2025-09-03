import axios from "axios";
import {
  FlightSearchRequest,
  FlightSearchResponse,
  FlightItinerary,
  FlightSegment,
} from "../types/flight";

/**
 * Service for searching flights on Skyscanner
 * Note: This is a simplified implementation. In production, you would need to use
 * Skyscanner's official API or implement proper web scraping with rate limiting.
 */
export class SkyscannerService {
  private baseUrl = "https://www.skyscanner.net";
  private userAgent =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

  /**
   * Search for flights on Skyscanner
   * @param request Flight search parameters
   * @returns Promise with flight search results
   */
  async searchFlights(
    request: FlightSearchRequest,
  ): Promise<FlightSearchResponse> {
    try {
      // In a real implementation, you would:
      // 1. Use Skyscanner's official API if available
      // 2. Implement proper web scraping with Puppeteer
      // 3. Handle rate limiting and respect robots.txt
      // 4. Parse the HTML response to extract flight data

      // For now, returning mock data to demonstrate the structure
      const mockItineraries = this.generateMockItineraries(request);

      return {
        itineraries: mockItineraries,
        searchMetadata: {
          totalResults: mockItineraries.length,
          searchTime: new Date().toISOString(),
          origin: request.origin,
          destination: request.destination,
          dates: [request.departureDate, request.returnDate].filter(
            Boolean,
          ) as string[],
        },
      };
    } catch (error) {
      throw new Error(
        `Skyscanner search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Generate mock flight itineraries for demonstration
   * @param request Flight search request
   * @returns Array of mock flight itineraries
   */
  private generateMockItineraries(
    request: FlightSearchRequest,
  ): FlightItinerary[] {
    const airlines = [
      "British Airways",
      "Lufthansa",
      "Air France",
      "KLM",
      "Iberia",
    ];
    const mockItineraries: FlightItinerary[] = [];

    // Adjust base prices based on cabin class
    const cabinClassMultipliers = {
      economy: 1,
      premium_economy: 1.8,
      business: 3.5,
      first: 6.0,
    };

    const cabinClass = request.cabinClass || "economy";
    const baseMultiplier =
      cabinClassMultipliers[cabinClass as keyof typeof cabinClassMultipliers] ||
      1;

    for (let i = 0; i < 5; i++) {
      // Base price varies by cabin class and includes some randomness
      const basePrice = (200 + i * 50 + Math.random() * 100) * baseMultiplier;

      // Add some date-based variation (weekends more expensive)
      const date = new Date(request.departureDate);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const weekendMultiplier = isWeekend ? 1.2 : 1.0;

      const finalPrice = Math.round(basePrice * weekendMultiplier);

      const segments: FlightSegment[] = [
        {
          origin: request.origin,
          destination: request.destination,
          departureTime: `2024-${request.departureDate}T${10 + i}:00:00Z`,
          arrivalTime: `2024-${request.departureDate}T${12 + i}:00:00Z`,
          airline: airlines[i % airlines.length],
          flightNumber: `BA${1000 + i}`,
          aircraft: this.getAircraftForCabinClass(cabinClass),
          duration: "2h 0m",
          stops: 0,
        },
      ];

      if (request.returnDate) {
        segments.push({
          origin: request.destination,
          destination: request.origin,
          departureTime: `2024-${request.returnDate}T${14 + i}:00:00Z`,
          arrivalTime: `2024-${request.returnDate}T${16 + i}:00:00Z`,
          airline: airlines[i % airlines.length],
          flightNumber: `BA${2000 + i}`,
          aircraft: this.getAircraftForCabinClass(cabinClass),
          duration: "2h 0m",
          stops: 0,
        });
      }

      mockItineraries.push({
        id: `skyscanner_${i}`,
        price: {
          amount: finalPrice,
          currency: "USD",
          formatted: `$${finalPrice}`,
        },
        segments,
        totalDuration: request.returnDate ? "4h 0m" : "2h 0m",
        stops: 0,
        bookingLink: `${this.baseUrl}/flights/${request.origin}/${request.destination}/${request.departureDate}`,
        source: "skyscanner",
        searchDate: new Date().toISOString(),
      });
    }

    return mockItineraries;
  }

  /**
   * Get appropriate aircraft for cabin class
   */
  private getAircraftForCabinClass(cabinClass: string): string {
    switch (cabinClass) {
      case "business":
      case "first":
        return "Boeing 787 Dreamliner";
      case "premium_economy":
        return "Airbus A350";
      default:
        return "Airbus A320";
    }
  }

  /**
   * Get the best price for a route across multiple dates
   * @param origin Origin airport code
   * @param destination Destination airport code
   * @param dates Array of dates to search
   * @param passengers Passenger configuration
   * @returns Promise with the best price found
   */
  async getBestPriceAcrossDates(
    origin: string,
    destination: string,
    dates: string[],
    passengers: FlightSearchRequest["passengers"],
  ): Promise<{
    bestDate: string;
    bestPrice: number;
    allPrices: Array<{ date: string; price: number }>;
  }> {
    const allPrices: Array<{ date: string; price: number }> = [];

    for (const date of dates) {
      try {
        const result = await this.searchFlights({
          origin,
          destination,
          departureDate: date,
          passengers,
        });

        if (result.itineraries.length > 0) {
          const minPrice = Math.min(
            ...result.itineraries.map((it) => it.price.amount),
          );
          allPrices.push({ date, price: minPrice });
        }
      } catch (error) {
        console.warn(`Failed to search for date ${date}:`, error);
      }
    }

    if (allPrices.length === 0) {
      throw new Error("No flights found for any of the specified dates");
    }

    const bestPrice = allPrices.reduce((min, current) =>
      current.price < min.price ? current : min,
    );

    return {
      bestDate: bestPrice.date,
      bestPrice: bestPrice.price,
      allPrices,
    };
  }
}
