import pymongo
import pandas as pd
import plotly.graph_objects as go
from bson import ObjectId
from prophet import Prophet
import plotly.offline as pyo

# Connexion MongoDB
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["TuniFlow"]

# Préparer les données UNIQUEMENT pour le projet demandé
def prepare_project_data(project_id):
    project = db.projects.find_one({"_id": ObjectId(project_id)})

    if not project or 'transactions' not in project:
        raise ValueError(f"Aucune transaction liée trouvée pour le projet {project_id}")

    transactions = list(db.transactions.find({"_id": {"$in": project['transactions']}}))

    if not transactions:
        raise ValueError(f"Aucune transaction récupérée pour le projet {project_id}")

    df = pd.DataFrame(transactions)
    df['date'] = pd.to_datetime(df['date'])

    df['revenue'] = df.apply(lambda row: row['amount'] if row['type'].lower() == 'income' else 0, axis=1)
    df['expense'] = df.apply(lambda row: row['amount'] if row['type'].lower() == 'expense' else 0, axis=1)
    df['tax'] = 0  # Si tu n'utilises pas 'tax', tu peux mettre à 0

    df_daily = df.groupby('date').agg({
        'revenue': 'sum',
        'expense': 'sum',
        'tax': 'sum'
    }).reset_index()

    df_daily['net_result'] = df_daily['revenue'] - df_daily['expense'] - df_daily['tax']
    df_prophet = df_daily[['date', 'net_result']].rename(columns={'date': 'ds', 'net_result': 'y'})

    return df_prophet

# Entraîner Prophet et prédire
def train_and_predict_for_project(project_id, periods=30):
    df = prepare_project_data(project_id)
    print(f"Données pour le projet {project_id} : {df.shape[0]} jours.")

    model = Prophet(daily_seasonality=True, yearly_seasonality=True)
    model.fit(df)

    future = model.make_future_dataframe(periods=periods)
    forecast = model.predict(future)

    predictions = forecast.tail(periods)[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]
    return df, forecast, predictions

# Fonction principale avec génération HTML interactif
def main():
    try:
        project_id_input = input("👉 Entre l'ID du projet MongoDB : ").strip()

        df, forecast, predictions = train_and_predict_for_project(project_id_input)

        # Création figure interactive Plotly
        fig = go.Figure()

        fig.add_trace(go.Scatter(
            x=forecast['ds'], y=forecast['yhat'],
            mode='lines', name='Prédiction (yhat)', line=dict(color='blue')
        ))

        fig.add_trace(go.Scatter(
            x=forecast['ds'], y=forecast['yhat_upper'],
            mode='lines', name='Upper', line=dict(color='lightblue'), showlegend=False
        ))

        fig.add_trace(go.Scatter(
            x=forecast['ds'], y=forecast['yhat_lower'],
            mode='lines', fill='tonexty', line=dict(color='lightblue'), name='Intervalle de confiance'
        ))

        fig.add_trace(go.Scatter(
            x=df['ds'], y=df['y'],
            mode='markers', name='Historique Net Résultat', marker=dict(color='green', size=6)
        ))

        fig.update_layout(
            title=f"📊 Prédictions Prophet DÉDIÉES - Projet {project_id_input}",
            xaxis_title='Date',
            yaxis_title='Résultat Net Prévu',
            template='plotly_white'
        )

        # Enregistrer en HTML interactif
        output_file = f"prediction_project_{project_id_input}.html"
        pyo.plot(fig, filename=output_file, auto_open=True)

        print(f"\n✔️ Graphique interactif généré dans le fichier : {output_file}")

    except Exception as e:
        print(f"❌ Erreur : {e}")

    finally:
        client.close()

if __name__ == "__main__":
    main()
