/**
 * Flight search request parameters
 */
export interface FlightSearchRequest {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: {
    adults: number;
    children?: number;
    infants?: number;
  };
  cabinClass?: "economy" | "premium_economy" | "business" | "first";
}

/**
 * Flight segment information
 */
export interface FlightSegment {
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  airline: string;
  flightNumber: string;
  aircraft?: string;
  duration: string;
  stops: number;
  layoverDuration?: string;
}

/**
 * Flight itinerary
 */
export interface FlightItinerary {
  id: string;
  price: {
    amount: number;
    currency: string;
    formatted: string;
  };
  segments: FlightSegment[];
  totalDuration: string;
  stops: number;
  bookingLink: string;
  source: "skyscanner" | "google_flights";
  searchDate: string;
}

/**
 * Flight search response
 */
export interface FlightSearchResponse {
  itineraries: FlightItinerary[];
  searchMetadata: {
    totalResults: number;
    searchTime: string;
    origin: string;
    destination: string;
    dates: string[];
  };
}

/**
 * Price analysis for multiple dates
 */
export interface PriceAnalysis {
  cheapestDate: string;
  cheapestPrice: number;
  mostExpensiveDate: string;
  mostExpensivePrice: number;
  averagePrice: number;
  priceRange: number;
  recommendations: string[];
}
