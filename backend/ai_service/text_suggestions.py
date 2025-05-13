from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import re
from collections import defaultdict
import json
import os

app = FastAPI()

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextRequest(BaseModel):
    text: str

# Dictionnaire de suggestions basé sur des patterns courants
SUGGESTION_PATTERNS = {
    # Patterns généraux
    r'^he': ['hello', 'help', 'hey', 'here'],
    r'^th': ['thank you', 'thanks', 'that', 'this'],
    r'^go': ['good', 'going', 'goodbye', 'got it'],
    r'^hi': ['hi', 'hello', 'how are you'],
    r'^ho': ['how are you', 'how is it going', 'hope you\'re well'],
    r'^we': ['welcome', 'well done', 'we can help'],
    r'^ca': ['can you help', 'can we talk', 'can you explain'],
    r'^pl': ['please', 'please help', 'please explain'],
    r'^ne': ['need help', 'need assistance', 'need to know'],
    
    # Patterns financiers
    r'^ba': ['balance', 'bank statement', 'bank account', 'banking'],
    r'^tr': ['transaction', 'transfer', 'transaction history', 'transaction details'],
    r'^ta': ['tax', 'taxes', 'tax return', 'tax statement', 'tax payment'],
    r'^wa': ['wallet', 'wallet balance', 'wallet transaction', 'wallet statement'],
    r'^st': ['statement', 'statements', 'statement of account', 'statement period'],
    r'^pa': ['payment', 'payments', 'payment history', 'payment status'],
    r'^in': ['invoice', 'invoices', 'invoice details', 'invoice payment'],
    r'^re': ['receipt', 'receipts', 'recent transactions', 'recent payments'],
    r'^de': ['deposit', 'deposits', 'deposit history', 'deposit status'],
    r'^wi': ['withdrawal', 'withdrawals', 'withdrawal history', 'withdrawal status'],
    r'^fi': ['finance', 'financial', 'financial statement', 'financial report'],
    r'^ac': ['account', 'accounts', 'account balance', 'account statement'],
    r'^cr': ['credit', 'credits', 'credit card', 'credit limit'],
    r'^de': ['debit', 'debits', 'debit card', 'debit transaction'],
    r'^sa': ['savings', 'savings account', 'savings balance'],
    r'^ch': ['check', 'checking', 'checking account', 'check balance'],
    r'^in': ['interest', 'interest rate', 'interest payment'],
    r'^lo': ['loan', 'loans', 'loan payment', 'loan status'],
    r'^bi': ['bill', 'bills', 'bill payment', 'bill history'],
    r'^re': ['refund', 'refunds', 'refund status', 'refund history'],
    r'^ex': ['expense', 'expenses', 'expense report', 'expense history'],
    r'^in': ['income', 'incomes', 'income statement', 'income history'],
    r'^bu': ['budget', 'budgets', 'budget report', 'budget status'],
    r'^in': ['investment', 'investments', 'investment portfolio', 'investment status'],
    r'^re': ['report', 'reports', 'report period', 'report status'],
    r'^st': ['statement', 'statements', 'statement period', 'statement status'],
    r'^su': ['summary', 'summaries', 'summary report', 'summary status'],
    r'^de': ['details', 'detailed', 'detailed report', 'detailed statement'],
    r'^hi': ['history', 'historical', 'historical data', 'historical report'],
    r'^mo': ['monthly', 'monthly report', 'monthly statement', 'monthly summary'],
    r'^ye': ['yearly', 'yearly report', 'yearly statement', 'yearly summary'],
    r'^qu': ['quarterly', 'quarterly report', 'quarterly statement', 'quarterly summary'],
    r'^da': ['daily', 'daily report', 'daily statement', 'daily summary'],
    r'^we': ['weekly', 'weekly report', 'weekly statement', 'weekly summary'],
}

# Phrases génériques pour les suggestions
GENERIC_SUGGESTIONS = [
    # Suggestions générales
    "How can I help you?",
    "I need assistance",
    "Can you explain?",
    "Thank you for your help",
    
    # Suggestions financières
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
    "I need to verify my account status"
]

def generate_suggestions(text: str) -> list:
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
        suggestions = set(GENERIC_SUGGESTIONS)

    # Limiter à 3 suggestions
    return list(suggestions)[:3]

@app.post("/suggest")
async def suggest(request: TextRequest):
    """
    Endpoint pour générer des suggestions de texte.
    """
    if not request.text or len(request.text) < 2:
        return {"suggestions": []}
    
    suggestions = generate_suggestions(request.text)
    return {"suggestions": suggestions}

@app.get("/health")
async def health_check():
    """
    Endpoint pour vérifier que le service fonctionne.
    """
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5001) 