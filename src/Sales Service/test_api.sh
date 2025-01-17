#!/bin/bash

BASE_URL="http://localhost:8080"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Test GET /sales (empty list)
echo "Testing GET /sales..."
response=$(curl -s -X GET $BASE_URL/sales)
if [[ $response == "[]" ]]; then
    echo -e "${GREEN}✓ GET /sales successful${NC}"
else
    echo -e "${RED}✗ GET /sales failed${NC}"
fi

# Test POST /sales
echo -e "\nTesting POST /sales..."
response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"customer_name":"Test Customer","amount":1000.00}' \
    $BASE_URL/sales)
if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✓ POST /sales successful${NC}"
else
    echo -e "${RED}✗ POST /sales failed${NC}"
fi

# Test GET /sales (should have one item)
echo -e "\nTesting GET /sales after POST..."
response=$(curl -s -X GET $BASE_URL/sales)
if [[ $response != "[]" ]]; then
    echo -e "${GREEN}✓ GET /sales shows new record${NC}"
else
    echo -e "${RED}✗ GET /sales still empty${NC}"
fi

# Test GET /sales/1
echo -e "\nTesting GET /sales/1..."
response=$(curl -s -X GET $BASE_URL/sales/1)
if [[ $response == *"Test Customer"* ]]; then
    echo -e "${GREEN}✓ GET /sales/1 successful${NC}"
else
    echo -e "${RED}✗ GET /sales/1 failed${NC}"
fi

# Test invalid endpoint
echo -e "\nTesting invalid endpoint..."
response=$(curl -s -w "%{http_code}" -X GET $BASE_URL/invalid)
if [[ $response == *"404"* ]]; then
    echo -e "${GREEN}✓ Invalid endpoint returns 404${NC}"
else
    echo -e "${RED}✗ Invalid endpoint test failed${NC}"
fi