import pandas as pd
import pickle
import numpy as np

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report
)

from sklearn.neighbors import NearestNeighbors

# Load trained model
model = pickle.load(open("model.pkl", "rb"))

vectorizer = pickle.load(
    open("vectorizer.pkl", "rb")
)

# Load dataset
df = pd.read_csv("dataset/reviews.csv")

# Use smaller sample
df = df.sample(3000, random_state=42)

# Review text
reviews = df['text_'].astype(str)

# Actual labels
# CG = fake (1)
# OR = genuine (0)

actual_labels = df['label'].apply(
    lambda x: 1 if x == 'CG' else 0
)

# TF-IDF transform
tfidf_matrix = vectorizer.transform(reviews)

# Similarity calculation
nn = NearestNeighbors(
    n_neighbors=5,
    metric='cosine'
)

nn.fit(tfidf_matrix)

distances, indices = nn.kneighbors(
    tfidf_matrix
)

similarity_scores = (
    1 - distances.mean(axis=1)
)

# Feature Engineering
df['review_length'] = reviews.apply(len)

df['similarity_score'] = similarity_scores

features = df[
    ['review_length', 'similarity_score']
]

# Predict
predictions = model.predict(features)

# Convert:
# -1 → fake (1)
#  1 → genuine (0)

predicted_labels = np.where(
    predictions == -1,
    1,
    0
)

# Metrics
accuracy = accuracy_score(
    actual_labels,
    predicted_labels
)

precision = precision_score(
    actual_labels,
    predicted_labels
)

recall = recall_score(
    actual_labels,
    predicted_labels
)

f1 = f1_score(
    actual_labels,
    predicted_labels
)

# Print Results
print("\n===== MODEL EVALUATION =====\n")

print(f"Accuracy  : {accuracy:.2f}")

print(f"Precision : {precision:.2f}")

print(f"Recall    : {recall:.2f}")

print(f"F1 Score  : {f1:.2f}")

print("\n===== CLASSIFICATION REPORT =====\n")

print(
    classification_report(
        actual_labels,
        predicted_labels
    )
)