import sys
import io
import pymongo
import pandas as pd
import plotly.graph_objects as go
from bson import ObjectId
from prophet import Prophet
import plotly.offline as pyo
import os

# ✅ Forcer sortie UTF-8 même sous Windows cmd
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Connexion MongoDB
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["TuniFlow"]

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
    df['tax'] = 0

    df_daily = df.groupby('date').agg({
        'revenue': 'sum',
        'expense': 'sum',
        'tax': 'sum'
    }).reset_index()

    df_daily['net_result'] = df_daily['revenue'] - df_daily['expense'] - df_daily['tax']
    df_prophet = df_daily[['date', 'net_result']].rename(columns={'date': 'ds', 'net_result': 'y'})

    return df_prophet

def train_and_predict_for_project(project_id, periods=30):
    df = prepare_project_data(project_id)
    print(f"Données pour le projet {project_id} : {df.shape[0]} jours.")

    model = Prophet(daily_seasonality=True, yearly_seasonality=True)
    model.fit(df)

    future = model.make_future_dataframe(periods=periods)
    forecast = model.predict(future)

    last_date = df['ds'].max()
    future_forecast = forecast[forecast['ds'] > last_date]

    return df, forecast, future_forecast

def main():
    try:
        if len(sys.argv) != 2:
            print("Erreur : Merci de fournir l'ID du projet comme argument.")
            sys.exit(1)

        project_id_input = sys.argv[1]

        df, forecast, future_forecast = train_and_predict_for_project(project_id_input)

        fig = go.Figure()

    

        fig.add_trace(go.Scatter(
            x=future_forecast['ds'], y=future_forecast['yhat'],
            mode='lines', name='Prédiction future (yhat)', line=dict(color='blue')
        ))

        fig.add_trace(go.Scatter(
            x=future_forecast['ds'], y=future_forecast['yhat_upper'],
            mode='lines', name='Upper (futur)', line=dict(color='lightblue'), showlegend=False
        ))

        fig.add_trace(go.Scatter(
            x=future_forecast['ds'], y=future_forecast['yhat_lower'],
            mode='lines', fill='tonexty', line=dict(color='lightblue'), name='Intervalle de confiance (futur)'
        ))

        fig.update_layout(
            title=f"Prédictions Prophet DÉDIÉES - Projet {project_id_input} (30 jours FUTURS uniquement)",
            xaxis_title='Date',
            yaxis_title='Résultat Net Prévu',
            template='plotly_white'
        )

        os.makedirs('public/predictions', exist_ok=True)
        output_file = f"public/predictions/prediction_project_{project_id_input}.html"
        pyo.plot(fig, filename=output_file, auto_open=False)

        print(f"Graphique interactif généré dans : {output_file}")

    except Exception as e:
        print(f"Erreur : {e}")

    finally:
        client.close()

if __name__ == "__main__":
    main()
