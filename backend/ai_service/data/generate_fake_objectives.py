import pandas as pd
import random
from faker import Faker
import os

fake = Faker()

# List of objective types
objective_types = [
    "BUDGET", "COST_REDUCTION", "REVENUE_GROWTH",
    "PROFIT_MARGIN", "CASH_FLOW", "INVESTMENT",
    "DEBT_MANAGEMENT", "EXPENSE_CONTROL", "TAX_OPTIMIZATION"
]

# Generate fake objectives
def generate_fake_objectives(n=1000):
    objectives = []
    for _ in range(n):
        start_date = fake.date_between(start_date="-2y", end_date="today")
        end_date = fake.date_between(start_date=start_date, end_date="+1y")
        progress = random.uniform(0, 100)
        target_amount = random.randint(1000, 100000)
        minbudget = int(target_amount * 0.5)
        maxbudget = int(target_amount * 1.5)
        objective_type = random.choice(objective_types)
        is_static = random.choice([True, False])

        # --- Generate completed field ---
        # if progress >= 90% AND end_date is not too far from today, probably completed
        if progress >= 90 and fake.boolean(chance_of_getting_true=70):
            completed = 1
        elif progress >= 50 and fake.boolean(chance_of_getting_true=30):
            completed = 1
        else:
            completed = 0

        obj = {
            "name": fake.sentence(nb_words=3),
            "description": fake.text(max_nb_chars=200),
            "target_amount": target_amount,
            "minbudget": minbudget,
            "maxbudget": maxbudget,
            "datedebut": start_date,
            "datefin": end_date,
            "progress": progress,
            "status": random.choice(["InProgress", "Completed", "Failed"]),
            "objectivetype": objective_type,
            "isStatic": is_static,
            "completed": completed   # <==== ADD THIS
        }
        objectives.append(obj)
    return objectives

# Save to CSV
if __name__ == "__main__":
    os.makedirs("../data", exist_ok=True)
    df = pd.DataFrame(generate_fake_objectives(1000))
    df.to_csv("../data/objectives.csv", index=False)
    print("✅ Fake objectives dataset generated!")
