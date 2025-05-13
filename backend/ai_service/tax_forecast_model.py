class TaxForecastModel:
    def __init__(self):
        self.historical_data = []
        self.tax_types = set()

    def prepare_features(self, data):
        """Prépare les caractéristiques pour l'entraînement."""
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
        """Entraîne le modèle avec les données historiques."""
        self.historical_data = historical_data
        # Collecter tous les types de taxes
        for entry in historical_data:
            for tax in entry['taxes']:
                self.tax_types.add(tax['type'])

    def predict(self, current_data):
        """Fait des prédictions pour les données actuelles."""
        if not self.historical_data:
            print("Aucune donnée historique disponible")
            return []

        predictions = []
        for tax_type in self.tax_types:
            # Calculer la moyenne des taxes historiques pour ce type
            historical_taxes = []
            for entry in self.historical_data:
                for tax in entry['taxes']:
                    if tax['type'] == tax_type:
                        try:
                            amount = float(tax['amount'])
                            if not isinstance(amount, float) or amount < 0:
                                print(f"Montant invalide pour {tax_type}: {amount}")
                                continue
                            historical_taxes.append(amount)
                        except (ValueError, TypeError) as e:
                            print(f"Erreur de conversion pour {tax_type}: {e}")
                            continue
            
            print(f"Taxes historiques pour {tax_type}: {historical_taxes}")
            
            if historical_taxes:
                avg_tax = sum(historical_taxes) / len(historical_taxes)
                # Calculer le niveau de confiance
                confidence = self.calculate_confidence(historical_taxes, current_data)
                predictions.append({
                    'type': tax_type,
                    'predicted_amount': float(round(avg_tax, 2)),
                    'confidence': float(confidence)
                })
                print(f"Prédiction pour {tax_type}: montant={avg_tax}, confiance={confidence}")
            else:
                print(f"Aucune donnée historique trouvée pour {tax_type}")

        return predictions

    def calculate_confidence(self, historical_taxes, current_data):
        """Calcule le niveau de confiance de la prédiction."""
        if not historical_taxes:
            return 0.5  # Confiance minimale si pas de données historiques

        try:
            # Calculer la variance des taxes historiques
            mean = sum(historical_taxes) / len(historical_taxes)
            if mean == 0:
                return 0.5  # Confiance minimale si moyenne nulle
            
            variance = sum((x - mean) ** 2 for x in historical_taxes) / len(historical_taxes)
            
            # Plus la variance est faible, plus la confiance est élevée
            base_confidence = 1.0 - min(variance / (mean * mean), 0.5)
            
            # Ajuster la confiance en fonction du nombre de données historiques
            data_points_factor = min(len(historical_taxes) / 12, 1.0)  # Normaliser sur 12 mois
            
            # Ajuster la confiance en fonction de la récence des données
            recency_factor = 1.0 if len(historical_taxes) >= 3 else 0.7
            
            final_confidence = base_confidence * data_points_factor * recency_factor
            
            # Limiter la confiance entre 0.5 et 0.95
            return max(0.5, min(0.95, final_confidence))
        except Exception as e:
            print(f"Erreur lors du calcul de la confiance: {e}")
            return 0.5  # Retourner une confiance minimale en cas d'erreur

    def calculate_recent_trend(self, historical_data):
        """Calcule la tendance récente des données financières."""
        if len(historical_data) < 2:
            return 0

        recent_data = historical_data[:3]  # Prendre les 3 derniers mois
        if len(recent_data) < 2:
            return 0

        # Calculer la tendance pour chaque métrique
        revenue_trend = self._calculate_trend([d['total_revenue'] for d in recent_data])
        expenses_trend = self._calculate_trend([d['total_expenses'] for d in recent_data])
        profit_trend = self._calculate_trend([d['net_profit'] for d in recent_data])

        return {
            'revenue_trend': revenue_trend,
            'expenses_trend': expenses_trend,
            'profit_trend': profit_trend
        }

    def _calculate_trend(self, values):
        """Calcule la tendance d'une série de valeurs."""
        if len(values) < 2:
            return 0

        # Calculer la différence moyenne entre les valeurs consécutives
        differences = [values[i] - values[i-1] for i in range(1, len(values))]
        return sum(differences) / len(differences) 