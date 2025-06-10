import os
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import psycopg2
import joblib

os.makedirs('model', exist_ok=True)

dsn = os.getenv("DATABASE_URL_MAIN")
if not dsn:
    raise RuntimeError("DATABASE_URL chưa được thiết lập")
conn = psycopg2.connect(dsn)
cur = conn.cursor()

cur.execute("""
    SELECT 
        cp.id,
        COALESCE(rp.points, 0) AS rewardPoints,
        (SELECT COUNT(*) FROM "Booking" b WHERE b."customerId" = cp.id) AS totalBookings,
        EXISTS(SELECT 1 FROM "RecurringBooking" r WHERE r."customerId" = cp.id) AS hasRecurring,
        (SELECT json_agg(message) 
         FROM "ChatMessage" 
         WHERE "customerId" = cp.id AND sender = 'user') AS chatKeywords,
        (SELECT "packageId"
         FROM "PackageRecommendation"
         WHERE "customerId" = cp.id
         LIMIT 1) AS label
    FROM "CustomerProfile" cp
    LEFT JOIN "RewardPoint" rp ON rp."customerId" = cp.id;
""")

rows = []
for cid, pts, cnt, rec, msgs, lbl in cur.fetchall():
    if lbl is None:
        continue
    rows.append({
        'rewardPoints': pts,
        'totalBookings': cnt,
        'hasRecurring': int(rec),
        'chatKeywords': [m.lower() for m in (msgs or [])],
        'label': lbl
    })

cur.close()
conn.close()

df = pd.DataFrame(rows)

vc = df['label'].value_counts()
remove = vc[vc < 2].index.tolist()
if remove:
    print("⚠️ Bỏ các label ít mẫu:", remove)
df = df[df['label'].isin(vc[vc >= 2].index)]

mlb = MultiLabelBinarizer()
Xk = mlb.fit_transform(df['chatKeywords'])
X = pd.concat([
    df[['rewardPoints','totalBookings','hasRecurring']].reset_index(drop=True),
    pd.DataFrame(Xk, columns=mlb.classes_)
], axis=1)
y = df['label']

n_samples = len(y)
n_classes = y.nunique()
default_frac = 0.2
min_frac = n_classes / n_samples
test_frac = max(default_frac, min_frac)

print(f"Total samples: {n_samples}, classes: {n_classes}")
print(f"Using test_size = {test_frac:.3f} ({int(test_frac*n_samples)} samples)")

try:
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=test_frac,
        random_state=42,
        stratify=y
    )
except ValueError as e:
    print("⚠️ Stratified split failed:", e)
    print("→ Fallback sang random split (no stratify)")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=test_frac,
        random_state=42,
        stratify=None
    )

clf = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
clf.fit(X_train, y_train)

y_pred = clf.predict(X_test)
print("✅ Accuracy:", accuracy_score(y_test, y_pred))
print("📊 Classification Report:\n", classification_report(y_test, y_pred, zero_division=0))

cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(10, 6))
sns.heatmap(cm, annot=True, fmt='d', xticklabels=clf.classes_, yticklabels=clf.classes_)
plt.xlabel("Predicted")
plt.ylabel("True")
plt.title("Confusion Matrix")
plt.tight_layout()
plt.savefig("model/confusion_matrix.png")

joblib.dump(clf, 'model/recommendation_model.pkl')
joblib.dump(mlb, 'model/keyword_vectorizer.pkl')
print("✅ Models saved under ./model/")
