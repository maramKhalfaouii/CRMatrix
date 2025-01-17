#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Base URL
BASE_URL="http://localhost:8000/api/v1/customers"

echo "Testing Customer Management API"
echo "-----------------------------"

# Test 1: Create a new customer
echo -e "\n${GREEN}1. Creating a new customer${NC}"
CREATE_RESPONSE=$(curl -s -X POST "${BASE_URL}/" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "1234567890"
  }')
echo "Response: $CREATE_RESPONSE"

# Extract customer ID from response (assuming it's returned)
CUSTOMER_ID=$(echo $CREATE_RESPONSE | grep -o '"id":[0-9]*' | grep -o '[0-9]*')

# Test 2: Get the created customer
echo -e "\n${GREEN}2. Getting customer details${NC}"
curl -s -X GET "${BASE_URL}/${CUSTOMER_ID}"

# Test 3: List all customers
echo -e "\n${GREEN}3. Listing all customers${NC}"
curl -s -X GET "${BASE_URL}/"

# Test 4: Update customer
echo -e "\n${GREEN}4. Updating customer${NC}"
curl -s -X PUT "${BASE_URL}/${CUSTOMER_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Smith",
    "email": "john.smith@example.com",
    "phone": "9876543210"
  }'

# Test 5: Verify update
echo -e "\n${GREEN}5. Verifying update${NC}"
curl -s -X GET "${BASE_URL}/${CUSTOMER_ID}"

# Test 6: Test validation with invalid email
echo -e "\n${GREEN}6. Testing validation with invalid email${NC}"
curl -s -X POST "${BASE_URL}/" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Invalid",
    "last_name": "User",
    "email": "not-an-email",
    "phone": "1234567890"
  }'

# Test 7: Delete customer
echo -e "\n${GREEN}7. Deleting customer${NC}"
curl -s -X DELETE "${BASE_URL}/${CUSTOMER_ID}"

# Test 8: Verify deletion
echo -e "\n${GREEN}8. Verifying deletion${NC}"
curl -s -X GET "${BASE_URL}/${CUSTOMER_ID}"