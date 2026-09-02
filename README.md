# Loan System (Sistema de Préstamos)

A small console application for managing loans, written in **TypeScript** and run
on **Node.js**. It has **no database and no framework**: all state is persisted as
plain JSON files inside the `data/` folder, and the user interface is a text menu
served through `readline`.

The app lets you register customers, grant them loans, simulate the installment
value, record payments (including partial payments), and check the pending
balance of a customer's loan.

---

## Requirements

- Node.js 18+ (uses `readline/promises`)
- npm

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

`npm run dev` executes `src/index.ts` directly with `ts-node`. The program prints
the menu in a loop and reads options from standard input; it also works when the
input is piped (non‑TTY), because the console reader buffers incoming lines.

Other scripts (from `package.json`):

| Script          | Command                | Purpose                                  |
| --------------- | ---------------------- | ---------------------------------------- |
| `npm run dev`   | `ts-node src/index.ts` | Run the app from TypeScript sources      |
| `npm run build` | `tsc`                  | Compile `src/` into `dist/`              |
| `npm start`     | `node dist/index.js`   | Run the previously compiled build        |

---

## Menu options

When the app starts it prints:

```
================================
          LOAN SYSTEM
================================

1. Register customer
2. Register loan
3. Calculate installment
4. Register payment
5. Check pending balance
6. Exit
```

The prompt shown for the selection is `Select an option: `. Any value other than
`1`–`6` prints `Error: Invalid option.` and shows the menu again.

### 1. Register customer

Text: `1. Register customer`

Prompts:

- `Name: `
- `Identification: `

On success it prints:

```
Customer registered successfully.
Customer ID: <id>
```

The customer `id` is generated sequentially as `String(customers.length + 1)` and
the record is appended to `data/customers.json`.

### 2. Register loan

Text: `2. Register loan`

Prompts:

- `Customer identification: `
- `Loan amount: `
- `Number of installments: `

On success it prints:

```
Loan registered successfully.
Loan ID: <id>
Customer: <customer name>
Amount: $<amount>
Installment: $<installment value>
```

The loan starts with `pendingBalance` equal to the full `amount` and
`status` `ACTIVE`. It is appended to `data/loans.json`. The `id` is generated as
`String(loans.length + 1)`.

### 3. Calculate installment

Text: `3. Calculate installment`

Prompts:

- `Amount: `
- `Number of installments: `

On success it prints:

```
Installment value: $<value>
```

This option is a simulator only — it validates the input and returns
`round((amount / installments) * 100) / 100`. **Nothing is persisted.**

### 4. Register payment

Text: `4. Register payment`

Prompts:

- `Customer identification: `
- `Payment amount: `

On success it prints:

```
Payment registered successfully.

Payment: $<amount>
Previous balance: $<previous balance>
New balance: $<new balance>
Remaining installments: <remaining installments>
```

The payment is appended to `data/payments.json` with an ISO‑8601 `date`
(`new Date().toISOString()`), and the matching loan in `data/loans.json` is
updated: its `pendingBalance` is reduced by the payment amount, and its `status`
becomes `PAID` when the balance reaches exactly `0` (otherwise it stays
`ACTIVE`). `Remaining installments` is `newBalance / installmentValue` rounded to
one decimal, or `0` when the loan is fully paid.

### 5. Check pending balance

Text: `5. Check pending balance`

Prompt:

- `Customer identification: `

On success it prints:

```
================================
       LOAN BALANCE
================================

Loan ID: <id>
Customer: <customer name>
Pending balance: $<pending balance>
Installments paid: <paid> of <total>
Installments pending: <pending>
Status: <ACTIVE | PAID>
```

It reports the customer's `ACTIVE` loan; if there is none, it falls back to the
last loan recorded for that customer. `Installments pending` is
`pendingBalance / installmentValue` (one decimal, or `0` when the balance is
`0`); `Installments paid` is `numberOfInstallments - installmentsPending`.

### 6. Exit

Text: `6. Exit`

Prints `Goodbye.` and ends the loop.

---

## Business rules and validations

### Amount parsing (`src/utils/ParseAmount.ts`)

Used by options 2 and 3. Dots and commas are **always** treated as thousands
separators, never as decimal marks:

- `1.000`, `1,000` and `1000` all become `1000`
- `5.000.000` becomes `5000000`
- Anything that is not digits (after removing `.` and `,`) throws
  `Error: Amount must be a valid number.`

### Customer rules (`src/services/CustomerService.ts`)

| Rule                                         | Error message                                          |
| -------------------------------------------- | ----------------------------------------------------- |
| Name is required (not empty / whitespace)    | `Error: Name is required.`                            |
| Identification is required                   | `Error: Identification is required.`                  |
| Name must not contain digits                 | `Error: Name must not contain numbers.`               |
| Name accepts only letters and spaces (`A–Z`, `a–z`, `Á É Í Ó Ú Ñ`, `á é í ó ú ñ`) | `Error: Name must contain only letters.` |
| Identification must be digits only           | `Error: Identification must contain only numbers.`    |
| Identification must be unique across customers | `Error: This identification number is already registered.` |

Name and identification are trimmed before validation and storage.

### Loan rules (`src/services/LoanService.ts` + `src/validations/LoanValidation.ts`)

| Rule                                                             | Error message                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------- |
| Customer identification must be digits only                     | `Error: Customer identification must contain only numbers.`   |
| Customer must already exist in `customers.json`                 | `Error: Customer not found.`                                  |
| **A customer may have only one non‑paid loan at a time** (any loan whose `status` is not `PAID` blocks a new one) | `Error: Customer already has an active loan.` |
| Amount must be a finite number greater than `0`                 | `Error: Amount must be greater than 0.`                       |
| Number of installments must be an integer between `1` and `60`  | `Error: Number of installments must be between 1 and 60.`     |

Installment value: `Math.round((amount / numberOfInstallments) * 100) / 100`.

The same amount and installment validations apply to option 3 (Calculate
installment), which performs no other checks.

For **Check pending balance**, in addition to the digits‑only and
customer‑exists checks: if the customer has no loans at all it throws
`Error: This customer has no loans.`

### Payment rules (`src/services/PaymentService.ts` + `src/validations/PaymentValidation.ts`)

| Rule                                                        | Error message                                             |
| ---------------------------------------------------------- | ------------------------------------------------------- |
| Customer must exist                                        | `Error: Customer not found.`                            |
| Customer must have a loan with `status` `ACTIVE`           | `Error: No active loan found for this customer.`        |
| Payment amount must be numeric (`.` and `,` are stripped as thousands separators) | `Error: Payment amount must contain only numbers.` |
| Payment amount must not be negative                        | `Error: Payment amount cannot be negative.`             |
| Payment amount must be greater than `0`                    | `Error: Payment amount must be greater than 0.`         |
| Payment amount must not exceed the loan's pending balance  | `Error: Payment cannot be greater than pending balance.` |

**Partial payments are allowed.** Each payment subtracts its amount from
`pendingBalance`; the loan is only marked `PAID` when the balance is exactly `0`.
Unlike the loan and balance flows, the payment flow does **not** enforce a
digits‑only format on the customer identification before looking the customer up.

### Loan status

`LoanStatus` is defined as `'ACTIVE' | 'OVERDUE' | 'PAID'` in
`src/models/Loan.ts`. In the current code only `ACTIVE` and `PAID` are ever
assigned; `OVERDUE` exists in the type but is not produced by any flow. The
"one active loan per customer" check treats **any** non‑`PAID` status as
blocking.

---

## Project structure

```
Sistema_Prestamos/
├── data/                     # JSON persistence (acts as the "database")
│   ├── customers.json
│   ├── loans.json
│   └── payments.json
├── docs/
│   └── test-cases.md         # Manual test cases
├── src/
│   ├── index.ts              # Menu loop, prompts, console reader, output formatting
│   ├── models/               # TypeScript interfaces / types
│   │   ├── Customer.ts       # Customer: id, name, identification
│   │   ├── Loan.ts           # Loan + LoanStatus
│   │   └── Payment.ts        # Payment: id, loanId, amount, date
│   ├── services/             # Business logic + JSON read/write
│   │   ├── CustomerService.ts
│   │   ├── LoanService.ts    # registerLoan, calculateInstallment, getPendingBalance
│   │   └── PaymentService.ts
│   ├── utils/
│   │   └── ParseAmount.ts    # parseAmount() – thousands-separator aware
│   └── validations/          # Pure validation helpers (throw on failure)
│       ├── LoanValidation.ts
│       └── PaymentValidation.ts
├── package.json
├── package-lock.json
├── tsconfig.json             # target ES2020, module CommonJS, strict, outDir dist/
└── README.md
```

`.gitignore` excludes `node_modules/` and `dist/`.

### Where each requirement lives

| Concern                                | Location                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------- |
| Domain types (Customer / Loan / Payment) | `src/models/`                                                        |
| Menu, prompts, and console output      | `src/index.ts`                                                        |
| Customer registration + validation     | `src/services/CustomerService.ts`                                     |
| Loan registration, installment calc, pending balance | `src/services/LoanService.ts`                          |
| Payment registration and balance update | `src/services/PaymentService.ts`                                     |
| Amount / installment validation rules  | `src/validations/LoanValidation.ts`                                   |
| Payment validation rules               | `src/validations/PaymentValidation.ts`                                |
| Amount string parsing                  | `src/utils/ParseAmount.ts`                                            |
| Persistence (JSON files)               | `data/customers.json`, `data/loans.json`, `data/payments.json` (read/written by each service via `fs`) |
| Manual test cases                      | `docs/test-cases.md`                                                  |

Each service resolves the data directory as `path.join(__dirname, '..', '..', 'data')`
and creates it on first write if it does not exist.

---

## Data files

- **`data/customers.json`** — array of `{ id, name, identification }`.
- **`data/loans.json`** — array of
  `{ id, customerIdentification, customerName, amount, numberOfInstallments, installmentValue, pendingBalance, status }`.
- **`data/payments.json`** — array of `{ id, loanId, amount, date }` where
  `date` is an ISO‑8601 timestamp.

All three files are read fresh on every operation and rewritten (pretty‑printed
with 2‑space indentation) whenever a record is added or a loan is updated.

---

## Testing

There is no automated test suite. `docs/test-cases.md` holds manual test cases
for the console app; it currently documents the **Check pending balance** flow
(cases CP‑14 through CP‑17), covering an existing loan, a fully paid loan, an
unknown customer, and an invalid identification format.
