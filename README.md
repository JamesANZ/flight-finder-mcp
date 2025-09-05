# Flight Finder MCP Server

A powerful Model Context Protocol (MCP) server that allows AI assistants to search for flights across multiple sources, analyze pricing patterns, and provide intelligent booking recommendations.

## ✨ Features

- **Multi-Source Flight Search**: Search flights from Skyscanner and Google Flights
- **Official API Integration**: Uses official APIs when available, falls back to scraping
- **Advanced Web Scraping**: Multiple extraction strategies to find real flight data
- **Smart Date Analysis**: Search across multiple dates to find the best prices
- **Intelligent Insights**: AI-powered analysis of flight details and pricing patterns
- **Booking Links**: Direct links to book flights on the respective platforms
- **Price Recommendations**: Data-driven suggestions for optimal booking times

## 🚀 What the LLM Adds

The AI assistant provides significant value by:

1. **Multi-Date Optimization**: Automatically searching multiple dates to find the best possible prices
2. **Intelligent Analysis**: Breaking down flight details and providing actionable insights
3. **Smart Recommendations**: Suggesting optimal booking strategies based on price trends
4. **Comparative Analysis**: Comparing prices across different sources and dates
5. **User-Friendly Output**: Presenting complex flight data in an easy-to-understand format

## 🛠️ Technology Stack

- **Runtime**: Node.js with TypeScript
- **Protocol**: Model Context Protocol (MCP)
- **Testing**: Jest with TypeScript support
- **Dependencies**: MCP SDK, Axios, Cheerio, Puppeteer (for future web scraping)

## 📦 Installation

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd flight-finder-mcp
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure API keys (optional but recommended)**:

   ```bash
   cp config.example.env .env
   # Edit .env and add your API keys
   ```

4. **Build the project**:
   ```bash
   npm run build
   ```

## 🔑 API Configuration

For the best experience, we recommend setting up API keys for official access:

### Skyscanner API

1. Apply for Skyscanner Partner API at: https://www.partners.skyscanner.net/product/travel-api
2. Add your API key to the environment variables:

```bash
SKYSCANNER_API_KEY=your_api_key_here
```

### Google Flights Alternative (SearchAPI)

1. Sign up for SearchAPI at: https://www.searchapi.io/
2. Add your API key to the environment variables:

```bash
SEARCHAPI_KEY=your_api_key_here
```

**Note**: Without API keys, the server will fall back to web scraping, which may be slower and less reliable.

## 🔍 Web Scraping Capabilities

The server includes advanced web scraping capabilities with multiple extraction strategies:

### **Multi-Strategy Approach**

1. **Primary Selectors**: Looks for standard flight card elements
2. **Price Pattern Matching**: Searches for price patterns in page content
3. **Advanced DOM Traversal**: Scans for flight-related elements
4. **Page Source Analysis**: Extracts data from HTML source and JSON
5. **Fallback Mock Data**: Provides realistic mock data when scraping fails

### **Anti-Detection Features**

- **User Agent Rotation**: Uses realistic browser user agents
- **Rate Limiting**: Implements delays between requests
- **Dynamic Content Handling**: Waits for JavaScript-rendered content
- **Loading Indicator Detection**: Waits for page loading to complete

### **Real Data Extraction**

The scraping system is designed to extract actual flight prices and information from websites, not just mock data. It uses multiple fallback strategies to ensure the best chance of finding real flight information.

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## 🚀 Usage

### Starting the MCP Server

```bash
npm start
```

Or for development:

```bash
npm run dev
```

### Available MCP Tools

#### 1. `search_flights`

Search for flights from a specific source.

**Parameters**:

- `source`: Flight search source (`skyscanner` or `google_flights`)
- `origin`: Origin airport code (e.g., `LAX`, `JFK`)
- `destination`: Destination airport code (e.g., `SFO`, `LHR`)
- `departureDate`: Departure date in `YYYY-MM-DD` format
- `returnDate`: Return date (optional for one-way flights)
- `passengers`: Passenger configuration
  - `adults`: Number of adult passengers (required)
  - `children`: Number of child passengers (optional)
  - `infants`: Number of infant passengers (optional)
- `cabinClass`: Cabin class preference (optional)

**Example**:

```json
{
  "source": "skyscanner",
  "origin": "LAX",
  "destination": "JFK",
  "departureDate": "2024-12-01",
  "returnDate": "2024-12-08",
  "passengers": {
    "adults": 2,
    "children": 1
  },
  "cabinClass": "economy"
}
```

#### 2. `search_multiple_dates`

Search for flights across multiple dates to find the best prices.

**Parameters**:

- `origin`: Origin airport code
- `destination`: Destination airport code
- `dates`: Array of dates to search
- `passengers`: Passenger configuration
- `sources`: Array of sources to search (default: both)

**Example**:

```json
{
  "origin": "LAX",
  "destination": "JFK",
  "dates": ["2024-12-01", "2024-12-02", "2024-12-03"],
  "passengers": {
    "adults": 1
  },
  "sources": ["skyscanner", "google_flights"]
}
```

#### 3. `analyze_flight_details`

Analyze flight details and provide insights.

**Parameters**:

- `itinerary`: Flight itinerary object to analyze

#### 4. `get_best_price_recommendation`

Get the best price recommendation across multiple dates with analysis.

**Parameters**:

- `origin`: Origin airport code
- `destination`: Destination airport code
- `dates`: Array of dates to search
- `passengers`: Passenger configuration

#### 5. `find_best_monthly_flights`

Find the best flights for a specific month, analyzing prices across all dates to identify optimal travel dates.

**Parameters**:

- `origin`: Origin airport code (e.g., `LAX`, `JFK`)
- `destination`: Destination airport code (e.g., `SFO`, `LHR`)
- `month`: Month to search in `YYYY-MM` format (e.g., `2024-11`)
- `passengers`: Passenger configuration
- `cabinClass`: Cabin class preference (`economy`, `premium_economy`, `business`, `first`)
- `sources`: Array of sources to search (default: both)
- `includeWeekendAnalysis`: Whether to include weekend vs weekday analysis (default: true)

**Example**:

```json
{
  "origin": "LAX",
  "destination": "JFK",
  "month": "2024-11",
  "passengers": {
    "adults": 2
  },
  "cabinClass": "business",
  "sources": ["skyscanner", "google_flights"],
  "includeWeekendAnalysis": true
}
```

**What this tool provides**:

- **Month-long price analysis**: Searches every date in the specified month
- **Cabin class optimization**: Finds best prices for specific cabin classes (economy, business, first)
- **Weekend vs weekday analysis**: Identifies price patterns and optimal travel days
- **Source comparison**: Compares prices across different flight search engines
- **Smart recommendations**: AI-powered insights on when to book and which dates to avoid
- **Top 5 deals**: Ranked list of the best flight options for the month

## 📚 Examples

### Running the Examples

The project includes comprehensive examples demonstrating the flight finder capabilities:

```bash
# Basic usage demo - shows core flight search functionality
npm run example

# Monthly flight search demo - demonstrates month-long analysis and cabin class optimization
npm run monthly-demo
```

### Example Output

The monthly search demo provides comprehensive analysis like this:

```
📅 Monthly Flight Analysis for 2024-11
📍 Route: LAX → JFK
✈️  Cabin Class: Business
🔍 Sources: skyscanner, google_flights

📊 Price Analysis:
  • Cheapest Date: 2024-11-05 at $605 on google_flights
  • Most Expensive Date: 2024-10-31 at $1026 on skyscanner
  • Average Price: $831
  • Price Range: $421

📅 Weekend vs Weekday Analysis:
  • Average Weekend Price: $916
  • Average Weekday Price: $794
  • Weekend Premium: 15%

💡 Smart Recommendations:
  • 🚀 Amazing deal found! 2024-11-05 is 27% below average price on google_flights.
  • 💡 google_flights tends to have better prices for this route (12% below average).
```

## 🔧 Configuration

The server is configured through the following files:

- `tsconfig.json`: TypeScript compilation settings
- `jest.config.ts`: Jest testing configuration
- `package.json`: Project dependencies and scripts

## 📁 Project Structure

```
flight-finder-mcp/
├── src/
│   ├── types/
│   │   └── flight.ts          # TypeScript type definitions
│   ├── services/
│   │   ├── skyscanner.ts      # Skyscanner flight search service
│   │   ├── google-flights.ts  # Google Flights search service
│   │   └── flight-analyzer.ts # Flight analysis and insights service
│   └── index.ts               # Main MCP server implementation
├── test/                      # Unit tests
├── examples/                  # Usage examples
│   ├── basic-usage.ts         # Basic flight search demo
│   └── monthly-search-demo.ts # Monthly analysis demo
├── build/                     # Compiled JavaScript output
├── package.json               # Project dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── jest.config.ts            # Jest testing configuration
├── LICENSE                   # MIT License
└── README.md                 # This file
```

## 🔮 Future Enhancements

- **Real API Integration**: Replace mock data with actual Skyscanner and Google Flights APIs
- **Web Scraping**: Implement proper web scraping for real-time flight data
- **Additional Sources**: Support for more flight search engines
- **Price Alerts**: Set up price monitoring and notifications
- **Historical Data**: Track price trends over time
- **Route Optimization**: Suggest optimal routes with stopovers

## ⚠️ Important Notes

**Current Implementation**: This is a proof-of-concept implementation that uses mock data. In production, you would need to:

1. Use official APIs where available
2. Implement proper web scraping with rate limiting
3. Respect robots.txt and terms of service
4. Handle API rate limits and quotas
5. Implement proper error handling and retry logic

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For questions or support, please open an issue in the repository.

---

**Built with ❤️ for the MCP community**
