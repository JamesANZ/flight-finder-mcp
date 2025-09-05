import {
  FlightSearchRequest,
  FlightSearchResponse,
  FlightItinerary,
  FlightSegment,
} from "../types/flight.js";

// Skyscanner API configuration
const SKYSCANNER_API_BASE =
  "https://partners.api.skyscanner.net/apiservices/v3";
const SKYSCANNER_API_KEY = process.env.SKYSCANNER_API_KEY;

export class SkyscannerAPIService {
  /**
   * Search for flights using Skyscanner official API
   */
  async searchFlights(
    request: FlightSearchRequest,
  ): Promise<FlightSearchResponse> {
    if (!SKYSCANNER_API_KEY) {
      throw new Error(
        "Skyscanner API key not configured. Please set SKYSCANNER_API_KEY environment variable.",
      );
    }

    // Create search session
    const createResponse = await fetch(
      `${SKYSCANNER_API_BASE}/flights/live/search/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": SKYSCANNER_API_KEY,
        },
        body: JSON.stringify({
          market: "US",
          locale: "en-US",
          currency: "USD",
          queryLegs: [
            {
              originPlaceId: { iata: request.origin },
              destinationPlaceId: { iata: request.destination },
              date: {
                year: parseInt(request.departureDate.split("-")[0]),
                month: parseInt(request.departureDate.split("-")[1]),
                day: parseInt(request.departureDate.split("-")[2]),
              },
            },
          ],
          adults: request.passengers.adults,
          childrenAges: request.passengers.children
            ? Array(request.passengers.children).fill(10)
            : [],
          cabinClass: request.cabinClass?.toUpperCase() || "ECONOMY",
          includeSustainabilityData: true,
        }),
      },
    );

    if (!createResponse.ok) {
      throw new Error(
        `Skyscanner API create failed: ${createResponse.status} ${createResponse.statusText}`,
      );
    }

    const createData = await createResponse.json();
    const sessionToken = createData.sessionToken;

    // Poll for results
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

      const pollResponse = await fetch(
        `${SKYSCANNER_API_BASE}/flights/live/search/poll/${sessionToken}`,
        {
          method: "POST",
          headers: {
            "X-API-Key": SKYSCANNER_API_KEY,
          },
        },
      );

      if (!pollResponse.ok) {
        throw new Error(
          `Skyscanner API poll failed: ${pollResponse.status} ${pollResponse.statusText}`,
        );
      }

      const pollData = await pollResponse.json();

      if (pollData.status === "RESULT_STATUS_COMPLETE") {
        return this.convertAPIResponseToFlightSearchResponse(pollData, request);
      }

      attempts++;
    }

    throw new Error("Skyscanner API search timed out");
  }

  /**
   * Convert Skyscanner API response to our FlightSearchResponse format
   */
  private convertAPIResponseToFlightSearchResponse(
    apiResponse: any,
    request: FlightSearchRequest,
  ): FlightSearchResponse {
    const itineraries: FlightItinerary[] = [];

    if (apiResponse.content && apiResponse.content.results) {
      for (const [itineraryId, itinerary] of Object.entries(
        apiResponse.content.results.itineraries,
      )) {
        const itin = itinerary as any;
        const segments: FlightSegment[] = [];

        // Convert legs to segments
        for (const legId of itin.legIds) {
          const leg = apiResponse.content.results.legs[legId];
          if (leg) {
            for (const segmentId of leg.segmentIds) {
              const segment = apiResponse.content.results.segments[segmentId];
              if (segment) {
                const originPlace =
                  apiResponse.content.results.places[segment.originPlaceId];
                const destinationPlace =
                  apiResponse.content.results.places[
                    segment.destinationPlaceId
                  ];
                const carrier =
                  apiResponse.content.results.carriers[
                    segment.marketingCarrierId
                  ];

                segments.push({
                  id: segmentId,
                  origin: originPlace?.iata || segment.originPlaceId,
                  destination:
                    destinationPlace?.iata || segment.destinationPlaceId,
                  departureTime: segment.departingAt,
                  arrivalTime: segment.arrivingAt,
                  airline: carrier?.name || "Unknown",
                  flightNumber: segment.marketingFlightNumber,
                  duration: segment.durationInMinutes
                    ? `${Math.floor(segment.durationInMinutes / 60)}h ${segment.durationInMinutes % 60}m`
                    : "Unknown",
                  stops: segment.stops?.length || 0,
                  layoverDuration: segment.stops?.[0]?.durationInMinutes
                    ? `${Math.floor(segment.stops[0].durationInMinutes / 60)}h ${segment.stops[0].durationInMinutes % 60}m`
                    : undefined,
                  cabinClass: request.cabinClass || "economy",
                });
              }
            }
          }
        }

        const agent = apiResponse.content.results.agents[itin.agentIds[0]];

        itineraries.push({
          id: itineraryId,
          price: {
            amount: itin.pricingOptions?.[0]?.price?.amount || 0,
            currency: itin.pricingOptions?.[0]?.price?.currency || "USD",
            originalAmount: itin.pricingOptions?.[0]?.price?.amount,
          },
          totalDuration: this.calculateTotalDuration(segments),
          stops: Math.max(...segments.map((s) => s.stops), 0),
          segments,
          bookingLink: agent?.url || "#",
          source: "skyscanner",
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
        source: "skyscanner",
      },
    };
  }

  /**
   * Calculate total duration from segments
   */
  private calculateTotalDuration(segments: FlightSegment[]): string {
    if (segments.length === 0) return "0h 0m";

    const totalMinutes = segments.reduce((total, segment) => {
      const duration = segment.duration;
      const hours = parseInt(duration.split("h")[0]) || 0;
      const minutes = parseInt(duration.split("h")[1]?.split("m")[0]) || 0;
      return total + hours * 60 + minutes;
    }, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }

  /**
   * Get best price across multiple dates using API
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
          source: "skyscanner",
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
          `Failed to search Skyscanner API for date ${date}:`,
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
