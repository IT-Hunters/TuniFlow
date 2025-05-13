import pymongo
from bson import ObjectId
import random
import datetime

# Connexion MongoDB
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["TuniFlow"]

# ID du projet
project_id = ObjectId("67e62d89b1415c6f72e1286a")

# Nombre de transactions à ajouter
nb_transactions = 50

# Générer des transactions aléatoires
transactions = []
start_date = datetime.datetime.now() - datetime.timedelta(days=100)
for i in range(nb_transactions):
    # Pour simuler des jours positifs et négatifs aléatoires
    transaction_type = random.choice(["income", "expense"])
    amount = round(random.uniform(100, 1000), 2) if transaction_type == "income" else round(random.uniform(100, 800), 2)
    transaction = {
        "type": transaction_type,
        "amount": amount,
        "description": f"Transaction auto {i+1} ({transaction_type})",
        "date": (start_date + datetime.timedelta(days=i)).isoformat()
    }
    transactions.append(transaction)

# Insérer les transactions
result = db.transactions.insert_many(transactions)
print(f"✅ {len(result.inserted_ids)} transactions insérées.")

# Mettre à jour le projet pour lier les transactions
db.projects.update_one(
    {"_id": project_id},
    {"$addToSet": {"transactions": {"$each": result.inserted_ids}}}
)

print(f"✅ Transactions ajoutées au projet {project_id}")

# Fermer la connexion
client.close()
