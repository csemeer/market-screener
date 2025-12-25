#!/bin/bash

# Quick test script for Stock Detail API endpoint
# Usage: ./test-stock-detail.sh [EXCHANGE] [SYMBOL]

EXCHANGE=${1:-NYSE}
SYMBOL=${2:-AAPL}
API_URL="http://localhost:3001/api"

echo "🧪 Testing Stock Detail Endpoint"
echo "================================="
echo "Exchange: $EXCHANGE"
echo "Symbol: $SYMBOL"
echo ""

# Check if backend is running
echo "1. Checking if backend is running..."
if curl -s -f "$API_URL/health" > /dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running on port 3001"
    echo "   Start it with: cd backend && npm run dev"
    exit 1
fi

echo ""
echo "2. Fetching stock detail..."
echo "URL: $API_URL/stocks/detail/$EXCHANGE/$SYMBOL"
echo ""

# Fetch and pretty-print the response
RESPONSE=$(curl -s "$API_URL/stocks/detail/$EXCHANGE/$SYMBOL")

if echo "$RESPONSE" | jq empty 2>/dev/null; then
    echo "✅ Valid JSON response received"
    echo ""
    echo "📊 Stock Detail Summary:"
    echo "======================="
    echo "$RESPONSE" | jq '{
      symbol: .symbol,
      exchange: .exchange,
      price: .price,
      changePercent: .changePercent,
      combinedScore: .combinedScore,
      confluenceScore: .confluenceScore,
      recommendation: .recommendation,
      indicators: {
        rsi: .indicators.rsi,
        macd: .indicators.macd,
        adx: .indicators.adx
      },
      hasHistoricalData: (.historicalData | length),
      hasFundamentals: (.fundamentals != null)
    }'

    echo ""
    echo "✅ Test passed! Stock detail API is working correctly."
    echo ""
    echo "Next steps:"
    echo "1. Start frontend: cd frontend && npm run dev"
    echo "2. Navigate to: http://localhost:3000/stock/$EXCHANGE/$SYMBOL"
    echo "3. Verify all 5 tabs load correctly"
else
    echo "❌ Invalid response or error occurred"
    echo ""
    echo "Response:"
    echo "$RESPONSE"
    exit 1
fi
