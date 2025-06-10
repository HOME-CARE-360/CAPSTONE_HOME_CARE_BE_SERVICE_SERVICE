import sys
import json
import joblib
import numpy as np

clf = joblib.load('model/recommendation_model.pkl')
mlb = joblib.load('model/keyword_vectorizer.pkl')

input = json.loads(sys.argv[1])

X_keywords = mlb.transform([input['chatKeywords']])
X = np.concatenate([
    [[input['rewardPoints'], input['totalBookings'], int(input['hasRecurring'])]],
    X_keywords
], axis=1)

probas = clf.predict_proba(X)[0]

top_n = 3
top_indices = np.argsort(probas)[::-1][:top_n]
top_labels = [int(clf.classes_[i]) for i in top_indices]

print(json.dumps(top_labels))
