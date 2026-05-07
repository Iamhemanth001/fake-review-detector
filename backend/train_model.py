import pandas as pd
import pickle
import numpy as np

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import NearestNeighbors

# Load dataset
df = pd.read_csv("dataset/reviews.csv")

# Use smaller subset for faster training
df = df.sample(5000, random_state=42)

# Review text column
reviews = df['text_'].astype(str)

# NLP: TF-IDF
vectorizer = TfidfVectorizer(
    stop_words='english',
    max_features=500
)

tfidf_matrix = vectorizer.fit_transform(reviews)

# Nearest Neighbor similarity
nn = NearestNeighbors(
    n_neighbors=5,
    metric='cosine'
)

nn.fit(tfidf_matrix)

distances, indices = nn.kneighbors(tfidf_matrix)

# Similarity score
similarity_scores = 1 - distances.mean(axis=1)

# Feature Engineering
df['review_length'] = reviews.apply(len)

df['similarity_score'] = similarity_scores

features = df[
    ['review_length', 'similarity_score']
]

# Isolation Forest
model = IsolationForest(
    contamination=0.08,
    random_state=42
)

# Train model
model.fit(features)

# Save model
pickle.dump(
    model,
    open("model.pkl", "wb")
)

pickle.dump(
    vectorizer,
    open("vectorizer.pkl", "wb")
)

print("✅ Model trained successfully!")