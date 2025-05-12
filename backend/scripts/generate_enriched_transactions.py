import sys
import pymongo
import pandas as pd
import plotly.graph_objects as go
from bson import ObjectId
from prophet import Prophet
import plotly.offline as pyo

# ✅ Correction Unicode Windows
sys.stdout.reconfigure(encoding='utf-8')

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
    df_daily = df.groupby('date').agg({'revenue': 'sum', 'expense': 'sum', 'tax': 'sum'}).reset_index()
    df_daily['net_result'] = df_daily['revenue'] - df_daily['expense'] - df_daily['tax']
    df_prophet = df_daily[['date', 'net_result']].rename(columns={'date': 'ds', 'net_result': 'y'})
    return df_prophet

def train_and_predict_for_project(project_id, periods=30):
    df = prepare_project_data(project_id)
    model = Prophet(daily_seasonality=True, yearly_seasonality=True)
    model.fit(df)
    future = model.make_future_dataframe(periods=periods)
    forecast = model.predict(future)
    forecast_future = forecast.tail(periods)
    return forecast_future

def main():
    try:
        if len(sys.argv) != 2:
            print("❌ Erreur : Merci de fournir l'ID du projet comme argument.")
            sys.exit(1)

        project_id_input = sys.argv[1]
        forecast_future = train_and_predict_for_project(project_id_input)

        min_row = forecast_future.loc[forecast_future['yhat'].idxmin()]
        max_row = forecast_future.loc[forecast_future['yhat'].idxmax()]
        total_value = round(forecast_future['yhat'].sum(), 2)
        mean_value = round(forecast_future['yhat'].mean(), 2)

        min_date = min_row['ds'].strftime('%d %b %Y')
        min_value = round(min_row['yhat'], 2)
        max_date = max_row['ds'].strftime('%d %b %Y')
        max_value = round(max_row['yhat'], 2)

        fig = go.Figure()

        fig.add_trace(go.Scatter(
            x=forecast_future['ds'], y=forecast_future['yhat'],
            mode='lines', name='Prédiction future (yhat)', line=dict(color='blue')
        ))

        fig.add_trace(go.Scatter(
            x=forecast_future['ds'], y=forecast_future['yhat_upper'],
            mode='lines', line=dict(color='lightblue'), showlegend=False
        ))

        fig.add_trace(go.Scatter(
            x=forecast_future['ds'], y=forecast_future['yhat_lower'],
            mode='lines', fill='tonexty', line=dict(color='lightblue'), name='Intervalle de confiance (futur)'
        ))

        fig.update_layout(
            title=f"Prédictions Prophet DÉDIÉES - Projet {project_id_input} (30 jours FUTURS uniquement)",
            xaxis_title='Date',
            yaxis_title='Résultat Net Prévu',
            template='plotly_white',
            annotations=[
                dict(
                    x=1.15,
                    y=0.75,
                    xref='paper',
                    yref='paper',
                    text=f"<b>✅ Max</b><br>{max_date}<br><span style='font-size:18px'><b>{max_value}</b></span>",
                    showarrow=False,
                    font=dict(size=16, color='black'),
                    bgcolor='rgba(255, 255, 255, 0.95)',
                    bordercolor='red',
                    borderwidth=3,
                    borderpad=15
                ),
                dict(
                    x=1.15,
                    y=0.5,
                    xref='paper',
                    yref='paper',
                    text=f"<b>📉 Min</b><br>{min_date}<br><span style='font-size:18px'><b>{min_value}</b></span>",
                    showarrow=False,
                    font=dict(size=16, color='black'),
                    bgcolor='rgba(255, 255, 255, 0.95)',
                    bordercolor='gray',
                    borderwidth=3,
                    borderpad=15
                ),
                dict(
                    x=1.18,
                    y=0.25,
                    xref='paper',
                    yref='paper',
                    text=f"<b>📊 Total 30 jours</b><br><span style='font-size:18px'><b>{total_value}</b></span>",
                    showarrow=False,
                    font=dict(size=16, color='black'),
                    bgcolor='rgba(255, 255, 255, 0.95)',
                    bordercolor='green',
                    borderwidth=3,
                    borderpad=15
                ),
                dict(
                    x=1.20,
                    y=0.05,
                    xref='paper',
                    yref='paper',
                    text=f"<b>📈 Moyenne 30 jours</b><br><span style='font-size:18px'><b>{mean_value}</b></span>",
                    showarrow=False,
                    font=dict(size=16, color='black'),
                    bgcolor='rgba(255, 255, 255, 0.95)',
                    bordercolor='blue',
                    borderwidth=3,
                    borderpad=15
                )
            ]
        )

        output_file = f"public/predictions/prediction_project_{project_id_input}.html"
        pyo.plot(fig, filename=output_file, auto_open=False)
        print(f"✅ Graphique interactif généré dans : {output_file}")

    except Exception as e:
        print(f"❌ Erreur : {e}")

    finally:
        client.close()

if __name__ == "__main__":
    main()
