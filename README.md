# Fixed Income Investment Comparison Tool

A web application to compare different fixed income investment options in the Brazilian market, such as CDB and LCI, with automatic calculations of gross and net returns.

![Investment Comparison Tool](https://investment-comparator.vercel.app/)

## 🌟 Features

- **Investment Comparison**: Compare different types of investments side by side
- **Automatic Calculations**: View gross and net returns based on provided rates
- **Flexible Rate Types**: Support for fixed-rate and post-fixed (% of CDI) investments
- **Tax Calculation**: Automatic income tax calculation based on investment duration
- **Data Persistence**: Your investments are automatically saved in the browser
- **Customizable CDI Rate**: Update the reference CDI rate as needed
- **Responsive Interface**: Works on mobile devices, tablets, and desktops
- **Dark Theme**: Dark-themed interface to reduce eye strain

## 🚀 Technologies Used

- [Next.js 14](https://nextjs.org/) - React framework with hybrid rendering
- [React](https://reactjs.org/) - JavaScript library for user interfaces
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript superset
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Shadcn/UI](https://ui.shadcn.com/) - Reusable UI components
- [date-fns](https://date-fns.org/) - Date manipulation library
- [LocalStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) - For browser data persistence

## 📋 Prerequisites

- Node.js 18.17.0 or higher
- npm or yarn

## 🔧 Installation

1. Clone the repository:

```bash
git clone https://github.com/Sn0wye/investment-comparison.git
cd investment-comparison
```

2. Install dependencies:

```shellscript
pnpm install
```

3. Run the development server:

```shellscript
pnpm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 How to Use

### Viewing Investments

- Investment cards show detailed information about each option
- Compare gross and net values side by side
- See duration automatically calculated based on the maturity date

### Adding New Investments

1. Click the "Add Investment" button
2. Fill in the information:

3. Investment name
4. Type (CDB or LCI)
5. Initial amount
6. Maturity date
7. Rate type (Fixed or Post-Fixed)
8. Rate (% per year or % of CDI)

9. Click "Add Investment"

### Adjusting the CDI Rate

1. Click the edit icon next to the current CDI rate
2. Enter the new value
3. Click "Save"

### Removing Investments

- Click the "X" in the top right corner of any investment card

## 📘 Financial Concepts

### CDB (Certificate of Bank Deposit)

Fixed income security issued by banks as a form of raising funds. Subject to regressive income tax based on duration:

- Up to 6 months: 22.5%
- 6 to 12 months: 20%
- 12 to 24 months: 17.5%
- Above 24 months: 15%

### LCI (Real Estate Credit Letter)

Fixed income security issued by financial institutions backed by real estate loans. Exempt from income tax for individuals in Brazil.

### CDI (Interbank Deposit Certificate)

Reference rate in the Brazilian financial market, very close to the Selic rate. Used as a basis for post-fixed investments.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request
