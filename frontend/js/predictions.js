// DOM Elements
const predictedExpenseElement = document.getElementById('predicted-expense');
const recommendationsList = document.getElementById('recommendations-list');

// Update predictions and recommendations
function updatePredictions() {
    predictNextMonthExpenses();
    generateBudgetRecommendations();
}

// Predict next month's expenses based on historical data
function predictNextMonthExpenses() {
    try {
        // If there are no transactions, show default message
        if (transactions.length === 0) {
            predictedExpenseElement.textContent = formatCurrency(0);
            return;
        }
        
        // Get the last 3 months of expense data
        const months = getLastNMonths(3);
        const monthlyExpenses = [];
        
        // Calculate total expenses for each month
        months.forEach(month => {
            const [monthNum, year] = month.split('/');
            const startDate = new Date(year, monthNum - 1, 1);
            const endDate = new Date(year, monthNum, 0);
            
            let totalExpenses = 0;
            
            transactions.forEach(transaction => {
                if (transaction.type === 'expense') {
                    const transactionDate = new Date(transaction.date);
                    
                    if (transactionDate >= startDate && transactionDate <= endDate) {
                        const convertedAmount = convertCurrency(transaction.amount, transaction.currency);
                        totalExpenses += convertedAmount;
                    }
                }
            });
            
            monthlyExpenses.push(totalExpenses);
        });
        
        // Calculate average monthly expenses
        const averageExpenses = monthlyExpenses.reduce((sum, expense) => sum + expense, 0) / monthlyExpenses.length;
        
        // Apply a simple trend analysis (if we have enough data)
        let predictedExpenses = averageExpenses;
        
        if (monthlyExpenses.length >= 2) {
            // Calculate the trend (increase or decrease)
            const trend = monthlyExpenses[monthlyExpenses.length - 1] - monthlyExpenses[0];
            const trendFactor = trend / monthlyExpenses.length;
            
            // Apply the trend to the prediction
            predictedExpenses += trendFactor;
        }
        
        // Ensure the prediction is not negative
        predictedExpenses = Math.max(0, predictedExpenses);
        
        // Update the UI
        predictedExpenseElement.textContent = formatCurrency(predictedExpenses);
    } catch (error) {
        console.error('Error predicting expenses:', error);
    }
}

// Generate budget recommendations based on spending patterns
function generateBudgetRecommendations() {
    try {
        // Clear previous recommendations
        recommendationsList.innerHTML = '';
        
        // If there are no transactions, show default message
        if (transactions.length === 0) {
            const li = document.createElement('li');
            li.innerHTML = '<i class="fas fa-info-circle"></i> Start tracking your expenses to get personalized recommendations';
            recommendationsList.appendChild(li);
            return;
        }
        
        // Get total expenses
        let totalExpenses = 0;
        const categoryExpenses = {};
        
        transactions.forEach(transaction => {
            if (transaction.type === 'expense') {
                const convertedAmount = convertCurrency(transaction.amount, transaction.currency);
                totalExpenses += convertedAmount;
                
                if (categoryExpenses[transaction.category]) {
                    categoryExpenses[transaction.category] += convertedAmount;
                } else {
                    categoryExpenses[transaction.category] = convertedAmount;
                }
            }
        });
        
        // Calculate percentage of total expenses for each category
        const categoryPercentages = {};
        
        for (const category in categoryExpenses) {
            categoryPercentages[category] = (categoryExpenses[category] / totalExpenses) * 100;
        }
        
        // Generate recommendations based on spending patterns
        const recommendations = [];
        
        // Check for high spending categories
        for (const category in categoryPercentages) {
            const percentage = categoryPercentages[category];
            const limit = budgetLimits[category];
            
            if (limit && categoryExpenses[category] > limit) {
                recommendations.push({
                    icon: 'fa-exclamation-triangle',
                    text: `Your ${category} expenses (${formatCurrency(categoryExpenses[category])}) exceed the recommended budget of ${formatCurrency(limit)}. Consider reducing spending in this category.`
                });
            }
        }
        
        // Check for balanced budget
        let totalIncome = 0;
        
        transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                const convertedAmount = convertCurrency(transaction.amount, transaction.currency);
                totalIncome += convertedAmount;
            }
        });
        
        const savingsRate = ((totalIncome - totalExpenses) / totalIncome) * 100;
        
        if (savingsRate < 0) {
            recommendations.push({
                icon: 'fa-exclamation-circle',
                text: 'You are spending more than you earn. Consider reducing expenses or finding additional income sources like part-time work or scholarships.'
            });
        } else if (savingsRate < 10) {
            recommendations.push({
                icon: 'fa-piggy-bank',
                text: `Your savings rate is ${savingsRate.toFixed(1)}%. Try to save at least 20% of your income for emergencies and future expenses.`
            });
        } else if (savingsRate >= 20) {
            recommendations.push({
                icon: 'fa-star',
                text: `Great job! Your savings rate is ${savingsRate.toFixed(1)}%, which is above the recommended 20%. Keep up the good work!`
            });
        }
        
        // Check for irregular spending patterns
        const months = getLastNMonths(3);
        const monthlyExpenses = [];
        
        months.forEach(month => {
            const [monthNum, year] = month.split('/');
            const startDate = new Date(year, monthNum - 1, 1);
            const endDate = new Date(year, monthNum, 0);
            
            let totalExpenses = 0;
            
            transactions.forEach(transaction => {
                if (transaction.type === 'expense') {
                    const transactionDate = new Date(transaction.date);
                    
                    if (transactionDate >= startDate && transactionDate <= endDate) {
                        const convertedAmount = convertCurrency(transaction.amount, transaction.currency);
                        totalExpenses += convertedAmount;
                    }
                }
            });
            
            monthlyExpenses.push(totalExpenses);
        });
        
        // Calculate standard deviation of monthly expenses
        const mean = monthlyExpenses.reduce((sum, expense) => sum + expense, 0) / monthlyExpenses.length;
        const squaredDifferences = monthlyExpenses.map(expense => Math.pow(expense - mean, 2));
        const variance = squaredDifferences.reduce((sum, squaredDiff) => sum + squaredDiff, 0) / monthlyExpenses.length;
        const standardDeviation = Math.sqrt(variance);
        const coefficientOfVariation = (standardDeviation / mean) * 100;
        
        if (coefficientOfVariation > 30) {
            recommendations.push({
                icon: 'fa-chart-line',
                text: 'Your spending varies significantly from month to month. Try to maintain a more consistent budget to better manage your finances.'
            });
        }
        
        // Add student-specific recommendations
        if (categoryExpenses['Books & Stationery'] && categoryExpenses['Books & Stationery'] > 200) {
            recommendations.push({
                icon: 'fa-book',
                text: 'Consider buying used textbooks or sharing with classmates to reduce book expenses.'
            });
        }
        
        if (categoryExpenses['Food & Dining'] && categoryExpenses['Food & Dining'] > 300) {
            recommendations.push({
                icon: 'fa-utensils',
                text: 'Try cooking meals at home and using student meal plans to save on food expenses.'
            });
        }
        
        if (categoryExpenses['Entertainment'] && categoryExpenses['Entertainment'] > 100) {
            recommendations.push({
                icon: 'fa-film',
                text: 'Look for student discounts and free campus events for entertainment.'
            });
        }
        
        // If no specific recommendations, add a general one
        if (recommendations.length === 0) {
            recommendations.push({
                icon: 'fa-thumbs-up',
                text: 'Your spending patterns look good! Keep up the good work with your budgeting.'
            });
        }
        
        // Add recommendations to the UI
        recommendations.forEach(recommendation => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fas ${recommendation.icon}"></i> ${recommendation.text}`;
            recommendationsList.appendChild(li);
        });
    } catch (error) {
        console.error('Error generating recommendations:', error);
    }
} 