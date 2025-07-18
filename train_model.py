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

# Load env and connect
dsn = os.getenv("DATABASE_URL_MAIN")
if not dsn:
    raise RuntimeError("DATABASE_URL_MAIN chưa được thiết lập")
conn = psycopg2.connect(dsn)
cur = conn.cursor()

# Truy vấn chính xác theo schema Prisma
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
         ORDER BY "recommendedAt" DESC
         LIMIT 1) AS packageId
    FROM "CustomerProfile" cp
    LEFT JOIN "RewardPoint" rp ON rp."customerId" = cp.id;
""")

# Tạo dữ liệu huấn luyện
rows = []
for cid, pts, cnt, rec, msgs, pkg_id in cur.fetchall():
    if pkg_id is None:
        continue  # bỏ khách chưa có package recommendation
    keywords = []
    if msgs:
        keywords = [str(m).lower() for m in msgs if isinstance(m, str)]
    rows.append({
        'rewardPoints': pts,
        'totalBookings': cnt,
        'hasRecurring': int(rec),
        'chatKeywords': keywords,
        'label': pkg_id
    })

cur.close()
conn.close()

df = pd.DataFrame(rows)

# Nếu không có dữ liệu để train thì bỏ qua, không raise
if df.empty:
    print("⚠️ Không có dữ liệu đủ điều kiện để huấn luyện model. Bỏ qua...")
    exit(0)

vc = df['label'].value_counts()
remove = vc[vc < 2].index.tolist()
if remove:
    print("⚠️ Bỏ các label ít mẫu:", remove)
df = df[df['label'].isin(vc[vc >= 2].index)]

# Nếu sau khi lọc mà vẫn trống thì cũng dừng nhẹ nhàng
if df.empty:
    print("⚠️ Không còn dữ liệu sau khi lọc các label ít xuất hiện. Bỏ qua...")
    exit(0)

# Chuẩn hóa dữ liệu
mlb = MultiLabelBinarizer()
Xk = mlb.fit_transform(df['chatKeywords'])
X = pd.concat([
    df[['rewardPoints', 'totalBookings', 'hasRecurring']].reset_index(drop=True),
    pd.DataFrame(Xk, columns=mlb.classes_)
], axis=1)
y = df['label']

# Chia tập train/test
n_samples = len(y)
n_classes = y.nunique()
default_frac = 0.2
min_frac = n_classes / n_samples
test_frac = max(default_frac, min_frac)

print(f"Total samples: {n_samples}, classes: {n_classes}")
print(f"Using test_size = {test_frac:.3f} ({int(test_frac*n_samples)} samples)")

try:
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_frac, random_state=42, stratify=y
    )
except ValueError as e:
    print("⚠️ Stratified split failed:", e)
    print("→ Fallback sang random split (no stratify)")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_frac, random_state=42, stratify=None
    )

# Train mô hình
clf = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
clf.fit(X_train, y_train)

# Đánh giá
y_pred = clf.predict(X_test)
print("✅ Accuracy:", accuracy_score(y_test, y_pred))
print("📊 Classification Report:\n", classification_report(y_test, y_pred, zero_division=0))

# Confusion matrix
cm = confusion_matrix(y_test, y_pred, labels=clf.classes_)
plt.figure(figsize=(10, 6))
sns.heatmap(cm, annot=True, fmt='d', xticklabels=clf.classes_, yticklabels=clf.classes_)
plt.xlabel("Predicted")
plt.ylabel("True")
plt.title("Confusion Matrix")
plt.tight_layout()
plt.savefig("model/confusion_matrix.png")

# Save model
joblib.dump(clf, 'model/recommendation_model.pkl')
joblib.dump(mlb, 'model/keyword_vectorizer.pkl')
print("✅ Models saved under ./model/")
