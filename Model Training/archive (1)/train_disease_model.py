"""
Disease Prediction from Symptoms - Model Training Script
-----------------------------------------------------------
Dataset: Kaggle "Disease Prediction Using Machine Learning" (kaushil268)
Files expected in the same folder as this script:
    Training.csv
    Testing.csv

Trains Naive Bayes, Decision Tree, Random Forest, and XGBoost,
compares their accuracy, and saves the best model to disk.

Run:
    pip install pandas scikit-learn xgboost joblib
    python train_disease_model.py
"""

import pandas as pd
import numpy as np
import joblib
import time

from sklearn.naive_bayes import GaussianNB
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import LabelEncoder

try:
    from xgboost import XGBClassifier
    HAS_XGB = True
except ImportError:
    HAS_XGB = False
    print("xgboost not installed (pip install xgboost) - skipping XGBoost model.\n")


# ---------------------------------------------------------
# 1. Load data
# ---------------------------------------------------------
print("Loading data...")
train_df = pd.read_csv("Training.csv")
test_df = pd.read_csv("Testing.csv")

# The Kaggle CSV sometimes has a stray unnamed empty column at the end - drop it if present
train_df = train_df.loc[:, ~train_df.columns.str.contains("^Unnamed")]
test_df = test_df.loc[:, ~test_df.columns.str.contains("^Unnamed")]

X_train = train_df.drop("prognosis", axis=1)
y_train_raw = train_df["prognosis"]

X_test = test_df.drop("prognosis", axis=1)
y_test_raw = test_df["prognosis"]

# Encode disease names into numbers (needed for XGBoost, harmless for the others)
le = LabelEncoder()
y_train = le.fit_transform(y_train_raw)
y_test = le.transform(y_test_raw)

print(f"Training rows: {len(X_train)}  |  Test rows: {len(X_test)}")
print(f"Number of symptoms (features): {X_train.shape[1]}")
print(f"Number of diseases (classes): {len(le.classes_)}\n")


# ---------------------------------------------------------
# 2. Define models to compare
# ---------------------------------------------------------
models = {
    "Naive Bayes": GaussianNB(),
    "Decision Tree": DecisionTreeClassifier(random_state=42),
    "Random Forest": RandomForestClassifier(
        n_estimators=200,
        random_state=42,
        n_jobs=-1
    ),
}

if HAS_XGB:
    models["XGBoost"] = XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        eval_metric="mlogloss",
        random_state=42,
        n_jobs=-1
    )


# ---------------------------------------------------------
# 3. Train + evaluate each model
# ---------------------------------------------------------
results = {}

print("Training models...\n" + "-" * 40)
for name, model in models.items():
    start = time.time()
    model.fit(X_train, y_train)
    elapsed = time.time() - start

    preds = model.predict(X_test)
    acc = accuracy_score(y_test, preds)

    results[name] = {"model": model, "accuracy": acc, "time": elapsed}
    print(f"{name:15s} | Accuracy: {acc*100:.2f}% | Train time: {elapsed:.2f}s")

print("-" * 40)


# ---------------------------------------------------------
# 4. Pick the best model
# ---------------------------------------------------------
best_name = max(results, key=lambda k: results[k]["accuracy"])
best_model = results[best_name]["model"]
best_acc = results[best_name]["accuracy"]

print(f"\nBest model: {best_name} ({best_acc*100:.2f}% accuracy)\n")

# Detailed report for the best model
preds = best_model.predict(X_test)
print("Classification report for the best model:")
print(classification_report(y_test, preds, target_names=le.classes_, zero_division=0))


# ---------------------------------------------------------
# 5. Save the best model + label encoder + column order
# ---------------------------------------------------------
joblib.dump(best_model, "best_disease_model.pkl")
joblib.dump(le, "label_encoder.pkl")
joblib.dump(list(X_train.columns), "symptom_columns.pkl")

print("Saved: best_disease_model.pkl, label_encoder.pkl, symptom_columns.pkl")


# ---------------------------------------------------------
# 6. Example: how to predict on new symptoms later
# ---------------------------------------------------------
def predict_disease(symptom_list, model=best_model, columns=list(X_train.columns), encoder=le):
    input_vector = pd.DataFrame([np.zeros(len(columns))], columns=columns)
    for symptom in symptom_list:
        if symptom in input_vector.columns:
            input_vector[symptom] = 1
        else:
            print(f"Warning: '{symptom}' not a known symptom column, ignoring.")

    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(input_vector)[0]
        top3_idx = np.argsort(probs)[::-1][:3]
        return [(encoder.classes_[i], round(probs[i] * 100, 2)) for i in top3_idx]
    else:
        pred = model.predict(input_vector)[0]
        return [(encoder.classes_[pred], None)]


if __name__ == "__main__":
    print("\nExample prediction:")
    example_symptoms = ["high_fever", "headache", "nausea", "fatigue"]
    print(f"Symptoms: {example_symptoms}")
    print("Top 3 predictions:", predict_disease(example_symptoms))
