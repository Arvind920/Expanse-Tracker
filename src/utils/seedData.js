// Default seed data for initial setup and 1-click demo restoration (INR Rupee currency)
function generateSeedData() {
  const today = new Date();
  const formatOffsetDate = (daysAgo) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  const transactions = [
    // Current month transactions
    {
      id: "tx-1",
      type: "income",
      amount: 85000,
      category: "Salary",
      date: formatOffsetDate(2),
      paymentMethod: "Bank Transfer",
      note: "Monthly Software Engineering Salary"
    },
    {
      id: "tx-2",
      type: "expense",
      amount: 22000,
      category: "Housing",
      date: formatOffsetDate(3),
      paymentMethod: "Bank Transfer",
      note: "Apartment Rent & Society Maintenance"
    },
    {
      id: "tx-3",
      type: "expense",
      amount: 3850,
      category: "Food & Dining",
      date: formatOffsetDate(1),
      paymentMethod: "UPI / Mobile Pay",
      note: "Weekly groceries & fresh vegetables"
    },
    {
      id: "tx-4",
      type: "expense",
      amount: 1850,
      category: "Food & Dining",
      date: formatOffsetDate(2),
      paymentMethod: "Credit Card",
      note: "Dinner with friends at barbecue restaurant"
    },
    {
      id: "tx-5",
      type: "income",
      amount: 30000,
      category: "Freelance",
      date: formatOffsetDate(5),
      paymentMethod: "Bank Transfer",
      note: "Client web development project milestone"
    },
    {
      id: "tx-6",
      type: "expense",
      amount: 2400,
      category: "Transportation",
      date: formatOffsetDate(4),
      paymentMethod: "UPI / Mobile Pay",
      note: "Petrol refill & Fastag toll"
    },
    {
      id: "tx-7",
      type: "expense",
      amount: 4999,
      category: "Shopping",
      date: formatOffsetDate(6),
      paymentMethod: "Credit Card",
      note: "Mechanical keyboard & desk accessories"
    },
    {
      id: "tx-8",
      type: "expense",
      amount: 2200,
      category: "Bills & Utilities",
      date: formatOffsetDate(7),
      paymentMethod: "UPI / Mobile Pay",
      note: "Fiber Internet & Electricity bill"
    },
    {
      id: "tx-9",
      type: "expense",
      amount: 699,
      category: "Entertainment",
      date: formatOffsetDate(8),
      paymentMethod: "Credit Card",
      note: "Netflix & Spotify Premium monthly"
    },
    {
      id: "tx-10",
      type: "expense",
      amount: 1500,
      category: "Health & Fitness",
      date: formatOffsetDate(10),
      paymentMethod: "UPI / Mobile Pay",
      note: "Gym & Fitness membership"
    },
    {
      id: "tx-11",
      type: "expense",
      amount: 180,
      category: "Food & Dining",
      date: formatOffsetDate(0),
      paymentMethod: "Cash",
      note: "Specialty chai & evening snacks"
    },
    {
      id: "tx-12",
      type: "income",
      amount: 5000,
      category: "Investments",
      date: formatOffsetDate(12),
      paymentMethod: "Bank Transfer",
      note: "Index fund dividend & interest credit"
    },
    {
      id: "tx-13",
      type: "expense",
      amount: 7500,
      category: "Travel",
      date: formatOffsetDate(14),
      paymentMethod: "Credit Card",
      note: "Weekend road trip resort booking"
    },
    // Previous month transactions for historical analytics
    {
      id: "tx-14",
      type: "income",
      amount: 85000,
      category: "Salary",
      date: formatOffsetDate(32),
      paymentMethod: "Bank Transfer",
      note: "Last Month Salary"
    },
    {
      id: "tx-15",
      type: "expense",
      amount: 22000,
      category: "Housing",
      date: formatOffsetDate(33),
      paymentMethod: "Bank Transfer",
      note: "Last Month Rent"
    },
    {
      id: "tx-16",
      type: "expense",
      amount: 12500,
      category: "Food & Dining",
      date: formatOffsetDate(35),
      paymentMethod: "UPI / Mobile Pay",
      note: "Monthly groceries and dining"
    },
    {
      id: "tx-17",
      type: "expense",
      amount: 6800,
      category: "Shopping",
      date: formatOffsetDate(38),
      paymentMethod: "Credit Card",
      note: "Clothing & footwear sale"
    },
    {
      id: "tx-18",
      type: "expense",
      amount: 4200,
      category: "Transportation",
      date: formatOffsetDate(40),
      paymentMethod: "UPI / Mobile Pay",
      note: "Monthly commute and fuel"
    },
    {
      id: "tx-19",
      type: "income",
      amount: 20000,
      category: "Freelance",
      date: formatOffsetDate(42),
      paymentMethod: "Bank Transfer",
      note: "Consulting stipend"
    },
    // 2 months ago transactions
    {
      id: "tx-20",
      type: "income",
      amount: 85000,
      category: "Salary",
      date: formatOffsetDate(62),
      paymentMethod: "Bank Transfer",
      note: "Salary"
    },
    {
      id: "tx-21",
      type: "expense",
      amount: 22000,
      category: "Housing",
      date: formatOffsetDate(63),
      paymentMethod: "Bank Transfer",
      note: "Rent"
    },
    {
      id: "tx-22",
      type: "expense",
      amount: 11400,
      category: "Food & Dining",
      date: formatOffsetDate(65),
      paymentMethod: "Credit Card",
      note: "Groceries and pantry staples"
    },
    {
      id: "tx-23",
      type: "expense",
      amount: 8500,
      category: "Shopping",
      date: formatOffsetDate(68),
      paymentMethod: "Debit Card",
      note: "Home appliances"
    }
  ];

  const budgets = {
    "Food & Dining": 15000,
    "Shopping": 10000,
    "Housing": 25000,
    "Transportation": 5000,
    "Bills & Utilities": 4000,
    "Entertainment": 3000,
    "Health & Fitness": 2500,
    "Travel": 8000,
    "Other": 3000
  };

  const goals = [
    {
      id: "goal-1",
      name: "Emergency Fund (6 Months)",
      targetAmount: 500000,
      currentAmount: 320000,
      category: "Savings",
      targetDate: "2026-12-31",
      color: "#10B981"
    },
    {
      id: "goal-2",
      name: "New MacBook Pro M4",
      targetAmount: 140000,
      currentAmount: 95000,
      category: "Gadgets",
      targetDate: "2026-11-15",
      color: "#6366F1"
    },
    {
      id: "goal-3",
      name: "Goa & Coastal Vacation",
      targetAmount: 60000,
      currentAmount: 28000,
      category: "Travel",
      targetDate: "2027-02-01",
      color: "#EC4899"
    }
  ];

  const settings = {
    currency: "₹",
    theme: "dark",
    dateFormat: "YYYY-MM-DD"
  };

  return { transactions, budgets, goals, settings };
}

module.exports = { generateSeedData };
