import os
from flask import Flask, request, jsonify
from flask_cors import CORS

import pandas as pd
import pickle
import numpy as np

from sklearn.neighbors import NearestNeighbors

app = Flask(__name__)
CORS(app)

# Load trained model
model = pickle.load(open("model.pkl", "rb"))

vectorizer = pickle.load(
    open("vectorizer.pkl", "rb")
)

@app.route('/analyze', methods=['POST'])
def analyze_reviews():

    file = request.files['file']

    df = pd.read_csv(file)

    reviews = df['review'].astype(str)

    # TF-IDF transform
    tfidf_matrix = vectorizer.transform(reviews)

    # Similarity
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

    # Features
    df['review_length'] = reviews.apply(len)

    df['similarity_score'] = similarity_scores

    features = df[
        ['review_length', 'similarity_score']
    ]

    # Predict
    predictions = model.predict(features)

    scores = model.decision_function(features)

    results = []

    for i, row in df.iterrows():

        confidence = abs(scores[i]) * 100

        results.append({

            "review": row['review'],

            "similarity_score":
                float(row['similarity_score']),

            "suspicious":
                True if predictions[i] == -1
                else False,

            "confidence":
                round(confidence, 2)
        })

    return jsonify(results)


# if __name__ == "__main__":
#     port = int(os.environ.get("PORT", 5000))
#     app.run(host="0.0.0.0", port=port)
