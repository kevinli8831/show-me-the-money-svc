# Expense API 使用文檔

## 概述

Expense API 用於管理旅行中嘅消費記錄，包括：
- **Expense**：消費記錄本身（例如：晚餐 $300）
- **Payer**：邊個付錢（例如：Alice 付 $200，Bob 付 $100）
- **Split**：點樣分帳（例如：Alice 應該俾 $150，Bob 應該俾 $150）

---

## 核心概念

### 1. Expense（消費記錄）

每個 expense 包含基本資料：
- `title`：消費名稱（例如：晚餐）
- `amount`：總金額（例如：300.00）
- `currency`：貨幣（例如：HKD）
- `category`：分類（例如：食飯、交通）
- `date`：消費日期
- `createdBy`：邊個建立呢個記錄

### 2. Payer（付款人）

記錄**邊個實際付咗錢**：
- `userId`：付款人 ID
- `amountPaid`：付咗幾多錢

**例子：**
```json
{
  "payers": [
    { "userId": 1, "amountPaid": "200.00" },  // Alice 付 $200
    { "userId": 2, "amountPaid": "100.00" }   // Bob 付 $100
  ]
}
```

**規則：**
- ✅ **Payers 總和必須等於 expense amount**
- ❌ 如果 payers 總和唔等於 amount，會返回錯誤

### 3. Split（分帳方式）

記錄**邊個應該俾錢**，有三種分帳方式：

---

## Split Method 詳細說明

### 方式 1：Equal（平分）

**用途：** 所有人平均分擔費用

**例子：** 3 個人食飯 $300，每人應該俾 $100

```json
{
  "amount": "300.00",
  "splits": [
    { "userId": 1, "splitMethod": "equal" },
    { "userId": 2, "splitMethod": "equal" },
    { "userId": 3, "splitMethod": "equal" }
  ]
}
```

**計算方式：**
- 每人應付金額 = `amount / 人數`
- 例子：$300 / 3 = $100/人

**注意：**
- 使用 `equal` 時，**唔需要**填 `shareAmount` 或 `percentage`
- Backend 會自動計算每人應付金額

---

### 方式 2：Custom（自訂金額）

**用途：** 每個人俾唔同嘅金額（例如：有人食得多啲）

**例子：** Alice 食得多，應該俾 $180；Bob 食得少，應該俾 $120

```json
{
  "amount": "300.00",
  "splits": [
    { "userId": 1, "shareAmount": "180.00", "splitMethod": "custom" },
    { "userId": 2, "shareAmount": "120.00", "splitMethod": "custom" }
  ]
}
```

**規則：**
- ✅ **所有 `shareAmount` 總和必須等於 `amount`**
- ❌ 如果總和唔等於 amount，會返回錯誤

**例子（錯誤）：**
```json
{
  "amount": "300.00",
  "splits": [
    { "userId": 1, "shareAmount": "150.00", "splitMethod": "custom" },
    { "userId": 2, "shareAmount": "100.00", "splitMethod": "custom" }
    // ❌ 總和 = $250，唔等於 $300
  ]
}
```

---

### 方式 3：Percentage（百分比）

**用途：** 按百分比分擔（例如：Alice 俾 60%，Bob 俾 40%）

**例子：** $300 消費，Alice 俾 60%（$180），Bob 俾 40%（$120）

```json
{
  "amount": "300.00",
  "splits": [
    { "userId": 1, "percentage": "0.6000", "splitMethod": "percentage" },
    { "userId": 2, "percentage": "0.4000", "splitMethod": "percentage" }
  ]
}
```

**規則：**
- ✅ **所有 `percentage` 總和必須等於 `1.0000`**
- ❌ 如果總和唔等於 1.0，會返回錯誤
- 百分比格式：`0.6000` = 60%，`0.4000` = 40%

**計算方式：**
- Alice 應付：$300 × 0.6 = $180
- Bob 應付：$300 × 0.4 = $120

**例子（錯誤）：**
```json
{
  "amount": "300.00",
  "splits": [
    { "userId": 1, "percentage": "0.5000", "splitMethod": "percentage" },
    { "userId": 2, "percentage": "0.3000", "splitMethod": "percentage" }
    // ❌ 總和 = 0.8，唔等於 1.0
  ]
}
```

---

## 完整例子

### 例子 1：平分晚餐

**情境：** 3 個人食飯 $300，Alice 付晒，大家平分

```json
POST /expenses
{
  "tripId": 1,
  "title": "晚餐",
  "amount": "300.00",
  "currency": "HKD",
  "category": "食飯",
  "createdBy": 1,
  "payers": [
    { "userId": 1, "amountPaid": "300.00" }  // Alice 付晒
  ],
  "splits": [
    { "userId": 1, "splitMethod": "equal" },  // Alice 應該俾 $100
    { "userId": 2, "splitMethod": "equal" },  // Bob 應該俾 $100
    { "userId": 3, "splitMethod": "equal" }   // Charlie 應該俾 $100
  ]
}
```

**結果：**
- Alice 付咗 $300，應該俾 $100 → Bob 同 Charlie 各欠 Alice $100

---

### 例子 2：自訂金額（有人食得多）

**情境：** Alice 食得多應該俾 $180，Bob 食得少應該俾 $120

```json
POST /expenses
{
  "tripId": 1,
  "title": "晚餐",
  "amount": "300.00",
  "currency": "HKD",
  "category": "食飯",
  "createdBy": 1,
  "payers": [
    { "userId": 1, "amountPaid": "200.00" },  // Alice 付 $200
    { "userId": 2, "amountPaid": "100.00" }   // Bob 付 $100
  ],
  "splits": [
    { "userId": 1, "shareAmount": "180.00", "splitMethod": "custom" },
    { "userId": 2, "shareAmount": "120.00", "splitMethod": "custom" }
  ]
}
```

**結果：**
- Alice 付 $200，應該俾 $180 → Bob 欠 Alice $20
- Bob 付 $100，應該俾 $120 → Bob 欠 Alice $20

---

### 例子 3：百分比分帳

**情境：** Alice 係老闆，俾 70%；Bob 俾 30%

```json
POST /expenses
{
  "tripId": 1,
  "title": "晚餐",
  "amount": "300.00",
  "currency": "HKD",
  "category": "食飯",
  "createdBy": 1,
  "payers": [
    { "userId": 1, "amountPaid": "300.00" }  // Alice 付晒
  ],
  "splits": [
    { "userId": 1, "percentage": "0.7000", "splitMethod": "percentage" },  // 70% = $210
    { "userId": 2, "percentage": "0.3000", "splitMethod": "percentage" }   // 30% = $90
  ]
}
```

**結果：**
- Alice 付 $300，應該俾 $210 → Bob 欠 Alice $90

---

## Validation 規則總結

| Split Method | 必填欄位 | Validation 規則 |
|--------------|---------|----------------|
| `equal` | 無 | 自動計算，唔需要填任何金額 |
| `custom` | `shareAmount` | ✅ 所有 `shareAmount` 總和 = `amount` |
| `percentage` | `percentage` | ✅ 所有 `percentage` 總和 = `1.0000` |

**Payer Validation：**
- ✅ 所有 `amountPaid` 總和 = `amount`

---

## 錯誤訊息

### Payer 總和錯誤
```json
{
  "statusCode": 400,
  "message": "Payers 總和 ($250.00) 唔等於 expense amount ($300.00)"
}
```

### Split (shareAmount) 總和錯誤
```json
{
  "statusCode": 400,
  "message": "Splits 總和 ($250.00) 唔等於 expense amount ($300.00)"
}
```

### Split (percentage) 總和錯誤
```json
{
  "statusCode": 400,
  "message": "Splits percentage 總和 (0.8000) 唔等於 1.0000"
}
```

---

## API Endpoints

### 建立 Expense
```http
POST /expenses
Content-Type: application/json

{
  "tripId": 1,
  "title": "晚餐",
  "amount": "300.00",
  "currency": "HKD",
  "category": "食飯",
  "createdBy": 1,
  "payers": [...],
  "splits": [...]
}
```

### 更新 Expense 基本資料
```http
PATCH /expenses/:id
Content-Type: application/json

{
  "title": "午餐",
  "amount": "250.00"
}
```

---

## 常見問題 (FAQ)

### Q1: 可唔可以唔填 payers 或 splits？
**A:** 可以！Payers 同 splits 都係 optional。如果唔填，就只係記錄消費，唔記錄邊個付錢同點樣分帳。

### Q2: 可唔可以混合使用唔同嘅 split method？
**A:** 唔可以！所有 splits 必須使用同一種 method（`equal`、`custom` 或 `percentage`）。

### Q3: Percentage 點解要用 `0.6000` 而唔係 `60`？
**A:** 因為 database 儲存嘅係 decimal，`0.6000` = 60%，`1.0000` = 100%。

### Q4: 如果我想改 payers 或 splits 點算？
**A:** 目前只能用 `PATCH /expenses/:id` 更新基本資料。如果想改 payers/splits，需要刪除 expense 再重新建立。

---

## 最佳實踐

1. **使用 `equal` 當大家平分**：最簡單，唔需要計算
2. **使用 `custom` 當金額唔同**：適合有人食得多/少嘅情況
3. **使用 `percentage` 當有固定比例**：適合老闆請客、AA 制等情況
4. **先計好總和**：建立 expense 前先確保 payers 同 splits 總和正確
5. **用 string 儲存金額**：避免 floating point precision 問題（例如：`"300.00"` 而唔係 `300`）
