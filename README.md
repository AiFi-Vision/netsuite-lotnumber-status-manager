# NetSuite Lot Number Status Manager

A SuiteScript 2.1 Suitelet + Client Script solution to manage lot-numbered item inventory in NetSuite.  
Allows inline editing of quantities and inventory statuses, with validations and pagination support.

## Features

- Inline editor for lot-numbered items
- Update quantity with validation (must be > 0 and <= available)
- Update inventory status per lot
- Pagination support with "Goto page" input
- Client-side validation to prevent invalid entries
- Creates Inventory Status Change records programmatically

## Folder Structure

SuiteScripts/lot_number
├── SL_LotNumberStatus.js # Suitelet
└── CS_LotNumberStatus.js # Client Script

## Installation / Deployment

1. Upload scripts to NetSuite File Cabinet (`SuiteScripts/` folder)
2. Create a Suitelet script record pointing to `SL_LotNumberStatus.js`
3. Assign `CS_LotNumberStatus.js` as the client script module for the Suitelet
4. Add necessary permissions for Inventory, Item, and Inventory Status records

## Usage

1. Navigate to the Suitelet page in NetSuite
2. Use pagination to browse lot-numbered items
3. Edit quantities or statuses inline
4. Click **Update Status** to commit changes
5. System validates quantities and status changes automatically

## Notes

- Quantity must be numeric, > 0, and <= available
- Requires lot-numbered items and inventory statuses to exist in NetSuite
- Supports dynamic inventory detail updates

## License

MIT License
