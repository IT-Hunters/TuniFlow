class TaxForecastModel:
    def __init__(self):
        self.historical_data = []
        self.tax_types = set()

    def prepare_features(self, data):
        """Prepares features for training."""
        features = []
        for entry in data:
            feature = {
                'total_revenue': entry['total_revenue'],
                'total_expenses': entry['total_expenses'],
                'net_profit': entry['net_profit']
            }
            features.append(feature)
        return features

    def train(self, historical_data):
        """Trains the model with historical data."""
        self.historical_data = historical_data
        # Collect all tax types
        for entry in historical_data:
            for tax in entry['taxes']:
                self.tax_types.add(tax['type'])

    def predict(self, current_data):
        """Makes predictions for current data."""
        if not self.historical_data:
            print("No historical data available")
            return []

        predictions = []
        for tax_type in self.tax_types:
            # Calculate the average of historical taxes for this type
            historical_taxes = []
            for entry in self.historical_data:
                for tax in entry['taxes']:
                    if tax['type'] == tax_type:
                        try:
                            amount = float(tax['amount'])
                            if not isinstance(amount, float) or amount < 0:
                                print(f"Invalid amount for {tax_type}: {amount}")
                                continue
                            historical_taxes.append(amount)
                        except (ValueError, TypeError) as e:
                            print(f"Conversion error for {tax_type}: {e}")
                            continue
            
            print(f"Historical taxes for {tax_type}: {historical_taxes}")
            
            if historical_taxes:
                avg_tax = sum(historical_taxes) / len(historical_taxes)
                # Calculate confidence level
                confidence = self.calculate_confidence(historical_taxes, current_data)
                predictions.append({
                    'type': tax_type,
                    'predicted_amount': float(round(avg_tax, 2)),
                    'confidence': float(confidence)
                })
                print(f"Prediction for {tax_type}: amount={avg_tax}, confidence={confidence}")
            else:
                print(f"No historical data found for {tax_type}")

        return predictions

    def calculate_confidence(self, historical_taxes, current_data):
        """Calculates the confidence level of the prediction."""
        if not historical_taxes:
            return 0.5  # Minimum confidence if no historical data

        try:
            # Calculate variance of historical taxes
            mean = sum(historical_taxes) / len(historical_taxes)
            if mean == 0:
                return 0.5  # Minimum confidence if mean is zero
            
            variance = sum((x - mean) ** 2 for x in historical_taxes) / len(historical_taxes)
            
            # The lower the variance, the higher the confidence
            base_confidence = 1.0 - min(variance / (mean * mean), 0.5)
            
            # Adjust confidence based on number of historical data points
            data_points_factor = min(len(historical_taxes) / 12, 1.0)  # Normalize over 12 months
            
            # Adjust confidence based on data recency
            recency_factor = 1.0 if len(historical_taxes) >= 3 else 0.7
            
            final_confidence = base_confidence * data_points_factor * recency_factor
            
            # Limit confidence between 0.5 and 0.95
            return max(0.5, min(0.95, final_confidence))
        except Exception as e:
            print(f"Error calculating confidence: {e}")
            return 0.5  # Return minimum confidence in case of error

    def calculate_recent_trend(self, historical_data):
        """Calculates recent trend in financial data."""
        if len(historical_data) < 2:
            return 0

        recent_data = historical_data[:3]  # Take the last 3 months
        if len(recent_data) < 2:
            return 0

        # Calculate trend for each metric
        revenue_trend = self._calculate_trend([d['total_revenue'] for d in recent_data])
        expenses_trend = self._calculate_trend([d['total_expenses'] for d in recent_data])
        profit_trend = self._calculate_trend([d['net_profit'] for d in recent_data])

        return {
            'revenue_trend': revenue_trend,
            'expenses_trend': expenses_trend,
            'profit_trend': profit_trend
        }

    def _calculate_trend(self, values):
        """Calculates trend for a series of values."""
        if len(values) < 2:
            return 0

        # Calculate average difference between consecutive values
        differences = [values[i] - values[i-1] for i in range(1, len(values))]
        return sum(differences) / len(differences) 