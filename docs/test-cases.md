# Test cases

Manual test cases for the Loan System console app.

## Check pending balance

CP-14 - Check existing loan balance
Input: Customer identification: <identification of a customer with an ACTIVE loan>
Expected: Shows the pending balance and status ACTIVE.

CP-15 - Check fully paid loan balance
Input: Customer identification: <identification of a customer whose loan is already at $0>
Expected: Pending balance: $0, Status: PAID.

CP-16 - Customer not found
Input: Customer identification: 9999999999
Expected: Error: Customer not found.

CP-17 - Invalid identification format
Input: Customer identification: abc
Expected: Error: Customer identification must contain only numbers.
