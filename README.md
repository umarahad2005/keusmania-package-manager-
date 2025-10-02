# Hotel Invoice Manager

A desktop application built with Electron and React for managing hotel invoice generation for travel/tourism business.

## Features

- **Invoice Generation**: Create professional invoices for hotel bookings
- **Multi-City Support**: Handle both Makkah and Madinah hotel bookings
- **Automatic Calculations**: Calculate totals with profit margins and currency conversion
- **Excel Export**: Save invoice data to Excel files for record keeping
- **PDF Generation**: Export invoices as PDF documents
- **Offline Functionality**: Works completely offline
- **Desktop Application**: Packaged as executable for Windows, macOS, and Linux

## Installation

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn package manager

### Setup Steps

1. **Clone or download the project**
   ```bash
   cd "keusmaina crm"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Development Mode**
   ```bash
   npm run electron-dev
   ```
   This will start both the React development server and Electron application.

4. **Build for Production**
   ```bash
   npm run build
   ```

5. **Create Distributable Package**
   ```bash
   npm run dist
   ```
   This will create an executable file in the `dist` folder.

## Usage

### Invoice Form Fields

#### Client Information
- **Client Name** (Required): Name of the customer
- **Invoice Date**: Date of invoice generation (defaults to today)
- **Per Pax Count**: Number of passengers/people

#### Makkah Hotel Details
- **Hotel Name**: Name of the hotel in Makkah
- **Rate per Night (SAR)**: Hotel rate in Saudi Riyals
- **Number of Nights**: Stay duration in Makkah

#### Madinah Hotel Details  
- **Hotel Name**: Name of the hotel in Madinah
- **Rate per Night (SAR)**: Hotel rate in Saudi Riyals
- **Number of Nights**: Stay duration in Madinah

#### Additional Details
- **Visa Rate (SAR)**: Visa processing cost
- **Profit Percentage**: Your profit margin percentage
- **Exchange Rate (SAR to PKR)**: Current exchange rate from Saudi Riyal to Pakistani Rupee

### Calculations

The application automatically calculates:

1. **Makkah Cost** = Makkah Rate × Nights in Makkah
2. **Madinah Cost** = Madinah Rate × Nights in Madinah  
3. **Base Total** = Makkah Cost + Madinah Cost + Visa Rate
4. **With Profit** = Base Total × (1 + Profit Percentage/100)
5. **Per Pax Cost** = With Profit ÷ Number of Passengers
6. **Final Amount (PKR)** = Per Pax Cost × Exchange Rate

### Export Options

- **Generate Invoice**: Preview invoice calculations
- **Save to Excel**: Export data to Excel spreadsheet
- **Export to PDF**: Generate professional PDF invoice

## File Structure

```
keusmaina crm/
├── public/
│   ├── electron.js          # Electron main process
│   ├── index.html          # HTML template
│   └── manifest.json       # App manifest
├── src/
│   ├── components/
│   │   └── InvoiceForm.js  # Main invoice form component
│   ├── services/
│   │   ├── CalculationService.js  # Invoice calculations
│   │   ├── ExcelService.js        # Excel export functionality
│   │   └── PDFService.js          # PDF generation
│   ├── App.js              # Main React component
│   ├── App.css             # Application styles
│   ├── index.js            # React entry point
│   └── index.css           # Global styles
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## Technical Details

### Built With
- **Electron**: Desktop application framework
- **React**: User interface framework
- **Node.js**: JavaScript runtime
- **SheetJS (xlsx)**: Excel file generation
- **jsPDF**: PDF document generation
- **html2canvas**: HTML to image conversion

### Supported Platforms
- Windows (.exe)
- macOS (.dmg) 
- Linux (.AppImage)

## Customization

### Adding Custom Invoice Templates

To use custom invoice templates:

1. Place your PNG/PDF template in the `public/assets/` folder
2. Modify the `PDFService.js` to use your template
3. Update the template styling in `App.css`

### Modifying Calculations

Update the calculation logic in `src/services/CalculationService.js` to change how totals are computed.

### Styling Changes

Modify `src/App.css` to change the application appearance and layout.

## Troubleshooting

### Common Issues

1. **Application won't start**
   - Ensure Node.js is installed
   - Run `npm install` to install dependencies
   - Check console for error messages

2. **Excel export not working**
   - Verify write permissions in the application directory
   - Check if antivirus software is blocking file creation

3. **PDF generation fails**
   - Ensure sufficient memory available
   - Check browser console for JavaScript errors

### Development

For development and debugging:

```bash
# Start in development mode with DevTools
npm run electron-dev

# Build React app only
npm run build

# Test Electron with built React app
npm run electron
```

## Support

For technical support or feature requests, please contact the development team.

## License

This project is proprietary software for Keusmaina CRM system.