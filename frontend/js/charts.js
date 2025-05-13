// Chart instances
let incomeExpensesChart;
let expenseCategoriesChart;

// Initialize charts
function initCharts() {
    try {
        // Income vs Expenses Chart
        const incomeExpensesCtx = document.getElementById('income-expenses-chart').getContext('2d');
        incomeExpensesChart = new Chart(incomeExpensesCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Income',
                        data: [],
                        backgroundColor: 'rgba(76, 175, 80, 0.5)',
                        borderColor: 'rgba(76, 175, 80, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Expenses',
                        data: [],
                        backgroundColor: 'rgba(244, 67, 54, 0.5)',
                        borderColor: 'rgba(244, 67, 54, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                        }
                    },
                    x: {
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                        }
                    }
                }
            }
        });
        
        // Expense Categories Chart
        const expenseCategoriesCtx = document.getElementById('expense-categories-chart').getContext('2d');
        expenseCategoriesChart = new Chart(expenseCategoriesCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(255, 159, 64, 0.7)',
                        'rgba(199, 199, 199, 0.7)',
                        'rgba(83, 102, 255, 0.7)',
                        'rgba(255, 99, 255, 0.7)',
                        'rgba(99, 255, 132, 0.7)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)',
                        'rgba(199, 199, 199, 1)',
                        'rgba(83, 102, 255, 1)',
                        'rgba(255, 99, 255, 1)',
                        'rgba(99, 255, 132, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        
        // Update charts with initial data
        updateCharts();
    } catch (error) {
        console.error('Error initializing charts:', error);
    }
}

// Update charts with current data
function updateCharts() {
    try {
        updateIncomeExpensesChart();
        updateExpenseCategoriesChart();
    } catch (error) {
        console.error('Error updating charts:', error);
    }
}

// Update Income vs Expenses Chart
function updateIncomeExpensesChart() {
    try {
        // Get the last 6 months
        const months = getLastNMonths(6);
        
        // Initialize data arrays
        const incomeData = new Array(months.length).fill(0);
        const expenseData = new Array(months.length).fill(0);
        
        // Calculate income and expenses for each month
        transactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
            const monthIndex = months.indexOf(monthYear);
            
            if (monthIndex !== -1) {
                const convertedAmount = convertCurrency(transaction.amount, transaction.currency);
                
                if (transaction.type === 'income') {
                    incomeData[monthIndex] += convertedAmount;
                } else {
                    expenseData[monthIndex] += convertedAmount;
                }
            }
        });
        
        // Format month labels
        const formattedMonths = months.map(month => {
            const [monthNum, year] = month.split('/');
            const date = new Date(year, monthNum - 1);
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        });
        
        // Update chart data
        incomeExpensesChart.data.labels = formattedMonths;
        incomeExpensesChart.data.datasets[0].data = incomeData;
        incomeExpensesChart.data.datasets[1].data = expenseData;
        incomeExpensesChart.update();
    } catch (error) {
        console.error('Error updating income vs expenses chart:', error);
    }
}

// Update Expense Categories Chart
function updateExpenseCategoriesChart() {
    try {
        // Get all expense categories
        const categories = {};
        
        // Calculate total expenses for each category
        transactions.forEach(transaction => {
            if (transaction.type === 'expense') {
                const convertedAmount = convertCurrency(transaction.amount, transaction.currency);
                
                if (categories[transaction.category]) {
                    categories[transaction.category] += convertedAmount;
                } else {
                    categories[transaction.category] = convertedAmount;
                }
            }
        });
        
        // Sort categories by amount (descending)
        const sortedCategories = Object.entries(categories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10); // Show only top 10 categories
        
        // Update chart data
        expenseCategoriesChart.data.labels = sortedCategories.map(category => category[0]);
        expenseCategoriesChart.data.datasets[0].data = sortedCategories.map(category => category[1]);
        expenseCategoriesChart.update();
    } catch (error) {
        console.error('Error updating expense categories chart:', error);
    }
}

// Get the last N months in MM/YYYY format
function getLastNMonths(n) {
    try {
        const months = [];
        const today = new Date();
        
        for (let i = n - 1; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            months.push(`${month}/${year}`);
        }
        
        return months;
    } catch (error) {
        console.error('Error getting last N months:', error);
        return [];
    }
} 