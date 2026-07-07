"""DukaLink retailer churn: baseline model (provided).

Run this as-is. The modeling is not the exercise; the interpretation is.
In Colab, run `!pip -q install shap` first.
Expected runtime: under two minutes on the workshop dataset.
"""
import pandas as pd
import shap
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split

RANDOM_STATE = 42
TARGET = "churned"
FEATURES = [
    "months_active", "avg_monthly_orders", "avg_order_value_kes",
    "support_tickets_6m", "late_deliveries_6m", "pct_credit_orders",
    "business_type", "county",
]

df = pd.read_csv("dukalink_customers.csv").drop_duplicates(subset="customer_id")

X = df[FEATURES].copy()
X["avg_order_value_kes"] = X["avg_order_value_kes"].fillna(
    X["avg_order_value_kes"].median())
X["business_type"] = X["business_type"].fillna("Unknown")
X = pd.get_dummies(X, columns=["business_type", "county"])
y = df[TARGET]

X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=0.25, stratify=y, random_state=RANDOM_STATE)
model = RandomForestClassifier(
    n_estimators=200, random_state=RANDOM_STATE).fit(X_tr, y_tr)
pred = model.predict(X_te)

print("Class balance:", y.value_counts(normalize=True).round(2).to_dict())
print("Confusion matrix (rows actual, cols predicted):")
print(confusion_matrix(y_te, pred))
print(classification_report(y_te, pred, target_names=["retained", "churned"]))

explainer = shap.TreeExplainer(model)
sv = explainer.shap_values(X_te)
sv_churn = sv[1] if isinstance(sv, list) else sv[:, :, 1]
shap.summary_plot(sv_churn, X_te, max_display=10)
