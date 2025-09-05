import {
  FlightSearchRequest,
  FlightSearchResponse,
  FlightItinerary,
  FlightSegment,
} from "../types/flight.js";

// SearchAPI configuration for Google Flights
const SEARCHAPI_BASE = "https://www.searchapi.io/api/v1/search";
const SEARCHAPI_KEY = process.env.SEARCHAPI_KEY;

export class GoogleFlightsAPIService {
  /**
   * Search for flights using SearchAPI (Google Flights alternative)
   */
  async searchFlights(
    request: FlightSearchRequest,
  ): Promise<FlightSearchResponse> {
    if (!SEARCHAPI_KEY) {
      throw new Error(
        "SearchAPI key not configured. Please set SEARCHAPI_KEY environment variable.",
      );
    }

    const params = new URLSearchParams({
      api_key: SEARCHAPI_KEY,
      engine: "google_flights",
      flight_type: request.returnDate ? "round_trip" : "one_way",
      departure_id: request.origin,
      arrival_id: request.destination,
      outbound_date: request.departureDate,
      adults: request.passengers.adults.toString(),
      children: (request.passengers.children || 0).toString(),
      infants_in_seat: (request.passengers.infants || 0).toString(),
      travel_class: request.cabinClass || "economy",
      currency: "USD",
      gl: "us",
      hl: "en",
    });

    if (request.returnDate) {
      params.append("return_date", request.returnDate);
    }

    const response = await fetch(`${SEARCHAPI_BASE}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(
        `SearchAPI request failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    return this.convertSearchAPIResponseToFlightSearchResponse(data, request);
  }

  /**
   * Convert SearchAPI response to our FlightSearchResponse format
   */
  private convertSearchAPIResponseToFlightSearchResponse(
    apiResponse: any,
    request: FlightSearchRequest,
  ): FlightSearchResponse {
    const itineraries: FlightItinerary[] = [];

    if (apiResponse.best_flights && Array.isArray(apiResponse.best_flights)) {
      for (const [index, flight] of apiResponse.best_flights.entries()) {
        const segments: FlightSegment[] = [];

        if (flight.flights && Array.isArray(flight.flights)) {
          for (const [segIndex, segment] of flight.flights.entries()) {
            segments.push({
              id: `segment-${index}-${segIndex}`,
              origin: segment.departure_airport?.id || request.origin,
              destination: segment.arrival_airport?.id || request.destination,
              departureTime: segment.departure_airport?.time || "08:00",
              arrivalTime: segment.arrival_airport?.time || "12:00",
              airline: segment.airline || "Unknown",
              flightNumber: segment.flight_number || `GF${1000 + index}`,
              duration: segment.duration
                ? `${Math.floor(segment.duration / 60)}h ${segment.duration % 60}m`
                : "Unknown",
              stops: 0, // SearchAPI doesn't provide stops info directly
              cabinClass: request.cabinClass || "economy",
            });
          }
        }

        itineraries.push({
          id: `google-flights-${index + 1}`,
          price: {
            amount: flight.price || 0,
            currency: "USD",
            originalAmount: flight.price,
          },
          totalDuration: flight.total_duration
            ? `${Math.floor(flight.total_duration / 60)}h ${flight.total_duration % 60}m`
            : "Unknown",
          stops: 0, // Default to 0 stops
          segments,
          bookingLink: flight.booking_token
            ? `https://www.google.com/travel/flights/booking?token=${flight.booking_token}`
            : "#",
          source: "google_flights",
        });
      }
    }

    return {
      itineraries,
      searchMetadata: {
        totalResults: itineraries.length,
        searchTime: new Date().toISOString(),
        origin: request.origin,
        destination: request.destination,
        dates: [request.departureDate],
        source: "google_flights",
      },
    };
  }

  /**
   * Get best price across multiple dates using SearchAPI
   */
  async getBestPriceAcrossDates(
    origin: string,
    destination: string,
    dates: string[],
    passengers: any,
  ): Promise<any> {
    const results = [];

    for (const date of dates) {
      try {
        const request: FlightSearchRequest = {
          source: "google_flights",
          origin,
          destination,
          departureDate: date,
          passengers,
          cabinClass: "economy",
        };

        const response = await this.searchFlights(request);
        if (response.itineraries.length > 0) {
          const minPrice = Math.min(
            ...response.itineraries.map((it) => it.price.amount),
          );
          results.push({ date, price: minPrice });
        }
      } catch (error) {
        console.warn(
          `Failed to search Google Flights API for date ${date}:`,
          error,
        );
      }
    }

    if (results.length === 0) {
      throw new Error("No results found for any date");
    }

    const bestResult = results.reduce((min, current) =>
      current.price < min.price ? current : min,
    );

    return {
      bestDate: bestResult.date,
      bestPrice: bestResult.price,
      allPrices: results,
    };
  }
}
