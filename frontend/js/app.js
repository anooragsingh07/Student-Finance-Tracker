// Global variables
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let categories = {
    income: ['Allowance', 'Part-time Job', 'Scholarship', 'Gifts', 'Other Income'],
    expense: [
        'Tuition Fees',
        'Hostel/Rent',
        'Food & Dining',
        'Transportation',
        'Books & Stationery',
        'Electronics',
        'Clothing',
        'Entertainment',
        'Healthcare',
        'Other Expenses'
    ]
};
let currentCurrency = localStorage.getItem('currency') || 'USD';
let exchangeRates = {};

// Budget limits for different categories (in USD)
const budgetLimits = {
    'Tuition Fees': 1000,
    'Hostel/Rent': 500,
    'Food & Dining': 300,
    'Transportation': 100,
    'Books & Stationery': 200,
    'Electronics': 300,
    'Clothing': 150,
    'Entertainment': 100,
    'Healthcare': 100,
    'Other Expenses': 200
};

// DOM Elements
const transactionForm = document.getElementById('transaction-form');
const transactionTypeSelect = document.getElementById('transaction-type');
const categorySelect = document.getElementById('category');
const amountInput = document.getElementById('amount');
const dateInput = document.getElementById('date');
const descriptionInput = document.getElementById('description');
const transactionsBody = document.getElementById('transactions-body');
const totalIncomeElement = document.getElementById('total-income');
const totalExpensesElement = document.getElementById('total-expenses');
const balanceElement = document.getElementById('balance');
const currencySelect = document.getElementById('currency');
const currentDateElement = document.getElementById('current-date');
const searchTransactionsInput = document.getElementById('search-transactions');
const filterCategorySelect = document.getElementById('filter-category');

// Initialize the application
function init() {
    try {
        // Set current date
        const today = new Date();
        currentDateElement.textContent = today.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        // Set default date in the form
        dateInput.valueAsDate = today;
        
        // Set currency from localStorage
        currencySelect.value = currentCurrency;
        
        // Populate categories
        updateCategoryOptions();
        
        // Populate filter categories
        populateFilterCategories();
        
        // Fetch exchange rates
        fetchExchangeRates();
        
        // Render transactions
        renderTransactions();
        
        // Update summary
        updateSummary();
        
        // Initialize charts
        if (typeof initCharts === 'function') {
            initCharts();
        }
        
        // Update predictions
        if (typeof updatePredictions === 'function') {
            updatePredictions();
        }
    } catch (error) {
        console.error('Error initializing application:', error);
        alert('There was an error initializing the application. Please refresh the page.');
    }
}

// Update category options based on transaction type
function updateCategoryOptions() {
    try {
        const type = transactionTypeSelect.value;
        categorySelect.innerHTML = '';
        
        categories[type].forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error updating category options:', error);
    }
}

// Populate filter categories
function populateFilterCategories() {
    try {
        filterCategorySelect.innerHTML = '<option value="all">All Categories</option>';
        
        // Add income categories
        categories.income.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            filterCategorySelect.appendChild(option);
        });
        
        // Add expense categories
        categories.expense.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            filterCategorySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error populating filter categories:', error);
    }
}

// Fetch exchange rates from API
async function fetchExchangeRates() {
    try {
        // In a real application, you would use a real API
        // For this demo, we'll use mock data
        exchangeRates = {
            USD: 1,
            EUR: 0.85,
            GBP: 0.73,
            INR: 75.0
        };
        
        // Real API call would look like:
        // const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        // if (!response.ok) throw new Error('Failed to fetch exchange rates');
        // exchangeRates = await response.json();
        
        console.log('Exchange rates loaded:', exchangeRates);
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        alert('Failed to load exchange rates. Using default rates.');
    }
}

// Convert amount to current currency
function convertCurrency(amount, fromCurrency = 'USD') {
    try {
        if (!amount || isNaN(amount)) return 0;
        if (fromCurrency === currentCurrency) return amount;
        
        // Convert to USD first (if not already USD)
        let amountInUSD = amount;
        if (fromCurrency !== 'USD') {
            amountInUSD = amount / (exchangeRates[fromCurrency] || 1);
        }
        
        // Convert from USD to current currency
        return amountInUSD * (exchangeRates[currentCurrency] || 1);
    } catch (error) {
        console.error('Error converting currency:', error);
        return amount;
    }
}

// Format currency
function formatCurrency(amount) {
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currentCurrency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    } catch (error) {
        console.error('Error formatting currency:', error);
        return amount.toString();
    }
}

// Check if expense exceeds budget limit
function checkBudgetLimit(category, amount) {
    const limit = budgetLimits[category];
    if (!limit) return true;
    
    const convertedAmount = convertCurrency(amount, currentCurrency);
    return convertedAmount <= limit;
}

// Add a new transaction
function addTransaction(e) {
    e.preventDefault();
    
    try {
        const type = transactionTypeSelect.value;
        const category = categorySelect.value;
        const amount = parseFloat(amountInput.value);
        const date = dateInput.value;
        const description = descriptionInput.value.trim() || category;
        
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }
        
        // Check budget limit for expenses
        if (type === 'expense' && !checkBudgetLimit(category, amount)) {
            const limit = formatCurrency(convertCurrency(budgetLimits[category], 'USD'));
            if (!confirm(`This expense exceeds the recommended budget limit of ${limit} for ${category}. Do you want to proceed?`)) {
                return;
            }
        }
        
        const transaction = {
            id: Date.now(),
            type,
            category,
            amount,
            date,
            description,
            currency: currentCurrency
        };
        
        transactions.push(transaction);
        saveTransactions();
        
        // Reset form
        transactionForm.reset();
        dateInput.valueAsDate = new Date();
        
        // Update UI
        renderTransactions();
        updateSummary();
        if (typeof updateCharts === 'function') updateCharts();
        if (typeof updatePredictions === 'function') updatePredictions();
        
        // Show success message
        alert('Transaction added successfully!');
    } catch (error) {
        console.error('Error adding transaction:', error);
        alert('Failed to add transaction. Please try again.');
    }
}

// Save transactions to localStorage
function saveTransactions() {
    try {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    } catch (error) {
        console.error('Error saving transactions:', error);
        alert('Failed to save transactions. Please check your browser storage.');
    }
}

// Render transactions in the table
function renderTransactions() {
    try {
        const searchTerm = searchTransactionsInput.value.toLowerCase();
        const filterCategory = filterCategorySelect.value;
        
        // Filter transactions
        let filteredTransactions = transactions.filter(transaction => {
            const matchesSearch = transaction.description.toLowerCase().includes(searchTerm) || 
                                transaction.category.toLowerCase().includes(searchTerm);
            const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory;
            
            return matchesSearch && matchesCategory;
        });
        
        // Sort by date (newest first)
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Clear table
        transactionsBody.innerHTML = '';
        
        if (filteredTransactions.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="5" class="text-center">No transactions found</td>`;
            transactionsBody.appendChild(row);
            return;
        }
        
        // Add transactions to table
        filteredTransactions.forEach(transaction => {
            const row = document.createElement('tr');
            
            // Format date
            const date = new Date(transaction.date);
            const formattedDate = date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            
            // Format amount
            const convertedAmount = convertCurrency(transaction.amount, transaction.currency);
            const formattedAmount = formatCurrency(convertedAmount);
            
            // Check if expense exceeds budget limit
            const exceedsLimit = transaction.type === 'expense' && 
                               !checkBudgetLimit(transaction.category, transaction.amount);
            
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${transaction.description}</td>
                <td>${transaction.category}</td>
                <td class="${transaction.type === 'income' ? 'income-amount' : 'expense-amount'} ${exceedsLimit ? 'exceeds-limit' : ''}">${formattedAmount}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${transaction.id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${transaction.id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            transactionsBody.appendChild(row);
        });
        
        // Add event listeners to action buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', editTransaction);
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', deleteTransaction);
        });
    } catch (error) {
        console.error('Error rendering transactions:', error);
        alert('Failed to display transactions. Please refresh the page.');
    }
}

// Edit a transaction
function editTransaction(e) {
    try {
        const id = parseInt(e.currentTarget.dataset.id);
        const transaction = transactions.find(t => t.id === id);
        
        if (!transaction) {
            alert('Transaction not found');
            return;
        }
        
        // Fill form with transaction data
        transactionTypeSelect.value = transaction.type;
        updateCategoryOptions();
        categorySelect.value = transaction.category;
        amountInput.value = transaction.amount;
        dateInput.value = transaction.date;
        descriptionInput.value = transaction.description;
        
        // Remove the transaction
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
        
        // Update UI
        renderTransactions();
        updateSummary();
        if (typeof updateCharts === 'function') updateCharts();
        if (typeof updatePredictions === 'function') updatePredictions();
        
        // Scroll to form
        transactionForm.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error editing transaction:', error);
        alert('Failed to edit transaction. Please try again.');
    }
}

// Delete a transaction
function deleteTransaction(e) {
    try {
        if (!confirm('Are you sure you want to delete this transaction?')) return;
        
        const id = parseInt(e.currentTarget.dataset.id);
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
        
        // Update UI
        renderTransactions();
        updateSummary();
        if (typeof updateCharts === 'function') updateCharts();
        if (typeof updatePredictions === 'function') updatePredictions();
    } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Failed to delete transaction. Please try again.');
    }
}

// Update summary (total income, expenses, balance)
function updateSummary() {
    try {
        let totalIncome = 0;
        let totalExpenses = 0;
        
        transactions.forEach(transaction => {
            const convertedAmount = convertCurrency(transaction.amount, transaction.currency);
            
            if (transaction.type === 'income') {
                totalIncome += convertedAmount;
            } else {
                totalExpenses += convertedAmount;
            }
        });
        
        const balance = totalIncome - totalExpenses;
        
        totalIncomeElement.textContent = formatCurrency(totalIncome);
        totalExpensesElement.textContent = formatCurrency(totalExpenses);
        balanceElement.textContent = formatCurrency(balance);
        
        // Add color to balance
        if (balance < 0) {
            balanceElement.style.color = 'var(--danger-color)';
        } else {
            balanceElement.style.color = 'var(--primary-color)';
        }
    } catch (error) {
        console.error('Error updating summary:', error);
    }
}

// Change currency
function changeCurrency() {
    try {
        currentCurrency = currencySelect.value;
        localStorage.setItem('currency', currentCurrency);
        
        // Update UI
        renderTransactions();
        updateSummary();
        if (typeof updateCharts === 'function') updateCharts();
    } catch (error) {
        console.error('Error changing currency:', error);
        alert('Failed to change currency. Please try again.');
    }
}

// Event Listeners
transactionTypeSelect.addEventListener('change', updateCategoryOptions);
transactionForm.addEventListener('submit', addTransaction);
currencySelect.addEventListener('change', changeCurrency);
searchTransactionsInput.addEventListener('input', renderTransactions);
filterCategorySelect.addEventListener('change', renderTransactions);

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init); 