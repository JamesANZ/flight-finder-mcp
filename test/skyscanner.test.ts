import { SkyscannerService } from "../src/services/skyscanner";
import { FlightSearchRequest } from "../src/types/flight";

describe("SkyscannerService", () => {
  let service: SkyscannerService;

  beforeEach(() => {
    service = new SkyscannerService();
  });

  describe("searchFlights", () => {
    it("should return mock flight results for valid request", async () => {
      const request: FlightSearchRequest = {
        source: "skyscanner",
        origin: "LAX",
        destination: "JFK",
        departureDate: "2024-12-01",
        passengers: { adults: 1 },
      };

      const result = await service.searchFlights(request);

      expect(result).toBeDefined();
      expect(result.itineraries).toHaveLength(5);
      expect(result.searchMetadata.origin).toBe("LAX");
      expect(result.searchMetadata.destination).toBe("JFK");
      expect(result.searchMetadata.totalResults).toBe(5);
    });

    it("should handle round-trip flights", async () => {
      const request: FlightSearchRequest = {
        source: "skyscanner",
        origin: "LAX",
        destination: "JFK",
        departureDate: "2024-12-01",
        returnDate: "2024-12-08",
        passengers: { adults: 2, children: 1 },
      };

      const result = await service.searchFlights(request);

      expect(result.itineraries[0].segments).toHaveLength(2);
      expect(result.itineraries[0].totalDuration).toBe("4h 0m");
    });

    it("should generate unique IDs for each itinerary", async () => {
      const request: FlightSearchRequest = {
        source: "skyscanner",
        origin: "LAX",
        destination: "JFK",
        departureDate: "2024-12-01",
        passengers: { adults: 1 },
      };

      const result = await service.searchFlights(request);
      const ids = result.itineraries.map((it) => it.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
      expect(ids.every((id) => id.startsWith("skyscanner_"))).toBe(true);
    });
  });

  describe("getBestPriceAcrossDates", () => {
    it("should find the best price across multiple dates", async () => {
      const origin = "LAX";
      const destination = "JFK";
      const dates = ["2024-12-01", "2024-12-02", "2024-12-03"];
      const passengers = { adults: 1 };

      const result = await service.getBestPriceAcrossDates(
        origin,
        destination,
        dates,
        passengers,
      );

      expect(result.bestDate).toBeDefined();
      expect(result.bestPrice).toBeGreaterThan(0);
    });

    it("should handle empty dates array", async () => {
      const origin = "LAX";
      const destination = "JFK";
      const dates: string[] = [];
      const passengers = { adults: 1 };

      await expect(
        service.getBestPriceAcrossDates(origin, destination, dates, passengers),
      ).rejects.toThrow("No flights found for any of the specified dates");
    });
  });
});
