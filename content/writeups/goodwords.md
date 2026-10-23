# HTB GoodWords Challenges — Complete Writeup

## Overview

Both challenges are based on **Naive Bayes classifier poisoning**, also called a **GoodWords attack** or **Feature Obfuscation Attack**. The goal is to fool a text classifier by appending carefully chosen words to a message — without changing the original text — so the model flips its prediction label.

---

## How Naive Bayes Works (Why This Attack is Possible)

Multinomial Naive Bayes classifies text using this formula:

```
P(class | message) = P(class) × P(word1|class) × P(word2|class) × ...
```

Every word in the message contributes a probability score. The class with the highest combined score wins. This means:

- If you **append** words that are strongly associated with the opposite class, their probabilities multiply into the total score
- Enough strong words can **drown out** the original message's signal
- The model is blind to context — it just counts words

---

---

# Challenge 1: GoodWords (Basic)

## Target

- **URL:** `http://<instance>:31657`
- **Goal:** Take a spam SMS message and append words so the model predicts **ham**
- **Constraint:** Max 25 added words, append-only

## The Spam Message

```
England v Macedonia - dont miss the goals/team news. Txt ur national team to 87077 
eg ENGLAND to 87077 Try:WALES, SCOTLAND 4txt/ú1.20 POBOXox36504W45WQ 16+
```

Baseline spam probability: `0.9999999983` (essentially 100% spam)

## API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/health` | GET | Check instance is running |
| `/challenge` | GET | Get base message and constraints |
| `/predict` | POST | Test any text, get label + spam probability |
| `/submit` | POST | Submit augmented text, get flag if ham |

## Step-by-Step Solution

### Step 1 — Verify instance
```bash
curl -s "http://<instance>:31657/health"
```

### Step 2 — Get the challenge
```bash
curl -s "http://<instance>:31657/challenge" | jq
```

### Step 3 — Check baseline spam probability
```bash
curl -s -X POST "http://<instance>:31657/predict" \
  -H 'content-type: application/json' \
  -d '{"text": "England v Macedonia - dont miss the goals/team news. Txt ur national team to 87077 eg ENGLAND to 87077 Try:WALES, SCOTLAND 4txt/ú1.20 POBOXox36504W45WQ 16+"}'
```

### Step 4 — Test ham words (SMS slang works best)

The model was trained on the SMS Spam Collection dataset which contains many Singaporean/Malaysian casual texts. Words like `lor`, `lah`, `lol`, `dun`, `wan` are almost exclusively in ham messages.

```bash
curl -s -X POST "http://<instance>:31657/predict" \
  -H 'content-type: application/json' \
  -d '{"text": "England v Macedonia - dont miss the goals/team news. Txt ur national team to 87077 eg ENGLAND to 87077 Try:WALES, SCOTLAND 4txt/ú1.20 POBOXox36504W45WQ 16+ ok lor fine lol gt aight yep nah dun wan lar lor lei lah eh ya hmm omg hey yo bro sis darling honey"}'
```

Expected result: `{"label":"ham","spam_probability":9.871985206438859e-12}`

### Step 5 — Submit and get the flag
```bash
curl -s -X POST "http://<instance>:31657/submit" \
  -H 'content-type: application/json' \
  -d '{"augmented_text": "England v Macedonia - dont miss the goals/team news. Txt ur national team to 87077 eg ENGLAND to 87077 Try:WALES, SCOTLAND 4txt/ú1.20 POBOXox36504W45WQ 16+ ok lor fine lol gt aight yep nah dun wan lar lor lei lah eh ya hmm omg hey yo bro sis darling honey"}' | jq
```

## Flag

```
HTB{g00dw0rd5_15_1n73r3571ng}
```

## Understanding the Probability Output

| Output | Meaning | Result |
|---|---|---|
| `0.9999` | 99.99% spam | SPAM |
| `9.87e-12` | 0.0000000000098 ≈ 0% spam | HAM |
| `6.03e-07` | 0.0000006 ≈ 0% spam | HAM |

The `e-12` is scientific notation. Negative exponent = tiny number = HAM. The model threshold is 0.5 — below is ham, above is spam.

## Why SMS Slang Words Worked

Words like `lor`, `lah`, `dun`, `wan` appeared almost exclusively in the ham (legitimate) messages of the training dataset. Each one multiplied a very high `P(word|ham)` into the total score, overwhelming the spam signal from the original message.

---

---

# Challenge 2: Skills Assessment — Feature Obfuscation Attack

## Target

- **URL:** `http://<instance>:31038`
- **Goal:** Two phases — flip 10 positive movie reviews to negative (whitebox), then flip 10 negative reviews to positive (blackbox)
- **Constraints:** Max 30 words added (whitebox), max 40 words added (blackbox)

## API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/health` | GET | Check instance health |
| `/challenge/whitebox` | GET | Get 10 positive reviews + constraints |
| `/challenge/blackbox` | GET | Get 10 negative reviews + constraints |
| `/model/download` | GET | Download full model bundle (whitebox only) |
| `/predict` | POST | Query model — returns label + probabilities |
| `/submit/whitebox` | POST | Submit all 10 whitebox solutions |
| `/submit/blackbox` | POST | Submit all 10 blackbox solutions |
| `/status` | GET | Check progress (how many completed) |

---

## Phase 1: White-Box Attack

### What You Have
Full access to download the trained model pickle file and inspect its internal weights directly.

### Step 1 — Get whitebox reviews
```bash
export BASE_URL="http://<instance>:31038"
curl -s "$BASE_URL/challenge/whitebox" | jq
```

### Step 2 — Download the model
```bash
curl -s "$BASE_URL/model/download" -o model.pkl
```

### Step 3 — Install scikit-learn if needed
```bash
pip install scikit-learn --break-system-packages
```

### Step 4 — Inspect model weights to find top negative words

```python
import pickle, numpy as np

with open("model.pkl", "rb") as f:
    bundle = pickle.load(f)

clf = bundle['classifier']
feature_names = bundle['feature_names']

# feature_log_prob_[0] = negative class, [1] = positive class
neg_log_prob = clf.feature_log_prob_[0]
pos_log_prob = clf.feature_log_prob_[1]

# Score = how much more a word appears in negative vs positive
neg_scores = neg_log_prob - pos_log_prob
top_neg_idx = np.argsort(neg_scores)[::-1]

# Get top single words (no bigrams)
neg_words = []
for i in top_neg_idx:
    if ' ' not in feature_names[i]:
        neg_words.append(feature_names[i])
    if len(neg_words) >= 28:
        break

print(" ".join(neg_words))
```

Top negative words found: `boll uwe hobgoblins hackenstein manos btk shaq slater tashan kareena ...`

These are names/terms that appear almost exclusively in negative movie reviews in the training data.

### Step 5 — Build and submit all 10 solutions

```python
import pickle, numpy as np, requests, json

BASE_URL = "http://<instance>:31038"

with open("model.pkl", "rb") as f:
    bundle = pickle.load(f)

clf = bundle['classifier']
feature_names = bundle['feature_names']
neg_scores = clf.feature_log_prob_[0] - clf.feature_log_prob_[1]
top_neg_idx = np.argsort(neg_scores)[::-1]

neg_words = []
for i in top_neg_idx:
    if ' ' not in feature_names[i]:
        neg_words.append(feature_names[i])
    if len(neg_words) >= 28:
        break

neg_str = " ".join(neg_words)

ch = requests.get(f"{BASE_URL}/challenge/whitebox").json()
solutions = [{"id": r['id'], "augmented_text": r['text'] + " " + neg_str} for r in ch['reviews']]
result = requests.post(f"{BASE_URL}/submit/whitebox", json={"solutions": solutions}).json()
print(json.dumps(result, indent=2))
```

### Troubleshooting: Stubborn Reviews

One review (wb_8) was very long and positive, requiring repeated words to overcome its signal:

```python
neg_words = "worst worst worst horrible horrible awful awful terrible terrible boring waste avoid poor stupid ridiculous dreadful pathetic disappointing unwatchable atrocious uwe boll hobgoblins hackenstein manos btk shaq slater"
```

Repeating the same strong word multiple times multiplies its weight in the Naive Bayes calculation.

---

## Phase 2: Black-Box Attack

### What You Have
Only the `/predict` API — no model access. Must find effective words by querying the API and observing probability changes.

### Step 1 — Get blackbox reviews
```bash
curl -s "$BASE_URL/challenge/blackbox" | jq
```

### Step 2 — Try generic positive words first

```python
import requests, json

BASE_URL = "http://<instance>:31038"

pos_words = "excellent wonderful brilliant masterpiece outstanding superb fantastic amazing beautiful perfect loved enjoyed great best recommend must watch incredible inspiring delightful magnificent stunning"

ch = requests.get(f"{BASE_URL}/challenge/blackbox").json()
solutions = []
for r in ch['reviews']:
    aug = r['text'] + " " + pos_words
    test = requests.post(f"{BASE_URL}/predict", json={"text": aug}).json()
    print(f"{r['id']}: {test['label']} (pos_prob={test['positive_probability']:.4f})")
    solutions.append({"id": r['id'], "augmented_text": aug})

result = requests.post(f"{BASE_URL}/submit/blackbox", json={"solutions": solutions}).json()
print(json.dumps(result, indent=2))
```

This flips about 5/10 reviews immediately.

### Step 3 — For stubborn reviews, use model-informed words

Even in blackbox phase, you still have the downloaded model from Phase 1. Use it to find the top positive features:

```python
import pickle, numpy as np, requests, json

BASE_URL = "http://<instance>:31038"

with open("model.pkl", "rb") as f:
    bundle = pickle.load(f)

clf = bundle['classifier']
feature_names = bundle['feature_names']
pos_scores = clf.feature_log_prob_[1] - clf.feature_log_prob_[0]
top_pos_idx = np.argsort(pos_scores)[::-1]

pos_words = []
for i in top_pos_idx:
    if ' ' not in feature_names[i]:
        pos_words.append(feature_names[i])
    if len(pos_words) >= 40:
        break

pos_str = " ".join(pos_words[:40])
print("Top positive words:", pos_str)
```

Top positive words found: `edie antwone din gunga goldsworthy gypo yokai paulie flavia visconti gino kells ...`

These are character names and film-specific terms that appear almost exclusively in positive reviews.

### Step 4 — Submit all 10 blackbox with strongest words

```python
ch = requests.get(f"{BASE_URL}/challenge/blackbox").json()
solutions = [{"id": r['id'], "augmented_text": r['text'] + " " + pos_str} for r in ch['reviews']]
result = requests.post(f"{BASE_URL}/submit/blackbox", json={"solutions": solutions}).json()
print(json.dumps(result, indent=2))
```

The flag appears in the response when all 10 pass.

---

## Flag

```
HTB{f34tur3_0bfu5c4t10n_m45t3r3d}
```

Decoded: "Feature Obfuscation Mastered"

---

## Key Lessons

### Why Obscure Names Work Better Than Obvious Words

Words like `excellent` or `wonderful` appear in both positive AND negative reviews (e.g. "the acting was NOT excellent"). But character names like `edie` or `antwone` appear almost exclusively in positive reviews that discuss those specific beloved films. Their log-probability ratio is therefore much higher.

### Why Repeating Words Helps

In Naive Bayes, the same word appearing N times contributes N times to the log-probability sum. For very long reviews with many positive words, you need to repeat your negative/positive words to overcome the existing signal.

### Whitebox vs Blackbox Difference

| | Whitebox | Blackbox |
|---|---|---|
| Model access | Full (download pkl) | None |
| Strategy | Read `feature_log_prob_` directly | Probe API word by word |
| Efficiency | 1 query to find best words | Many queries needed |
| Result | Same words work for all reviews | May need review-specific tuning |

### The Shortcut

Even in the "blackbox" phase, since you already downloaded the model in Phase 1, you can cheat by using the whitebox model's weights to inform your blackbox word choices. This is the real insight of the challenge.

---

## Tools Used

- `curl` — API interaction
- `python3` + `requests` — scripting attacks
- `scikit-learn` + `pickle` — model inspection
- `numpy` — weight analysis
- `jq` — JSON pretty printing
