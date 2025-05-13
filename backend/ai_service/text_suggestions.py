from flask import Flask, request, jsonify
from flask_cors import CORS
import re
from collections import defaultdict
import json
import os
from tax_forecast_model import TaxForecastModel

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://192.168.100.111:3000", "http://localhost:5173"]}})

# Initialiser le modèle de prédiction des taxes
tax_model = TaxForecastModel()

# Dictionnaire de suggestions basé sur des patterns courants
SUGGESTION_PATTERNS = {
    # Patterns généraux
    r'^he': ['hello', 'help', 'hey', 'here', 'help me', 'help please', 'help needed'],
    r'^th': ['thank you', 'thanks', 'that', 'this', 'thank you very much', 'thanks a lot'],
    r'^go': ['good', 'going', 'goodbye', 'got it', 'good morning', 'good afternoon', 'good evening'],
    r'^hi': ['hi', 'hello', 'how are you', 'hi there', 'hi how are you', 'hi can you help'],
    r'^ho': ['how are you', 'how is it going', 'hope you\'re well', 'how can I help', 'how do I'],
    r'^we': ['welcome', 'well done', 'we can help', 'we are here to help', 'we can assist you'],
    r'^ca': ['can you help', 'can we talk', 'can you explain', 'can I get', 'can you show me'],
    r'^pl': ['please', 'please help', 'please explain', 'please show me', 'please assist'],
    r'^ne': ['need help', 'need assistance', 'need to know', 'need information', 'need support'],
    
    # Patterns financiers avancés
    r'^ba': ['balance', 'bank statement', 'bank account', 'banking', 'balance check', 'balance inquiry', 'balance transfer'],
    r'^tr': ['transaction', 'transfer', 'transaction history', 'transaction details', 'transfer money', 'transfer funds', 'transaction status'],
    r'^ta': ['tax', 'taxes', 'tax return', 'tax statement', 'tax payment', 'tax calculation', 'tax information'],
    r'^wa': ['wallet', 'wallet balance', 'wallet transaction', 'wallet statement', 'wallet history', 'wallet details', 'wallet status'],
    r'^st': ['statement', 'statements', 'statement of account', 'statement period', 'statement download', 'statement history'],
    r'^pa': ['payment', 'payments', 'payment history', 'payment status', 'payment confirmation', 'payment receipt', 'payment details'],
    r'^in': ['invoice', 'invoices', 'invoice details', 'invoice payment', 'invoice history', 'invoice status', 'invoice download'],
    r'^re': ['receipt', 'receipts', 'recent transactions', 'recent payments', 'receipt download', 'receipt history', 'receipt details'],
    r'^de': ['deposit', 'deposits', 'deposit history', 'deposit status', 'deposit confirmation', 'deposit details', 'deposit receipt'],
    r'^wi': ['withdrawal', 'withdrawals', 'withdrawal history', 'withdrawal status', 'withdrawal confirmation', 'withdrawal details'],
    r'^fi': ['finance', 'financial', 'financial statement', 'financial report', 'financial summary', 'financial details', 'financial history'],
    r'^ac': ['account', 'accounts', 'account balance', 'account statement', 'account details', 'account history', 'account summary'],
    r'^cr': ['credit', 'credits', 'credit card', 'credit limit', 'credit history', 'credit score', 'credit report'],
    r'^de': ['debit', 'debits', 'debit card', 'debit transaction', 'debit history', 'debit details', 'debit summary'],
    r'^sa': ['savings', 'savings account', 'savings balance', 'savings history', 'savings details', 'savings summary'],
    r'^ch': ['check', 'checking', 'checking account', 'check balance', 'check history', 'check details', 'check status'],
    r'^in': ['interest', 'interest rate', 'interest payment', 'interest calculation', 'interest history', 'interest details'],
    r'^lo': ['loan', 'loans', 'loan payment', 'loan status', 'loan history', 'loan details', 'loan summary'],
    r'^bi': ['bill', 'bills', 'bill payment', 'bill history', 'bill details', 'bill status', 'bill summary'],
    r'^re': ['refund', 'refunds', 'refund status', 'refund history', 'refund details', 'refund summary', 'refund confirmation'],
    r'^ex': ['expense', 'expenses', 'expense report', 'expense history', 'expense details', 'expense summary', 'expense tracking'],
    r'^in': ['income', 'incomes', 'income statement', 'income history', 'income details', 'income summary', 'income tracking'],
    r'^bu': ['budget', 'budgets', 'budget report', 'budget status', 'budget history', 'budget details', 'budget summary'],
    r'^in': ['investment', 'investments', 'investment portfolio', 'investment status', 'investment history', 'investment details'],
    r'^re': ['report', 'reports', 'report period', 'report status', 'report history', 'report details', 'report download'],
    r'^st': ['statement', 'statements', 'statement period', 'statement status', 'statement history', 'statement details'],
    r'^su': ['summary', 'summaries', 'summary report', 'summary status', 'summary history', 'summary details', 'summary download'],
    r'^de': ['details', 'detailed', 'detailed report', 'detailed statement', 'detailed history', 'detailed summary'],
    r'^hi': ['history', 'historical', 'historical data', 'historical report', 'historical statement', 'historical summary'],
    r'^mo': ['monthly', 'monthly report', 'monthly statement', 'monthly summary', 'monthly history', 'monthly details'],
    r'^ye': ['yearly', 'yearly report', 'yearly statement', 'yearly summary', 'yearly history', 'yearly details'],
    r'^qu': ['quarterly', 'quarterly report', 'quarterly statement', 'quarterly summary', 'quarterly history', 'quarterly details'],
    r'^da': ['daily', 'daily report', 'daily statement', 'daily summary', 'daily history', 'daily details'],
    r'^we': ['weekly', 'weekly report', 'weekly statement', 'weekly summary', 'weekly history', 'weekly details'],
}

# Phrases génériques pour les suggestions
GENERIC_SUGGESTIONS = [
    # Suggestions générales
    "How can I help you?",
    "I need assistance",
    "Can you explain?",
    "Thank you for your help",
    "I have a question",
    "I need more information",
    "Can you guide me?",
    "I'm looking for help",
    "I need support",
    "Can you assist me?",
    
    # Suggestions financières avancées
    "I need to check my balance",
    "Show me my recent transactions",
    "I want to make a payment",
    "Where can I find my tax statement?",
    "How do I check my wallet balance?",
    "I need to view my financial statement",
    "Can you show me my transaction history?",
    "I want to see my payment status",
    "How do I download my bank statement?",
    "I need to verify my last transaction",
    "Show me my account summary",
    "I want to check my investment status",
    "How do I view my monthly report?",
    "I need to track my expenses",
    "Can you show me my income statement?",
    "I want to check my budget status",
    "How do I access my financial reports?",
    "I need to verify my payment history",
    "Show me my transaction details",
    "I want to check my account activity",
    "How do I view my financial summary?",
    "I need to see my recent payments",
    "Can you show me my balance history?",
    "I want to check my statement period",
    "How do I access my financial records?",
    "I need to verify my account status",
    "Show me my investment portfolio",
    "I want to check my credit score",
    "How do I view my loan status?",
    "I need to see my savings details",
    "Can you show me my expense report?",
    "I want to check my income details",
    "How do I access my budget report?",
    "I need to verify my investment returns",
    "Show me my financial analytics",
    "I want to check my payment schedule",
    "How do I view my transaction analytics?",
    "I need to see my financial trends",
    "Can you show me my account insights?",
    "I want to check my financial health",
    "How do I access my financial dashboard?",
    "I need to verify my financial goals",
    "Show me my financial performance",
    "I want to check my financial metrics",
    "How do I view my financial indicators?",
    "I need to see my financial statistics",
    "Can you show me my financial analysis?",
    "I want to check my financial position",
    "How do I access my financial overview?",
    "I need to verify my financial standing",
    "Show me my financial assessment"
]

def generate_suggestions(text):
    """
    Génère des suggestions de texte basées sur l'entrée utilisateur.
    """
    if not text or len(text) < 2:
        return []

    text = text.lower()
    suggestions = set()

    # Vérifier les patterns
    for pattern, pattern_suggestions in SUGGESTION_PATTERNS.items():
        if re.match(pattern, text):
            # Ajouter les suggestions qui commencent par le texte actuel
            for suggestion in pattern_suggestions:
                if suggestion.startswith(text):
                    suggestions.add(suggestion)
                else:
                    # Ajouter le texte actuel + la suggestion
                    suggestions.add(text + suggestion[len(text):])

    # Si aucune suggestion n'est trouvée, utiliser les suggestions génériques
    if not suggestions:
        # Filtrer les suggestions génériques basées sur le contexte
        context_suggestions = [s for s in GENERIC_SUGGESTIONS if text.lower() in s.lower()]
        if context_suggestions:
            suggestions = set(context_suggestions)
        else:
            suggestions = set(GENERIC_SUGGESTIONS)

    # Limiter à 5 suggestions pour plus de pertinence
    return list(suggestions)[:5]

@app.route('/suggest', methods=['POST'])
def suggest():
    """
    Endpoint pour générer des suggestions de texte.
    """
    data = request.get_json()
    if not data or 'text' not in data or not data['text'] or len(data['text']) < 2:
        return jsonify({"suggestions": []})
    
    suggestions = generate_suggestions(data['text'])
    return jsonify({"suggestions": suggestions})

@app.route('/health', methods=['GET'])
def health_check():
    """
    Endpoint pour vérifier que le service fonctionne.
    """
    return jsonify({"status": "healthy"})

@app.route('/forecast-taxes', methods=['POST'])
def forecast_taxes():
    """
    Endpoint pour prédire les taxes futures basé sur les données historiques.
    """
    try:
        data = request.get_json()
        if not data or 'historical_data' not in data or 'current_data' not in data:
            return jsonify({"error": "Données manquantes"}), 400

        historical_data = data['historical_data']
        current_data = data['current_data']

        # Entraîner le modèle avec les données historiques
        tax_model.train(historical_data)

        # Faire des prédictions pour les données actuelles
        predictions = tax_model.predict(current_data)

        return jsonify(predictions)

    except Exception as e:
        print("Erreur lors de la prédiction:", str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True) 