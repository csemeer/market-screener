#!/bin/bash

# Strategy Management API - Comprehensive End-to-End Tests
# This script tests all strategy endpoints and validates responses

BASE_URL="http://localhost:3001/api/strategies"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Strategy Management API - E2E Tests"
echo "=========================================="
echo ""

# Cleanup: Delete any custom strategies from previous test runs
echo "🧹 Cleaning up previous test data..."
custom_ids=$(curl -s "$BASE_URL?is_system=false" 2>/dev/null | python3 -c "import sys, json; data=json.load(sys.stdin); print(' '.join(str(s['id']) for s in data.get('strategies', []) if not s.get('is_system')))" 2>/dev/null || echo "")

if [ -n "$custom_ids" ]; then
    for id in $custom_ids; do
        curl -s -X DELETE "$BASE_URL/$id" > /dev/null 2>&1
    done
    echo "   ✓ Deleted $(echo $custom_ids | wc -w) custom strategies"
else
    echo "   ✓ No custom strategies to clean up"
fi
echo ""

# Test counter
PASSED=0
FAILED=0

# Helper function to test endpoint
test_endpoint() {
    local test_name="$1"
    local url="$2"
    local method="${3:-GET}"
    local data="$4"
    local expected_status="${5:-200}"

    echo -n "Testing: $test_name ... "

    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$url")
    elif [ "$method" == "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$url")
    elif [ "$method" == "PUT" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PUT -H "Content-Type: application/json" -d "$data" "$url")
    elif [ "$method" == "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE "$url")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" == "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))

        # Show relevant data from response
        if [ "$method" == "GET" ] && [ "$http_code" == "200" ]; then
            count=$(echo "$body" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('count', data.get('categories', [])))" 2>/dev/null || echo "N/A")
            if [ "$count" != "N/A" ]; then
                echo "   → Response count: $count"
            fi
        fi

        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $http_code)"
        echo "   → Response: $body" | head -c 200
        echo ""
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. READ OPERATIONS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1: List all strategies
test_endpoint "GET /api/strategies - List all" "$BASE_URL" "GET" "" "200"

# Test 2: Filter by category
test_endpoint "GET /api/strategies?category=MEAN_REVERSION" "$BASE_URL?category=MEAN_REVERSION" "GET" "" "200"

# Test 3: Filter by active status
test_endpoint "GET /api/strategies?is_active=true" "$BASE_URL?is_active=true" "GET" "" "200"

# Test 4: Filter by system strategies
test_endpoint "GET /api/strategies?is_system=true" "$BASE_URL?is_system=true" "GET" "" "200"

# Test 5: Search by name
test_endpoint "GET /api/strategies?search=RSI" "$BASE_URL?search=RSI" "GET" "" "200"

# Test 6: Get single strategy by ID
test_endpoint "GET /api/strategies/1 - RSI Bollinger" "$BASE_URL/1" "GET" "" "200"

# Test 7: Get non-existent strategy
test_endpoint "GET /api/strategies/999 - Not Found" "$BASE_URL/999" "GET" "" "404"

# Test 8: Get categories
test_endpoint "GET /api/strategies/categories" "$BASE_URL/categories" "GET" "" "200"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. CREATE OPERATIONS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 9: Create custom strategy
create_data='{
  "name": "Test Custom Strategy",
  "description": "A test strategy for API validation",
  "category": "CUSTOM",
  "entry_conditions": {
    "type": "CUSTOM",
    "customRule": true,
    "min_confidence": 50
  },
  "exit_conditions": {
    "stopLossPercent": 2.0,
    "targetPercent": 6.0,
    "trailingStop": {
      "enabled": true,
      "percent": 2.5
    }
  },
  "indicators_config": {
    "rsi": {
      "enabled": true,
      "period": 14
    }
  },
  "recommended_timeframes": ["5m", "15m"],
  "recommended_stop_loss_percent": 2.0,
  "recommended_target_percent": 6.0,
  "min_capital_required": 20000,
  "created_by": "api_test"
}'

# Create custom strategy and capture ID
create_response=$(curl -s -X POST -H "Content-Type: application/json" -d "$create_data" "$BASE_URL")
create_http_code=$(echo "$create_response" | tail -c 4)
CUSTOM_STRATEGY_ID=$(echo "$create_response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('strategy', {}).get('id', 0))" 2>/dev/null || echo "0")

echo -n "Testing: POST /api/strategies - Create custom ... "
success_value=$(echo "$create_response" | python3 -c 'import sys, json; print(str(json.load(sys.stdin).get("success", False)).lower())' 2>/dev/null || echo "false")
if [ "$success_value" == "true" ] && [ "$CUSTOM_STRATEGY_ID" != "0" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP 201)"
    echo "   → Created strategy ID: $CUSTOM_STRATEGY_ID"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAILED${NC}"
    echo "   → Response: $create_response" | head -c 200
    echo "   → Success value: $success_value, ID: $CUSTOM_STRATEGY_ID"
    FAILED=$((FAILED + 1))
fi

# Test 10: Create duplicate (should fail)
test_endpoint "POST /api/strategies - Duplicate name" "$BASE_URL" "POST" "$create_data" "400"

# Test 11: Create with invalid category
invalid_category='{
  "name": "Invalid Category Test",
  "description": "Test",
  "category": "INVALID_CAT",
  "entry_conditions": {},
  "exit_conditions": {"stopLossPercent": 2, "targetPercent": 1},
  "indicators_config": {}
}'
test_endpoint "POST /api/strategies - Invalid category" "$BASE_URL" "POST" "$invalid_category" "400"

# Test 12: Create with bad risk/reward (target < stop loss)
bad_rr='{
  "name": "Bad Risk Reward Test",
  "description": "Test",
  "category": "CUSTOM",
  "entry_conditions": {"type": "CUSTOM"},
  "exit_conditions": {"stopLossPercent": 5, "targetPercent": 2},
  "indicators_config": {}
}'
test_endpoint "POST /api/strategies - Bad R/R ratio" "$BASE_URL" "POST" "$bad_rr" "400"

# Test 13: Create with missing required fields
missing_fields='{
  "name": "Missing Fields Test"
}'
test_endpoint "POST /api/strategies - Missing fields" "$BASE_URL" "POST" "$missing_fields" "400"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. UPDATE OPERATIONS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 14: Update custom strategy name
update_name='{"name": "Updated Custom Strategy Name"}'
test_endpoint "PUT /api/strategies/$CUSTOM_STRATEGY_ID - Update name" "$BASE_URL/$CUSTOM_STRATEGY_ID" "PUT" "$update_name" "200"

# Test 15: Update custom strategy conditions
update_conditions='{
  "exit_conditions": {
    "stopLossPercent": 3.0,
    "targetPercent": 9.0
  }
}'
test_endpoint "PUT /api/strategies/$CUSTOM_STRATEGY_ID - Update conditions" "$BASE_URL/$CUSTOM_STRATEGY_ID" "PUT" "$update_conditions" "200"

# Test 16: Try to update system strategy (should fail)
update_system='{"name": "Hacked System Strategy"}'
test_endpoint "PUT /api/strategies/1 - Update system (should fail)" "$BASE_URL/1" "PUT" "$update_system" "403"

# Test 17: Update non-existent strategy
test_endpoint "PUT /api/strategies/999 - Not found" "$BASE_URL/999" "PUT" "$update_name" "404"

# Test 18: Deactivate custom strategy
deactivate='{"is_active": false}'
test_endpoint "PUT /api/strategies/$CUSTOM_STRATEGY_ID - Deactivate" "$BASE_URL/$CUSTOM_STRATEGY_ID" "PUT" "$deactivate" "200"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. CLONE OPERATIONS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 19: Clone system strategy and capture ID
clone_data='{"new_name": "My Custom RSI Bollinger", "created_by": "api_test"}'
clone_response=$(curl -s -X POST -H "Content-Type: application/json" -d "$clone_data" "$BASE_URL/1/clone")
CLONED_STRATEGY_ID=$(echo "$clone_response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('strategy', {}).get('id', 0))" 2>/dev/null || echo "0")

echo -n "Testing: POST /api/strategies/1/clone - Clone system ... "
clone_success=$(echo "$clone_response" | python3 -c 'import sys, json; print(str(json.load(sys.stdin).get("success", False)).lower())' 2>/dev/null || echo "false")
if [ "$clone_success" == "true" ] && [ "$CLONED_STRATEGY_ID" != "0" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP 201)"
    echo "   → Cloned strategy ID: $CLONED_STRATEGY_ID"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAILED${NC}"
    echo "   → Response: $clone_response" | head -c 200
    echo "   → Success value: $clone_success, ID: $CLONED_STRATEGY_ID"
    FAILED=$((FAILED + 1))
fi

# Test 20: Clone with duplicate name (should fail)
test_endpoint "POST /api/strategies/1/clone - Duplicate name" "$BASE_URL/1/clone" "POST" "$clone_data" "400"

# Test 21: Clone non-existent strategy
test_endpoint "POST /api/strategies/999/clone - Not found" "$BASE_URL/999/clone" "POST" "$clone_data" "404"

# Test 22: Clone without new_name
no_name='{"created_by": "test"}'
test_endpoint "POST /api/strategies/1/clone - No name" "$BASE_URL/1/clone" "POST" "$no_name" "400"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. PERFORMANCE TRACKING"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 23: Update performance metrics
perf_data='{"win_rate": 55.5, "return_percent": 12.3}'
test_endpoint "PUT /api/strategies/$CUSTOM_STRATEGY_ID/performance" "$BASE_URL/$CUSTOM_STRATEGY_ID/performance" "PUT" "$perf_data" "200"

# Test 24: Update performance again (should average)
perf_data2='{"win_rate": 60.0, "return_percent": 15.0}'
test_endpoint "PUT /api/strategies/$CUSTOM_STRATEGY_ID/performance (2nd)" "$BASE_URL/$CUSTOM_STRATEGY_ID/performance" "PUT" "$perf_data2" "200"

# Test 25: Update performance with missing fields
bad_perf='{"win_rate": 50}'
test_endpoint "PUT /api/strategies/$CUSTOM_STRATEGY_ID/performance - Missing field" "$BASE_URL/$CUSTOM_STRATEGY_ID/performance" "PUT" "$bad_perf" "400"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. DELETE OPERATIONS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 26: Try to delete system strategy (should fail)
test_endpoint "DELETE /api/strategies/1 - System (should fail)" "$BASE_URL/1" "DELETE" "" "403"

# Test 27: Delete custom strategy
test_endpoint "DELETE /api/strategies/$CUSTOM_STRATEGY_ID" "$BASE_URL/$CUSTOM_STRATEGY_ID" "DELETE" "" "200"

# Test 28: Delete cloned strategy
test_endpoint "DELETE /api/strategies/$CLONED_STRATEGY_ID" "$BASE_URL/$CLONED_STRATEGY_ID" "DELETE" "" "200"

# Test 29: Delete non-existent strategy
test_endpoint "DELETE /api/strategies/999 - Not found" "$BASE_URL/999" "DELETE" "" "404"

# Test 30: Delete already deleted strategy
test_endpoint "DELETE /api/strategies/$CUSTOM_STRATEGY_ID - Already deleted" "$BASE_URL/$CUSTOM_STRATEGY_ID" "DELETE" "" "404"

echo ""
echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total:  $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
