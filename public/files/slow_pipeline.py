"""DukaLink monthly refresh: order summary for the top retail accounts.

Produces customer_summary.csv for the Growth team's month-end review.
The output is correct. The runtime is the problem: your Task 6 job is to
find out where the time actually goes before you touch anything.

Usage: python slow_pipeline.py
"""
import time

import pandas as pd

TOP_N = 40
ORDERS_PATH = "dukalink_orders.csv"
BIG_ORDER_KES = 100000


def load_orders():
    """Read the raw orders export from the data platform."""
    return pd.read_csv(ORDERS_PATH)


def top_customer_summary(top_n=TOP_N):
    """Aggregate orders, value, and late deliveries for the top accounts."""
    orders = load_orders()
    top_ids = orders["customer_id"].value_counts().head(top_n).index
    rows = []
    for cid in top_ids:
        total = 0.0
        n = 0
        late = 0
        # re-scans the entire order table for every single customer
        for _, r in orders.iterrows():
            if r["customer_id"] == cid:
                total += r["order_value_kes"]
                n += 1
                late += r["delivered_late"]
        rows.append({"customer_id": cid, "orders": n,
                     "total_value_kes": total, "late_orders": late})
    return pd.DataFrame(rows)


def flag_big_orders():
    """Label orders above the finance review threshold."""
    orders = load_orders()  # reads the CSV from disk a second time
    orders["size_flag"] = orders.apply(
        lambda r: "BIG" if r["order_value_kes"] > BIG_ORDER_KES else "normal",
        axis=1)
    return orders


if __name__ == "__main__":
    started = time.time()
    summary = top_customer_summary()
    flagged = flag_big_orders()
    summary.to_csv("customer_summary.csv", index=False)
    print(summary.sort_values("total_value_kes", ascending=False).head())
    print(f"Refresh finished in {time.time() - started:.0f}s")
