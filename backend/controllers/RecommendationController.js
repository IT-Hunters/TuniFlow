const predict = async (financialData, apiBaseUrl = 'http://localhost:8000') => {
    try {
        if (!financialData || typeof financialData !== 'object') {
            throw new Error('Valid financial data object is required');
        }

        const requiredFeatures = [
            'total_spend', 'avg_spend', 'std_spend', 'avg_transaction_duration',
            'transaction_count', 'debit_credit_ratio', 'account_balance',
            'customer_age', 'customer_occupation', 'avg_transactions_per_month',
            'trans_freq_ratio'
        ];

        const payload = { ...financialData };
        requiredFeatures.forEach(feature => {
            if (!(feature in payload)) {
                payload[feature] = 0;
            } else {
                const value = Number(payload[feature]);
                if (isNaN(value)) {
                    throw new Error(`Invalid numeric value for ${feature}`);
                }
                payload[feature] = value;
            }
        });

        const response = await fetch(`${apiBaseUrl}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return {
            randomForestPrediction: data['Random Forest Prediction'],
            xgboostPrediction: data['XGBoost Prediction'],
            logisticRegressionPrediction: data['Logistic Regression Prediction'],
            bestPrediction: data['Best Prediction']
        };
    } catch (error) {
        console.error('Error in predict:', error.message);
        throw error;
    }
};

const recommendProject = async (projectId, financialData, apiBaseUrl = 'http://localhost:8000') => {
    try {
        if (!projectId) {
            throw new Error('Project ID is required');
        }
        if (!financialData || typeof financialData !== 'object') {
            throw new Error('Valid financial data object is required');
        }

        const requiredFeatures = [
            'total_spend', 'avg_spend', 'std_spend', 'avg_transaction_duration',
            'transaction_count', 'debit_credit_ratio', 'account_balance',
            'customer_age', 'customer_occupation', 'avg_transactions_per_month',
            'trans_freq_ratio'
        ];

        const payload = {
            project_id: projectId,
            financial_data: { ...financialData }
        };

        requiredFeatures.forEach(feature => {
            if (!(feature in payload.financial_data)) {
                payload.financial_data[feature] = 0;
            } else {
                const value = Number(payload.financial_data[feature]);
                if (isNaN(value)) {
                    throw new Error(`Invalid numeric value for ${feature}`);
                }
                payload.financial_data[feature] = value;
            }
        });

        const response = await fetch(`${apiBaseUrl}/recommend_project`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return {
            projectId: data.project_id,
            randomForestPrediction: data['Random Forest Prediction'],
            xgboostPrediction: data['XGBoost Prediction'],
            logisticRegressionPrediction: data['Logistic Regression Prediction'],
            bestRecommendation: data['Best Recommendation']
        };
    } catch (error) {
        console.error('Error in recommendProject:', error.message);
        throw error;
    }
};
const predictPriority = async (financialData, apiBaseUrl = 'http://localhost:8000') => {
    try {
        if (!financialData || typeof financialData !== 'object') {
            throw new Error('Valid financial data object is required');
        }

        const requiredFeatures = [
            'total_amount', 'avg_amount', 'std_amount', 'transaction_count',
            'transfer_ratio', 'avg_transactions_per_month', 'trans_freq_ratio',
            'Timestamp_Hour', 'Day_of_Month', 'merchant_category'
        ];

        const payload = { ...financialData };
        requiredFeatures.forEach(feature => {
            if (!(feature in payload)) {
                payload[feature] = feature === 'merchant_category' ? 'Unknown' : 0;
            } else if (feature !== 'merchant_category') {
                const value = Number(payload[feature]);
                if (isNaN(value)) {
                    throw new Error(`Invalid numeric value for ${feature}`);
                }
                payload[feature] = value;
            }
        });

        const response = await fetch(`${apiBaseUrl}/predict_priority`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return {
            randomForestPrediction: data['Random Forest Prediction'],
            xgboostPrediction: data['XGBoost Prediction'],
            logisticRegressionPrediction: data['Logistic Regression Prediction'],
            bestPrediction: data['Best Prediction']
        };
    } catch (error) {
        console.error('Error in predictPriority:', error.message);
        throw error;
    }
};

const predictSpendingBehavior = async (financialData, apiBaseUrl = 'http://localhost:8000') => {
    try {
        if (!financialData || typeof financialData !== 'object') {
            throw new Error('Valid financial data object is required');
        }

        const requiredFeatures = [
            'Transaction_Amount', 'TransactionType', 'Merchant_Category',
            'Transaction_Frequency', 'Timestamp_Hour'
        ];

        const payload = { ...financialData };
        requiredFeatures.forEach(feature => {
            if (!(feature in payload)) {
                if (feature === 'TransactionType') {
                    payload[feature] = 'Unknown';
                } else if (feature === 'Merchant_Category') {
                    payload[feature] = 'Unknown';
                } else {
                    payload[feature] = 0;
                }
            } else if (feature !== 'TransactionType' && feature !== 'Merchant_Category') {
                const value = Number(payload[feature]);
                if (isNaN(value)) {
                    throw new Error(`Invalid numeric value for ${feature}`);
                }
                payload[feature] = value;
            }
        });

        const response = await fetch(`${apiBaseUrl}/predict_spending_behavior`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return {
            knnPrediction: data['KNN Prediction'],
            svmPrediction: data['SVM Prediction'],
            decisionTreePrediction: data['Decision Tree Prediction'],
            xgboostPrediction: data['XGBoost Prediction'],
            bestPrediction: data['Best Prediction']
        };
    } catch (error) {
        console.error('Error in predictSpendingBehavior:', error.message);
        throw error;
    }
};

module.exports = { predict, recommendProject, predictPriority, predictSpendingBehavior };