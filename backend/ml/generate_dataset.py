import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder

# Paramètres pour le dataset synthétique
np.random.seed(42)
num_samples = 1000

# Générer des données synthétiques
data = {
    "amount": np.random.uniform(100, 5000, num_samples),  # Montants entre 100 et 5000 TND
    "days_to_due": np.random.randint(1, 60, num_samples),  # Délais entre 1 et 60 jours
    "category": np.random.choice(["Consulting", "Services", "Products", "Freelance", "Maintenance", "Other"], num_samples),
    "project_status": np.random.choice(["In Progress", "Completed", "Delayed", "PENDING"], num_samples),  # Ajout de PENDING
}

# Créer un DataFrame
df = pd.DataFrame(data)

# Générer le statut de la facture en fonction de règles simples
def determine_status(row):
    if row["days_to_due"] > 30 and row["amount"] > 2000:
        return np.random.choice(["OVERDUE", "CANCELLED"], p=[0.7, 0.3])
    elif row["amount"] < 500:
        return np.random.choice(["PAID", "OVERDUE"], p=[0.9, 0.1])
    else:
        return np.random.choice(["PAID", "OVERDUE", "CANCELLED"], p=[0.6, 0.3, 0.1])

df["status"] = df.apply(determine_status, axis=1)

# Sauvegarder le dataset
df.to_csv("data/invoices_synthetic.csv", index=False)
print("Dataset généré et sauvegardé dans data/invoices_synthetic.csv")